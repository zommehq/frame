import { MessageEvent } from "./constants";
import { FunctionManager } from "./helpers/function-manager";
import { createLogger } from "./helpers/logger";
import { validateMessage } from "./helpers/message-validators";
import type {
  CustomEventMessage,
  FragmentFrameProps,
  FunctionCallMessage,
  FunctionReleaseMessage,
  FunctionResponseMessage,
} from "./types";

const logger = createLogger("fragment-frame");

/**
 * Web Component for embedding micro-frontend fragments in iframes
 *
 * Provides secure iframe isolation with bidirectional PostMessage communication.
 * Supports dynamic attributes/properties, method calls, and event system.
 *
 * @example
 * ```html
 * <fragment-frame
 *   name="my-app"
 *   base="/my-app"
 *   src="http://localhost:3000"
 *   api-url="https://api.example.com"
 *   theme="dark"
 * ></fragment-frame>
 * ```
 *
 * @example
 * ```typescript
 * const fragment = document.querySelector('fragment-frame');
 *
 * // Set properties via property binding (auto-detected)
 * fragment.theme = 'dark';
 * fragment.user = currentUser;
 *
 * // Send event to fragment
 * fragment.emit('theme-changed', { theme: 'dark' });
 *
 * // Listen to fragment events
 * fragment.addEventListener('ready', () => console.log('Ready'));
 * fragment.addEventListener('navigate', (e) => router.push(e.detail.path));
 * ```
 */
export class FragmentFrame extends HTMLElement {
  static readonly ATTRS_REGEX = /^(base|name|sandbox|src)$/;

