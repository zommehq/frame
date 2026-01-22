import { MessageEvent } from "./constants";
import { FunctionManager } from "./helpers/function-manager";
import { createLogger } from "./helpers/logger";
import { validateMessage } from "./helpers/message-validators";
import type {
  CustomEventMessage,
  FrameProps,
  FunctionCallMessage,
  FunctionReleaseMessage,
  FunctionResponseMessage,
} from "./types";

const logger = createLogger("z-frame");

/**
 * Web Component for embedding micro-frontend frames in iframes
 *
 * Provides secure iframe isolation with bidirectional PostMessage communication.
 * Supports dynamic attributes/properties, registered function calls, and event system.
 *
 * ## Event Naming Convention
 * - Internal events use `namespace:action` format: `frame:ready`, `route:change`
 * - Custom events use `kebab-case` format: `task-created`, `user-updated`
 *
 * ## Registered Functions
 * Child frames can register functions via `frameSDK.register()` that parent can call:
 * - Child: `frameSDK.register('refreshData', () => loadData())`
 * - Parent: `frame.refreshData()` → calls the registered function (returns Promise)
 *
 * @example
 * ```html
 * <z-frame
 *   name="my-app"
 *   base="/my-app"
 *   src="http://localhost:3000"
 *   api-url="https://api.example.com"
 *   theme="dark"
 * ></z-frame>
 * ```
 *
 * @example
 * ```typescript
 * const frame = document.querySelector('z-frame');
 *
 * // Set properties via property binding (auto-detected)
 * frame.theme = 'dark';
 * frame.user = currentUser;
 *
 * // Send event to frame
 * frame.emit('route-change', { path: '/settings' });
 *
 * // Call registered function from child (returns Promise)
 * const stats = await frame.getStats();
 * await frame.refreshData();
 *
 * // Listen to frame events
 * frame.addEventListener('ready', () => console.log('Ready'));
 * frame.addEventListener('navigate', (e) => router.push(e.detail.path));
 * ```
 */
export class Frame extends HTMLElement {
  /**
   * Attributes that should not be sent as props or observed dynamically
   * (iframe-specific or already handled specially)
   */
  static readonly EXCLUDED_ATTRS = ["src", "sandbox", "base", "name", "pathname"];

  /**
   * Observed attributes for Web Component lifecycle
   */
  static get observedAttributes() {
    return ["base", "name", "pathname", "sandbox", "src"];
  }

  _iframe!: HTMLIFrameElement;
  _observer?: MutationObserver;
  _ready = false;
  _origin!: string;
  _port!: MessagePort;

  // Function call support
  _manager!: FunctionManager;

  // Cache for dynamically created methods
  _dynamicMethods = new Map<string, Function>();

  // Handler reference for cleanup
  _portMessageHandler?: (event: MessageEvent) => void;

  // Storage for dynamic properties
  _propValues = new Map<string, unknown>();

  // Set of properties that have been defined with getter/setter
  _definedProps = new Set<string>();

  // Functions registered by child frame via frame:register event
  _registeredFunctions = new Map<string, Function>();

  /**
   * Creates a new z-frame element
   *
   * Initializes the function manager for cross-iframe communication.
   */
  constructor() {
    super();

    // Initialize function manager
    this._manager = new FunctionManager((message, transferables = []) => {
      this._sendToIframe(message, transferables);
    });
  }

  /**
   * Sync a property value to the iframe
   *
   * Only syncs if frame is ready. Serializes the value (including functions)
   * and sends via MessagePort.
   */
  _syncPropertyToIframe(prop: string, value: unknown): void {
    if (!this._ready) return;

    try {
      const { serialized, transferables } = this._manager.serialize(value);

      const success = this._sendToIframe(
        {
          attribute: prop,
          type: MessageEvent.ATTRIBUTE_CHANGE,
          value: serialized,
        },
        transferables,
      );

      if (!success) {
        console.warn(`[z-frame] Failed to sync property '${prop}' to iframe`);
        this._emit("error", {
          message: `Failed to sync property '${prop}' to iframe`,
          property: prop,
        });
      }
    } catch (error) {
      console.error(`[z-frame] Failed to serialize property '${prop}':`, error);
      this._emit("error", {
        message: `Property serialization failed: ${prop}`,
        error,
      });
    }
  }

