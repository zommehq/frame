import type {
  CustomEventMessage,
  FragmentFrameProps,
  FunctionCallMessage,
  FunctionReleaseMessage,
  FunctionResponseMessage,
  Message,
} from './types';
import { MessageEvent } from './constants';
import { FunctionManager } from './helpers/function-manager';
import { createLogger } from './helpers/logger';
import { validateMessage } from './helpers/message-validators';
import { kebabCase } from './helpers/string-utils';

const logger = createLogger('fragment-frame');

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
 * // Call fragment method
 * const data = await fragment.callMethod('getUserData', { id: 123 });
 *
 * // Send event to fragment
 * fragment.emitEvent('theme-changed', { theme: 'dark' });
 *
 * // Listen to fragment events
 * fragment.addEventListener('ready', () => console.log('Ready'));
 * fragment.addEventListener('navigate', (e) => router.push(e.detail.path));
 * ```
 */
export class FragmentFrame extends HTMLElement {
  private static readonly ATTRS_REGEX = /^(base|name|sandbox|src)$/;

  /**
   * Observed attributes for Web Component lifecycle
   */
  static get observedAttributes() {
    return ['base', 'name', 'sandbox', 'src'];
  }

  private _iframe!: HTMLIFrameElement;
  private _observer?: MutationObserver;
  private _ready = false;
  private _origin!: string;
  private _port!: MessagePort;

  // Function call support
  private _manager!: FunctionManager;

  // Cache for dynamically created methods
  private _dynamicMethods = new Map<string, Function>();

  // Handler reference for cleanup
  private _portMessageHandler?: (event: MessageEvent) => void;

  /**
   * Creates a new fragment-frame element
   *
   * Initializes the function manager and sets up property interception via Proxy
   * Note: Proxy is not returned to maintain Angular compatibility
   */
  constructor() {
    super();

    // Initialize function manager
    this._manager = new FunctionManager((message, transferables = []) => {
      this._sendToIframe(message, transferables);
    });

    // Setup Proxy for property interception (not returned for Angular compatibility)
    new Proxy(this, {
      set(target, prop, value): boolean {
        const result = Reflect.set(target, prop, value);

        // Only public properties (not starting with _ and not fixed attributes)
        if (
          typeof prop === 'string' &&
          !prop.startsWith('_') &&
          !FragmentFrame.ATTRS_REGEX.test(prop) &&
          target._ready
        ) {
          try {
            // Serialize value (including functions and transferables)
            const { serialized, transferables } = target._manager.serialize(value);

            const success = target._sendToIframe(
              {
                attribute: prop,
                type: MessageEvent.ATTRIBUTE_CHANGE,
                value: serialized,
              },
              transferables
            );

            // Signal send failure by dispatching error event
            if (!success) {
              console.warn(`[fragment-frame] Failed to sync property '${prop}' to iframe`);
              target._emit('error', {
                message: `Failed to sync property '${prop}' to iframe`,
                property: prop,
              });
            }
          } catch (error) {
            console.error(`[fragment-frame] Failed to serialize property '${prop}':`, error);
            // Property was set locally but not synced to child
            target._emit('error', { message: `Property serialization failed: ${prop}`, error });
          }
        }

        return result;
      },

      get(target, prop): unknown {
        const value = Reflect.get(target, prop);

        // If property exists, return it
        if (value !== undefined) return value;

        // Dynamic method pattern for camelCase event emitters
        // If property doesn't exist and looks like a camelCase identifier,
        // create a dynamic function that emits an event with kebab-case name
        //
        // Cache the function to maintain referential equality:
        //   frame.themeChange === frame.themeChange  // true
        //
        // Examples:
        //   frame.themeChange({ ... })     → emit('theme-change', { ... })
        //   frame.userCreated({ ... })     → emit('user-created', { ... })
        //   frame.apiUrlUpdate({ ... })    → emit('api-url-update', { ... })

        // Validate property is a camelCase identifier
        if (typeof prop !== 'string') return value;
        if (!/^[a-z][a-zA-Z0-9]*$/.test(prop)) return value;
        if (!/[A-Z]/.test(prop)) return value;

        // Create dynamic method for valid camelCase identifier
        // Check cache first
        if (!target._dynamicMethods.has(prop)) {
          // Create and cache the function
          target._dynamicMethods.set(prop, (data?: unknown) =>
            target._emitToChild(kebabCase(prop), data)
          );
        }
        return target._dynamicMethods.get(prop);
      },
    });
  }

  /**
   * Get fragment name
   */
  get name(): string | null {
    return this.getAttribute('name');
  }

  /**
   * Get fragment source URL
   */
  get src(): string | null {
    return this.getAttribute('src');
  }

  /**
   * Get base path for routing
   * Falls back to /name or /fragment if base attribute not set
   */
  get base(): string {
    return this.getAttribute('base') || `/${this.name || 'fragment'}`;
  }

  /**
   * Get sandbox permissions
   */
  get sandbox(): string {
    return (
      this.getAttribute('sandbox') ||
      'allow-scripts allow-same-origin allow-forms allow-popups allow-modals'
    );
  }

  /**
   * Web Component lifecycle: called when an observed attribute changes
   */
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (oldValue === newValue) return;

    console.log(`[fragment-frame] Attribute '${name}' changed from '${oldValue}' to '${newValue}'`);

    // If element is connected and we now have both name and src, initialize
    if (this.isConnected && this.name && this.src && !this._iframe) {
      try {
        this._origin = new URL(this.src).origin;
        this._initialize();
      } catch (error) {
        console.error(`[fragment-frame] Initialization failed:`, error);
        this._emit('error', {
          message: error instanceof Error ? error.message : 'Initialization failed',
          error
        });
      }
    }

    // If src changes after initialization, warn
    if (name === 'src' && this._iframe && oldValue) {
      logger.warn('Changing src attribute after initialization is not supported');
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
    // If both name and src are already set, initialize immediately
    if (this.name && this.src && !this._iframe) {
      try {
        this._origin = new URL(this.src).origin;
        this._initialize();
      } catch (error) {
        console.error(`[fragment-frame] Initialization failed:`, error);
        this._emit('error', {
          message: error instanceof Error ? error.message : 'Initialization failed',
          error
        });
      }
    }
    // Otherwise, wait for attributeChangedCallback to trigger initialization
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
    this._iframe = document.createElement('iframe');
    this._iframe.src = this.src!;
    this._iframe.style.cssText = 'border:none;display:block;height:100%;width:100%;';
    this._iframe.setAttribute('sandbox', this.sandbox);

    // Create MessageChannel for dedicated communication
    const channel = new MessageChannel();
    this._port = channel.port1;

    // Setup message handler on our port
    this._portMessageHandler = (event) => {
      try {
        this._handleMessageFromIframe(event.data);
      } catch (error) {
        logger.error('Error handling message from iframe:', error);
        this._emit('error', { message: 'Message handler error', error });
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
  private async _waitForIframeLoad(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Iframe load timeout after 10s: ${this.src}`));
      }, 10000);

      const handler = (event: Event) => {
        cleanup();
        if (event.type === 'error') {
          reject(new Error(`Failed to load iframe: ${this.src}`));
        } else {
          resolve();
        }
      };

      const cleanup = () => {
        clearTimeout(timeoutId);
        this._iframe.removeEventListener('load', handler);
        this._iframe.removeEventListener('error', handler);
      };

      this._iframe.addEventListener('load', handler, { once: true });
      this._iframe.addEventListener('error', handler, { once: true });
    }).catch((error) => {
      logger.error('Iframe initialization failed:', error);
      this._emit('error', { message: 'Iframe load failed', error });
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

    // Collect JavaScript properties (may override attributes, includes functions/objects)
    for (const key of Object.keys(this)) {
      if (
        !key.startsWith('_') &&
        !FragmentFrame.ATTRS_REGEX.test(key) &&
        !/^(base|name)$/.test(key)
      ) {
        const value = this[key as keyof this];
        if (value !== undefined) {
          props[key] = value;
        }
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
      throw new Error('[fragment-frame] Iframe contentWindow is not accessible');
    }

    contentWindow.postMessage(
      {
        payload: serialized as FragmentFrameProps,
        type: MessageEvent.INIT,
      },
      this._origin,
      [channel.port2, ...transferables]
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
            transferables
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
    const message = validateMessage(data, '[fragment-frame]');
    if (!message) {
      return; // Validation failed, error already logged
    }

    const { type } = message;

    switch (type) {
      case MessageEvent.READY:
        this._ready = true;
        this._dispatchLocalEvent('ready');
        break;

      case MessageEvent.CUSTOM_EVENT: {
        const customMsg = message as CustomEventMessage;
        const payload = customMsg.payload;
        if (!payload?.name || typeof payload.name !== 'string') {
          logger.warn('Invalid CUSTOM_EVENT message:', message);
          return;
        }
        this._dispatchLocalEvent(payload.name, payload.data);
        break;
      }

      case MessageEvent.FUNCTION_CALL: {
        const callMsg = message as FunctionCallMessage;
        if (!callMsg.callId || !callMsg.fnId) {
          logger.warn('Invalid FUNCTION_CALL message:', message);
          return;
        }
        this._manager.handleFunctionCall(callMsg.callId, callMsg.fnId, callMsg.params);
        break;
      }

      case MessageEvent.FUNCTION_RESPONSE: {
        const respMsg = message as FunctionResponseMessage;
        const { callId, success, result, error: errorResult } = respMsg;
        if (!callId || typeof success !== 'boolean') {
          logger.warn('Invalid FUNCTION_RESPONSE message:', message);
          return;
        }
        this._manager.handleFunctionResponse(callId, success, result, errorResult);
        break;
      }

      case MessageEvent.FUNCTION_RELEASE: {
        const releaseMsg = message as FunctionReleaseMessage;
        if (!releaseMsg.fnId) {
          logger.warn('Invalid FUNCTION_RELEASE message:', message);
          return;
        }
        this._manager.releaseFunction(releaseMsg.fnId);
        break;
      }

      case MessageEvent.FUNCTION_RELEASE_BATCH: {
        const batchMsg = message as { fnIds: string[] };
        if (!Array.isArray(batchMsg.fnIds)) {
          logger.warn('Invalid FUNCTION_RELEASE_BATCH message:', message);
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
   *
   * // CamelCase method
   * frame.themeChange({ theme: 'dark' });
   * ```
   */
  emit(eventName: string, data?: unknown) {
    if (!eventName || !/^[a-zA-Z0-9_:.-]+$/.test(eventName)) {
      logger.error('Invalid event name:', eventName);
      return;
    }

    this._emitToChild(eventName, data);
  }

  /**
   * Internal method to send event to child iframe
   */
  private _emitToChild(eventName: string, data?: unknown) {
    if (!this._port) {
      logger.warn('MessagePort not ready, cannot emit event');
      return;
    }

    const { serialized, transferables } = this._manager.serialize(data);

    this._sendToIframe(
      {
        name: eventName,
        data: serialized,
        type: MessageEvent.EVENT,
      },
      transferables
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
  private _emit(name: string, detail?: unknown, options: { bubbles?: boolean; composed?: boolean } = {}) {
    this.dispatchEvent(
      new CustomEvent(name, {
        bubbles: options.bubbles ?? true,
        composed: options.composed ?? true,
        detail,
      })
    );
  }

  /**
   * Dispatch custom event on parent (from child emissions)
   */
  private _dispatchLocalEvent(name: string, detail?: unknown) {
    if (!name || !/^[a-zA-Z0-9_:.\-]+$/.test(name)) {
      logger.warn('Invalid event name:', name);
      return;
    }

    // Dispatch DOM CustomEvent
    this._emit(name, detail);

    // Try property handler (e.g., frame.onready)
    const handlerName = `on${name.replace(/[:.\-]/g, '')}`;
    if (Object.hasOwn(this, handlerName)) {
      const handler = Reflect.get(this, handlerName);
      if (typeof handler === 'function') {
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
      logger.error('MessagePort not ready');
      return false;
    }

    try {
      this._port.postMessage(message, transferables);
      return true;
    } catch (error) {
      logger.error('Failed to send message:', error);

      this._emit('message-send-failed', {
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
    this._iframe?.remove();
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
if (!customElements.get('fragment-frame')) {
  customElements.define('fragment-frame', FragmentFrame);
  console.log('[fragment-elements] fragment-frame custom element registered');
} else {
  console.warn('[fragment-elements] fragment-frame already registered');
}