  /**
   * Observed attributes for Web Component lifecycle
   */
  static get observedAttributes() {
    return ["base", "name", "sandbox", "src"];
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

  // Property watcher state
  private _watcherRAF?: number;
  private _watcherTimeout?: ReturnType<typeof setTimeout>;
  private _watcherPhase: "burst" | "slow" | "stopped" = "stopped";

  /**
   * Creates a new fragment-frame element
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
   * Only syncs if fragment is ready. Serializes the value (including functions)
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
        console.warn(`[fragment-frame] Failed to sync property '${prop}' to iframe`);
        this._emit("error", {
          message: `Failed to sync property '${prop}' to iframe`,
          property: prop,
        });
      }
    } catch (error) {
      console.error(`[fragment-frame] Failed to serialize property '${prop}':`, error);
      this._emit("error", {
        message: `Property serialization failed: ${prop}`,
        error,
      });
    }
  }

  /**
   * Get fragment name
   */
  get name(): string | null {
    return this.getAttribute("name");
  }

  /**
   * Get fragment source URL
   */
  get src(): string | null {
    return this.getAttribute("src");
  }

  /**
   * Get base path for routing
   * Falls back to /name or /fragment if base attribute not set
   */
  get base(): string {
    return this.getAttribute("base") || `/${this.name || "fragment"}`;
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
        console.error(`[fragment-frame] Initialization failed:`, error);
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
  }

  /**
   * Web Component lifecycle: called when element is added to DOM
   *
   * Creates the iframe, sets up message listeners, and initializes
   * communication with the child fragment.
   *
   * Note: Initialization may be deferred until attributes are set via attributeChangedCallback
   */
  connectedCallback() {
    // Capture any properties that were set BEFORE connectedCallback
    this._captureExistingProperties();

    // Start watching for new properties (frameworks may set them after connectedCallback)
    this._startPropertyWatcher();

    // If both name and src are already set, initialize immediately
    if (this.name && this.src && !this._iframe) {
      try {
        this._origin = new URL(this.src).origin;
        this._initialize();
      } catch (error) {
        console.error(`[fragment-frame] Initialization failed:`, error);
        this._emit("error", {
          message: error instanceof Error ? error.message : "Initialization failed",
          error,
        });
      }
    }
    // Otherwise, wait for attributeChangedCallback to trigger initialization
  }

  /**
   * Capture properties that were set on the element before connectedCallback.
   * Converts them to reactive properties with getters/setters.
   */
  private _captureExistingProperties(): void {
    const ownProps = Object.getOwnPropertyNames(this);

    for (const prop of ownProps) {
      // Early exit for private properties
      if (prop.startsWith("_")) continue;

      if (this._shouldInterceptProperty(prop)) {
        const descriptor = Object.getOwnPropertyDescriptor(this, prop);

        // Only capture data properties (not getters/setters)
        if (descriptor && "value" in descriptor) {
          const value = descriptor.value;

          // Store value
          this._propValues.set(prop, value);

          // Delete the data property
          delete (this as any)[prop];

          // Define getter/setter
          this._defineReactiveProperty(prop);
        }
      }
    }
  }

  /**
   * Check if a property should be intercepted
   *
   * Uses dynamic check against HTMLElement.prototype instead of a hardcoded list.
   */
  private _shouldInterceptProperty(prop: string): boolean {
    return (
      typeof prop === "string" &&
      !prop.startsWith("_") &&
      !FragmentFrame.ATTRS_REGEX.test(prop) &&
      !this._definedProps.has(prop) &&
      !(prop in HTMLElement.prototype) &&
      prop !== "emit"
    );
  }

  /**
   * Define a reactive property with getter/setter
   */
  private _defineReactiveProperty(prop: string): void {
    if (this._definedProps.has(prop)) return;
    this._definedProps.add(prop);

    Object.defineProperty(this, prop, {
      configurable: true,
      enumerable: true,
      get: () => this._propValues.get(prop),
      set: (value: unknown) => {
        this._propValues.set(prop, value);
        this._syncPropertyToIframe(prop, value);
      },
    });
  }

  /**
   * Watch for new properties being added to the element.
   *
   * Uses a two-phase approach for optimal performance:
   * - BURST phase: High frequency (requestAnimationFrame) for ~1 second
   * - SLOW phase: Low frequency (200ms intervals) for ~4 more seconds
   *
   * Stops early if no new properties are detected for several consecutive checks.
   */
  private _startPropertyWatcher(): void {
    let burstCount = 0;
    let slowCount = 0;
    let emptyChecks = 0;

    // Configuration
    const BURST_MAX = 60; // ~1 second at 60fps
    const BURST_EMPTY_STOP = 10; // Stop after 10 consecutive empty checks
    const SLOW_INTERVAL = 200; // 200ms between slow checks
    const SLOW_MAX = 20; // ~4 seconds of slow checking

    this._watcherPhase = "burst";

    const checkForNewProps = () => {
      if (this._watcherPhase === "stopped") return;

      let foundNew = false;
      const ownProps = Object.getOwnPropertyNames(this);

      for (const prop of ownProps) {
        // Early exit for private properties
        if (prop.startsWith("_")) continue;

        if (this._shouldInterceptProperty(prop)) {
          const descriptor = Object.getOwnPropertyDescriptor(this, prop);

          if (descriptor && "value" in descriptor) {
            const value = descriptor.value;
            foundNew = true;

            this._propValues.set(prop, value);
            delete (this as any)[prop];
            this._defineReactiveProperty(prop);

            // Trigger setter to sync (if ready)
            (this as any)[prop] = value;
          }
        }
      }

      // Smart stop logic
      if (foundNew) {
        emptyChecks = 0;
      } else {
        emptyChecks++;
      }

      // Stop if too many consecutive empty checks
      if (emptyChecks >= BURST_EMPTY_STOP) {
        this._watcherPhase = "stopped";
        return;
      }

      // BURST phase
      if (this._watcherPhase === "burst") {
        burstCount++;
        if (burstCount >= BURST_MAX) {
          this._watcherPhase = "slow";
          this._watcherTimeout = setTimeout(checkForNewProps, SLOW_INTERVAL);
        } else {
          this._watcherRAF = requestAnimationFrame(checkForNewProps);
        }
        return;
      }

      // SLOW phase
      if (this._watcherPhase === "slow") {
        slowCount++;
        if (slowCount >= SLOW_MAX) {
          this._watcherPhase = "stopped";
        } else {
          this._watcherTimeout = setTimeout(checkForNewProps, SLOW_INTERVAL);
        }
      }
    };

    this._watcherRAF = requestAnimationFrame(checkForNewProps);
  }

  private _stopPropertyWatcher(): void {
    this._watcherPhase = "stopped";

    if (this._watcherRAF) {
      cancelAnimationFrame(this._watcherRAF);
      this._watcherRAF = undefined;
    }

    if (this._watcherTimeout) {
      clearTimeout(this._watcherTimeout);
      this._watcherTimeout = undefined;
    }
  }

  /**
   * Initialize the fragment frame
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
    this._iframe.src = this.src!;
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
    // Start with base and name
    const props: Record<string, unknown> = { base: this.base, name: this.name };

    // Collect HTML attributes (string values only)
    for (let i = 0; i < this.attributes.length; i++) {
      const attr = this.attributes[i];
      if (!FragmentFrame.ATTRS_REGEX.test(attr.name)) {
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
      throw new Error("[fragment-frame] Iframe contentWindow is not accessible");
    }

    contentWindow.postMessage(
      {
        payload: serialized as FragmentFrameProps,
        type: MessageEvent.INIT,
      },
      this._origin,
      [channel.port2, ...transferables],
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
        if (attrName && !FragmentFrame.ATTRS_REGEX.test(attrName)) {
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
    const message = validateMessage(data, "[fragment-frame]");
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
        console.warn(`[fragment-frame] Unknown message type: ${type}`);
    }
  }

  /**
   * Send event to child iframe
   *
   * Can be called directly or via camelCase method syntax.
   *
   * @param eventName - Event name (kebab-case)
   * @param data - Event data
   *
   * @example
   * ```typescript
   * // Direct call
   * frame.emit('theme-change', { theme: 'dark' });
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
  private _emitToChild(eventName: string, data?: unknown) {
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
    // Stop property watcher
    this._stopPropertyWatcher();

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

// Register the custom element
if (!customElements.get("fragment-frame")) {
  customElements.define("fragment-frame", FragmentFrame);
} else {
  logger.warn("fragment-frame already registered");
}