  /**
   * Get frame name
   */
  get name(): string | null {
    return this.getAttribute("name");
  }

  /**
   * Get frame source URL
   */
  get src(): string | null {
    return this.getAttribute("src");
  }

  /**
   * Get base path for routing
   * Falls back to /name if base attribute not set
   * Normalizes to start with / and removes trailing slash
   */
  get base(): string {
    let base = this.getAttribute("base") || `/${this.name}`;

    // Ensure starts with /
    if (!base.startsWith("/")) {
      base = `/${base}`;
    }

    // Remove trailing slash (but keep single "/" as is)
    if (base.length > 1 && base.endsWith("/")) {
      base = base.slice(0, -1);
    }

    return base;
  }

  /**
   * Get sandbox permissions
   */
  get sandbox(): string {
    return (
      this.getAttribute("sandbox") ||
      "allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
    );
  }

  /**
   * Get pathname for initial route
   * Normalizes to always start with / and defaults to /
   */
  get pathname(): string {
    const value = this.getAttribute("pathname");

    // Default to "/" if empty/null
    if (!value || value.trim() === "") {
      return "/";
    }

    // Ensure starts with /
    return value.startsWith("/") ? value : `/${value}`;
  }

  /**
   * Web Component lifecycle: called when an observed attribute changes
   */
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (oldValue === newValue) return;

    // If element is connected and we now have both name and src, initialize
    if (this.isConnected && this.name && this.src && !this._iframe) {
      try {
        this._origin = new URL(this.src).origin;
        this._initialize();
      } catch (error) {
        console.error(`[z-frame] Initialization failed:`, error);
        this._emit("error", {
          message: error instanceof Error ? error.message : "Initialization failed",
          error,
        });
      }
    }

    // If src changes after initialization, warn
    if (name === "src" && this._iframe && oldValue) {
      logger.warn("Changing src attribute after initialization is not supported");
    }

    // Handle dynamic attribute changes after frame is ready
    // Send PROPS_UPDATE for attributes that should be synced to frameSDK.props
    if (this._ready) {
      // pathname: use getter (already normalized)
      if (name === "pathname") {
        this._sendPropUpdate({ pathname: this.pathname });
      }
      // base: use getter (already normalized)
      else if (name === "base") {
        this._sendPropUpdate({ base: this.base });
      }
      // name: send as-is
      else if (name === "name") {
        this._sendPropUpdate({ name: newValue });
      }
      // Other custom attributes: send (but not src/sandbox which are iframe-only)
      else if (name !== "src" && name !== "sandbox") {
        this._sendPropUpdate({ [name]: newValue });
      }
    }
  }

  /**
   * Web Component lifecycle: called when element is added to DOM
   *
   * Creates the iframe, sets up message listeners, and initializes
   * communication with the child frame.
   *
   * Note: Initialization may be deferred until attributes are set via attributeChangedCallback
   */
  connectedCallback() {
    // If both name and src are already set, initialize immediately
    if (this.name && this.src && !this._iframe) {
      try {
        this._origin = new URL(this.src).origin;
        this._initialize();
      } catch (error) {
        console.error(`[z-frame] Initialization failed:`, error);
        this._emit("error", {
          message: error instanceof Error ? error.message : "Initialization failed",
          error,
        });
      }
    }
    // Otherwise, wait for attributeChangedCallback to trigger initialization
  }

  /**
   * Initialize the frame
   *
   * Orchestrates the full initialization process:
   * 1. Create and setup iframe
   * 2. Wait for iframe to load
   * 3. Collect and serialize props
   * 4. Send INIT message to child
   * 5. Setup attribute observer
   */
  private async _initialize() {
    const channel = this._setupIframeAndChannel();
    await this._waitForIframeLoad();
    const props = this._collectAllProps();
    this._sendInitMessage(channel, props);
    this._setupAttributeObserver();
  }

  /**
   * Create iframe element and setup MessageChannel for communication
   *
   * @returns MessageChannel for parent-child communication
   */
  private _setupIframeAndChannel(): MessageChannel {
    // Create and configure iframe
    this._iframe = document.createElement("iframe");

    // Normalize URL construction to handle trailing slashes
    const src = this.src!;
    const pathname = this.pathname;

    // Remove trailing slash from src, pathname already starts with /
    const normalizedSrc = src.endsWith("/") ? src.slice(0, -1) : src;
    this._iframe.src = normalizedSrc + pathname;

    this._iframe.style.cssText = "border:none;display:block;height:100%;width:100%;";
    this._iframe.setAttribute("sandbox", this.sandbox);

    // Create MessageChannel for dedicated communication
    const channel = new MessageChannel();
    this._port = channel.port1;

    // Setup message handler on our port
    this._portMessageHandler = (event) => {
      try {
        this._handleMessageFromIframe(event.data);
      } catch (error) {
        logger.error("Error handling message from iframe:", error);
        this._emit("error", { message: "Message handler error", error });
      }
    };
    this._port.onmessage = this._portMessageHandler;

    // Add iframe to DOM
    this.appendChild(this._iframe);

    return channel;
  }

  /**
   * Wait for iframe to load with timeout and error handling
   *
   * @throws Error if iframe fails to load or timeout occurs
   */
  private _waitForIframeLoad(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Iframe load timeout after 10s: ${this.src}`));
      }, 10000);

      const handler = (event: Event) => {
        cleanup();
        if (event.type === "error") {
          reject(new Error(`Failed to load iframe: ${this.src}`));
        } else {
          resolve();
        }
      };

      const cleanup = () => {
        clearTimeout(timeoutId);
        this._iframe.removeEventListener("load", handler);
        this._iframe.removeEventListener("error", handler);
      };

      this._iframe.addEventListener("load", handler, { once: true });
      this._iframe.addEventListener("error", handler, { once: true });
    }).catch((error) => {
      logger.error("Iframe initialization failed:", error);
      this._emit("error", { message: "Iframe load failed", error });
      throw error;
    });
  }

  /**
   * Collect all attributes and properties to send to child
   *
   * Collects HTML attributes (strings) and JavaScript properties (any type including functions).
   * JavaScript properties override HTML attributes with the same name.
   *
   * @returns Props object with all attributes and properties
   */
  private _collectAllProps(): Record<string, unknown> {
    // Start with base, name, and pathname
    const props: Record<string, unknown> = {
      base: this.base,
      name: this.name,
      pathname: this.pathname,
    };

    // Collect ALL HTML attributes except those in EXCLUDED_ATTRS
    for (let i = 0; i < this.attributes.length; i++) {
      const attr = this.attributes[i];
      if (!Frame.EXCLUDED_ATTRS.includes(attr.name)) {
        props[attr.name] = attr.value;
      }
    }

    // Collect dynamic properties from _propValues
    for (const [key, value] of this._propValues.entries()) {
      if (value !== undefined) {
        props[key] = value;
      }
    }

    return props;
  }

  /**
   * Send INIT message to child with serialized props
   *
   * @param channel - MessageChannel to transfer port2 to child
   * @param props - Props to serialize and send
   * @throws Error if contentWindow is not accessible
   */
  private _sendInitMessage(channel: MessageChannel, props: Record<string, unknown>): void {
    // Serialize props (including functions and transferables)
    const { serialized, transferables } = this._manager.serialize(props);

    // Send INIT message with port2 transfer
    const contentWindow = this._iframe.contentWindow;
    if (!contentWindow) {
      throw new Error("[z-frame] Iframe contentWindow is not accessible");
    }

    contentWindow.postMessage(
      {
        payload: serialized as FrameProps,
        type: MessageEvent.INIT,
      },
      this._origin,
      [channel.port2, ...transferables],
    );
  }

  /**
   * Send prop updates to child iframe
   *
   * Used when attributes change dynamically to keep frameSDK.props in sync
   *
   * @param updates - Object with prop keys and new values
   */
  private _sendPropUpdate(updates: Record<string, unknown>): void {
    if (!this._ready) return;

    const { serialized, transferables } = this._manager.serialize(updates);

    this._sendToIframe(
      {
        type: MessageEvent.PROPS_UPDATE,
        payload: serialized,
      },
      transferables,
    );
  }

  /**
   * Setup MutationObserver to watch for attribute changes
   *
   * Observes attribute changes and syncs them to the child iframe.
   * Only observes attributes that are not fixed (not base, name, sandbox, src).
   */
  private _setupAttributeObserver(): void {
    this._observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        const attrName = mutation.attributeName;
        if (attrName && !Frame.EXCLUDED_ATTRS.includes(attrName)) {
          const value = this.getAttribute(attrName);
          const { serialized, transferables } = this._manager.serialize(value);

          this._sendToIframe(
            {
              attribute: attrName,
              type: MessageEvent.ATTRIBUTE_CHANGE,
              value: serialized,
            },
            transferables,
          );
        }
      });
    });

    this._observer.observe(this, {
      attributes: true,
      attributeOldValue: false,
    });
  }

  private _handleMessageFromIframe(data: unknown) {
    // Use shared validation utility to reduce code duplication
    const message = validateMessage(data, "[z-frame]");
    if (!message) {
      return; // Validation failed, error already logged
    }

    const { type } = message;

    switch (type) {
      case MessageEvent.READY:
        this._ready = true;
        this._dispatchLocalEvent("ready", { name: this.name });
        break;

      case MessageEvent.CUSTOM_EVENT: {
        const customMsg = message as CustomEventMessage;
        const payload = customMsg.payload;
        if (!payload?.name || typeof payload.name !== "string") {
          logger.warn("Invalid CUSTOM_EVENT message:", message);
          return;
        }

        // Deserialize payload data to convert function tokens into callable proxies
        const deserializedData = this._manager.deserialize(payload.data);

        this._dispatchLocalEvent(payload.name, deserializedData);
        break;
      }

      case MessageEvent.FUNCTION_CALL: {
        const callMsg = message as FunctionCallMessage;
        if (!callMsg.callId || !callMsg.fnId) {
          logger.warn("Invalid FUNCTION_CALL message:", message);
          return;
        }
        this._manager.handleFunctionCall(callMsg.callId, callMsg.fnId, callMsg.params);
        break;
      }

      case MessageEvent.FUNCTION_RESPONSE: {
        const respMsg = message as FunctionResponseMessage;
        const { callId, success, result, error: errorResult } = respMsg;
        if (!callId || typeof success !== "boolean") {
          logger.warn("Invalid FUNCTION_RESPONSE message:", message);
          return;
        }
        this._manager.handleFunctionResponse(callId, success, result, errorResult);
        break;
      }

      case MessageEvent.FUNCTION_RELEASE: {
        const releaseMsg = message as FunctionReleaseMessage;
        if (!releaseMsg.fnId) {
          logger.warn("Invalid FUNCTION_RELEASE message:", message);
          return;
        }
        this._manager.releaseFunction(releaseMsg.fnId);
        break;
      }

      case MessageEvent.FUNCTION_RELEASE_BATCH: {
        const batchMsg = message as { fnIds: string[] };
        if (!Array.isArray(batchMsg.fnIds)) {
          logger.warn("Invalid FUNCTION_RELEASE_BATCH message:", message);
          return;
        }
        for (const fnId of batchMsg.fnIds) {
          this._manager.releaseFunction(fnId);
        }
        break;
      }

      default:
        console.warn(`[z-frame] Unknown message type: ${type}`);
    }
  }

  /**
   * Send event to child iframe
   *
   * @param eventName - Event name
   * @param data - Event data
   *
   * @example
   * ```typescript
   * frame.emit('route-change', { path: '/settings' });
   *
   * frame.emit('data-refresh', { force: true });
   * ```
   */
  emit(eventName: string, data?: unknown) {
    if (!eventName || !/^[a-zA-Z0-9_:.-]+$/.test(eventName)) {
      logger.error("Invalid event name:", eventName);
      return;
    }

    this._emitToChild(eventName, data);
  }

  /**
   * Internal method to send event to child iframe
   */
  _emitToChild(eventName: string, data?: unknown) {
    if (!this._port) {
      logger.warn("MessagePort not ready, cannot emit event");
      return;
    }

    const { serialized, transferables } = this._manager.serialize(data);

    this._sendToIframe(
      {
        name: eventName,
        data: serialized,
        type: MessageEvent.EVENT,
      },
      transferables,
    );
  }

  /**
   * Helper to dispatch custom events on this element
   *
   * Simplifies the boilerplate of creating and dispatching CustomEvent
   *
   * @param name - Event name
   * @param detail - Event detail payload
   * @param options - Optional bubbles/composed overrides (defaults: bubbles=true, composed=true)
   */
  private _emit(
    name: string,
    detail?: unknown,
    options: { bubbles?: boolean; composed?: boolean } = {},
  ) {
    this.dispatchEvent(
      new CustomEvent(name, {
        bubbles: options.bubbles ?? true,
        composed: options.composed ?? true,
        detail,
      }),
    );
  }

  /**
   * Dispatch custom event on parent (from child emissions)
   */
  private _dispatchLocalEvent(name: string, detail?: unknown) {
    if (!name || !/^[a-zA-Z0-9_:.-]+$/.test(name)) {
      logger.warn("Invalid event name:", name);
      return;
    }

    // Intercept frame:register event to store registered functions
    if (name === "register" && detail && typeof detail === "object") {
      for (const [fnName, fn] of Object.entries(detail as Record<string, unknown>)) {
        if (typeof fn === "function") {
          this._registeredFunctions.set(fnName, fn as Function);
        }
      }
    }

    // Intercept frame:unregister event to remove registered functions
    if (name === "unregister" && detail && typeof detail === "object") {
      const { functions } = detail as { functions?: string[] };
      if (Array.isArray(functions)) {
        for (const fnName of functions) {
          this._registeredFunctions.delete(fnName);
        }
      }
    }

    // Dispatch DOM CustomEvent
    this._emit(name, detail);

    // Try property handler (e.g., frame.handleReady)
    const handlerName = name.replace(/[:.-]/g, "");
    if (Object.hasOwn(this, handlerName)) {
      const handler = Reflect.get(this, handlerName);
      if (typeof handler === "function") {
        handler.call(this, detail);
      }
    }
  }

  /**
   * Send message to iframe via MessagePort with optional transferables
   *
   * Handles errors gracefully (e.g., DataCloneError, port closed, transferable already transferred)
   */
  private _sendToIframe(message: unknown, transferables: Transferable[] = []): boolean {
    if (!this._port) {
      logger.error("MessagePort not ready");
      return false;
    }

    try {
      this._port.postMessage(message, transferables);
      return true;
    } catch (error) {
      logger.error("Failed to send message:", error);

      this._emit("message-send-failed", {
        error: error instanceof Error ? error.message : String(error),
        message,
        transferablesCount: transferables.length,
      });

      return false;
    }
  }

  /**
   * Internal cleanup method called on disconnect or error
   */
  private _cleanup(): void {
    this._observer?.disconnect();
    this._observer = undefined;

    // Release tracked functions
    const functionIds = Array.from(this._manager?.getTrackedFunctions() || []);
    if (functionIds.length > 0) {
      this._sendToIframe({
        fnIds: functionIds,
        type: MessageEvent.FUNCTION_RELEASE_BATCH,
      });
    }

    // Clean up port and handlers
    if (this._port) {
      this._port.onmessage = null;
      this._port.close();
    }
    this._portMessageHandler = undefined;

    // Clean up remaining resources
    this._manager?.cleanup();
    this._dynamicMethods?.clear();
    this._propValues?.clear();
    this._definedProps?.clear();
    this._registeredFunctions?.clear();
    this._iframe?.remove();

    // Reset ready state
    this._ready = false;
  }

  /**
   * Web Component lifecycle: called when element is removed from DOM
   *
   * Cleans up observers, releases tracked functions, closes port, and removes the iframe.
   */
  disconnectedCallback() {
    this._cleanup();
  }
}

/**
 * Setup Proxy on prototype to intercept property access and assignment.
 *
 * GET trap: Creates dynamic methods for camelCase property access
 *   - frame.refreshData() → calls registered function 'refreshData' in child
 *   - Returns Promise.reject if function not registered
 *
 * SET trap: Creates reactive getter/setter for dynamic properties
 *   - frame.myProp = value → syncs to iframe automatically
 */
const setupPrototypeProxy = () => {
  const proto = Frame.prototype;
  const protoOfProto = Object.getPrototypeOf(proto);

  const proxiedProto = new Proxy(protoOfProto, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (value !== undefined) return value;

      // Dynamic method pattern for camelCase function calls
      // frame.refreshData() → calls registered function 'refreshData'
      if (typeof prop === "string" && /^[a-z][a-zA-Z0-9]*$/.test(prop)) {
        const instance = receiver as Frame;

        // Check if we have a cached method
        if (instance._dynamicMethods?.has(prop)) {
          return instance._dynamicMethods.get(prop);
        }

        // Create method that calls registered function or rejects
        const method = (...args: unknown[]): Promise<unknown> => {
          const fn = instance._registeredFunctions?.get(prop);
          if (fn) {
            // Call the registered function (already async via RPC)
            return Promise.resolve(fn(...args));
          }
          // Function not registered - reject with clear error
          return Promise.reject(
            new Error(`Function '${prop}' not registered by child frame '${instance.name}'`),
          );
        };

        instance._dynamicMethods?.set(prop, method);
        return method;
      }

      return undefined;
    },

    set(target, prop, value, receiver) {
      // Allow symbols and non-string props
      if (typeof prop !== "string") {
        return Reflect.set(target, prop, value, receiver);
      }

      // Allow private properties
      if (prop.startsWith("_")) {
        return Reflect.set(target, prop, value, receiver);
      }

      const instance = receiver as Frame;

      // Allow native HTMLElement properties, Frame methods, and excluded attributes
      if (
        Frame.EXCLUDED_ATTRS.includes(prop) ||
        prop in HTMLElement.prototype ||
        prop in Frame.prototype
      ) {
        return Reflect.set(target, prop, value, receiver);
      }

      // Dynamic property - create reactive getter/setter
      if (!instance._definedProps.has(prop)) {
        instance._definedProps.add(prop);
        Object.defineProperty(receiver, prop, {
          configurable: true,
          enumerable: true,
          get: () => instance._propValues.get(prop),
          set: (v) => {
            instance._propValues.set(prop, v);
            instance._syncPropertyToIframe(prop, v);
          },
        });
      }

      // Set value and sync to iframe
      instance._propValues.set(prop, value);
      instance._syncPropertyToIframe(prop, value);

      return true;
    },
  });

  Object.setPrototypeOf(proto, proxiedProto);
};

// Apply prototype proxy BEFORE registering custom element
setupPrototypeProxy();

// Register the custom element
if (!customElements.get("z-frame")) {
  customElements.define("z-frame", Frame);
} else {
  logger.warn("z-frame already registered");
}
