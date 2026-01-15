import { MessageEvent, VALID_MESSAGE_TYPES } from './constants';
import { FunctionManager } from './helpers/function-manager';
import { createLogger } from './helpers/logger';
import { validateMessage } from './helpers/message-validators';
import type {
  AttributeChangeMessage,
  EventMessage,
  FragmentFrameProps,
  FunctionCallMessage,
  FunctionReleaseMessage,
  FunctionResponseMessage,
  InitMessage,
  Message,
} from './types';

const logger = createLogger('frameSDK');

/**
 * Event handler callback for SDK events
 * @param data - Event data from parent or attribute changes
 * @returns void or Promise<void> for async handlers
 */
type EventHandler = (data: unknown) => void | Promise<void>;

/**
 * SDK for fragment applications to communicate with the parent
 *
 * Provides APIs for events and configuration access.
 * Must be initialized before use.
 *
 * @example
 * ```typescript
 * import { frameSDK } from '@micro-fe/fragment-elements/sdk';
 *
 * // Initialize SDK
 * await frameSDK.initialize();
 *
 * // Access props directly
 * console.log(frameSDK.props.name, frameSDK.props.base);
 * frameSDK.props.onSuccess({ status: 'ok' });
 *
 * // Emit events
 * frameSDK.emit('state-change', { theme: 'dark' });
 *
 * // Listen to events from parent
 * frameSDK.on('theme-changed', (theme) => {
 *   applyTheme(theme);
 * });
 * ```
 */
export class FrameSDK {
  /**
   * Configuration and properties from parent frame
   *
   * Automatically synchronized when parent changes attributes/properties.
   * May contain functions passed from parent.
   *
   * @example
   * ```typescript
   * console.log(frameSDK.props.name);      // 'my-app'
   * console.log(frameSDK.props.apiUrl);    // 'https://api.example.com'
   * frameSDK.props.onSuccess({ ok: true }); // Call function from parent
   * ```
   */
  public props!: FragmentFrameProps;
  private _eventListeners = new Map<string, Set<EventHandler>>();
  private _parentOrigin!: string;
  private _port!: MessagePort;

  // Function call support
  private _functionManager!: FunctionManager;

  // Handler references for cleanup
  private _portMessageHandler?: (event: MessageEvent) => void;
  private _beforeUnloadHandler?: () => void;

  // Flag to prevent processing multiple INIT messages
  private _initialized = false;

  /**
   * Initialize the SDK and wait for configuration from parent
   *
   * Must be called before using any other SDK methods.
   * Waits for __INIT__ message from parent containing configuration.
   * Rejects if INIT message is not received within timeout period.
   *
   * @param expectedOrigin - Optional expected parent origin for security validation
   * @param timeout - Optional timeout in milliseconds (default: 10000ms)
   * @returns Promise that resolves when SDK is ready
   *
   * @example
   * ```typescript
   * // Without origin validation (less secure, use only in trusted environments)
   * await frameSDK.initialize();
   *
   * // With origin validation (recommended for production)
   * await frameSDK.initialize('https://app.example.com');
   *
   * // With custom timeout
   * await frameSDK.initialize('https://app.example.com', 5000);
   * ```
   */
  async initialize(expectedOrigin?: string, timeout = 10000): Promise<void> {
    // Prevent reinitialization
    if (this._initialized) {
      logger.warn('Already initialized, ignoring duplicate call');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      let messageHandler: ((event: MessageEvent) => void) | undefined;

      // Setup timeout to prevent indefinite wait
      timeoutId = setTimeout(() => {
        if (messageHandler) {
          window.removeEventListener('message', messageHandler);
        }
        reject(
          new Error(
            `[frameSDK] Initialization timeout: INIT message not received within ${timeout}ms`
          )
        );
      }, timeout);

      messageHandler = (event) => {
        if (event.data.type === MessageEvent.INIT) {
          // Clear timeout on successful INIT
          if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
          }

          // Prevent race condition: only process first INIT message
          if (this._initialized) {
            logger.warn('Ignoring duplicate INIT message');
            return;
          }

          // Validate origin if expected origin is provided
          if (expectedOrigin && event.origin !== expectedOrigin) {
            console.error(
              `[frameSDK] Origin validation failed. Expected: ${expectedOrigin}, Got: ${event.origin}`
            );
            // Clean up event listener on failure to prevent memory leak
            if (messageHandler) {
              window.removeEventListener('message', messageHandler);
            }
            reject(
              new Error(
                `Origin mismatch: expected ${expectedOrigin}, got ${event.origin}`
              )
            );
            return;
          }

          // Mark as initialized immediately to prevent race condition
          this._initialized = true;

          const message = event.data as InitMessage;
          this._parentOrigin = event.origin;

          // Get MessagePort from the INIT message
          // Validate array bounds before access to prevent runtime crash
          if (!event.ports || event.ports.length === 0) {
            logger.error('No MessagePort received in INIT message');
            // Clean up event listener on failure to prevent memory leak
            if (messageHandler) {
              window.removeEventListener('message', messageHandler);
            }
            reject(new Error('No MessagePort received in INIT message'));
            return;
          }
          this._port = event.ports[0];

          // Initialize function manager
          this._functionManager = new FunctionManager((msg, transferables = []) => {
            this._sendToParent(msg, transferables);
          });

          // Deserialize props (may contain functions from parent)
          this.props = this._functionManager.deserialize(message.payload) as FragmentFrameProps;

          // Setup message handler on the port (store reference for cleanup)
          this._portMessageHandler = this._handleMessage.bind(this);
          this._port.onmessage = this._portMessageHandler;

          // Setup cleanup on unload (store reference for cleanup)
          this._beforeUnloadHandler = () => {
            this.cleanup();
          };
          window.addEventListener('beforeunload', this._beforeUnloadHandler);

          this._sendToParent({ type: MessageEvent.READY });

          resolve();
        }
      };

      window.addEventListener('message', messageHandler, { once: true });
    });
  }

  /**
   * Handle incoming messages from parent via MessagePort
   *
   * Validates message structure and type, then routes to appropriate handler.
   * Implements security checks to prevent malicious messages.
   *
   * @param event - MessageEvent from parent
   */
  private _handleMessage(event: MessageEvent) {
    // Use shared validation utility to reduce code duplication
    const message = validateMessage(event.data, '[frameSDK]');
    if (!message) {
      return; // Validation failed, error already logged
    }

    const { type } = message;

    switch (type) {
      case MessageEvent.EVENT: {
        const eventMsg = message as EventMessage;
        if (!eventMsg.name || typeof eventMsg.name !== 'string') {
          logger.warn('Invalid EVENT message:', message);
          return;
        }
        this._emitLocalEvent(eventMsg.name, eventMsg.data);
        break;
      }

      case MessageEvent.ATTRIBUTE_CHANGE: {
        const attrMsg = message as AttributeChangeMessage;
        if (!attrMsg.attribute || typeof attrMsg.attribute !== 'string') {
          logger.warn('Invalid ATTRIBUTE_CHANGE message:', message);
          return;
        }
        this._handleAttributeChange(attrMsg.attribute, attrMsg.value);
        break;
      }

      case MessageEvent.FUNCTION_CALL: {
        const callMsg = message as FunctionCallMessage;
        if (!callMsg.callId || !callMsg.fnId) {
          logger.warn('Invalid FUNCTION_CALL message:', message);
          return;
        }
        this._functionManager.handleFunctionCall(callMsg.callId, callMsg.fnId, callMsg.params);
        break;
      }

      case MessageEvent.FUNCTION_RESPONSE: {
        const respMsg = message as FunctionResponseMessage;
        const { callId, success, result, error } = respMsg;
        if (!callId || typeof success !== 'boolean') {
          logger.warn('Invalid FUNCTION_RESPONSE message:', message);
          return;
        }
        this._functionManager.handleFunctionResponse(callId, success, result, error);
        break;
      }

      case MessageEvent.FUNCTION_RELEASE: {
        const releaseMsg = message as FunctionReleaseMessage;
        if (!releaseMsg.fnId) {
          logger.warn('Invalid FUNCTION_RELEASE message:', message);
          return;
        }
        this._functionManager.releaseFunction(releaseMsg.fnId);
        break;
      }

      case MessageEvent.FUNCTION_RELEASE_BATCH: {
        const batchMsg = message as { fnIds: string[] };
        if (!Array.isArray(batchMsg.fnIds)) {
          logger.warn('Invalid FUNCTION_RELEASE_BATCH message:', message);
          return;
        }
        // Release all functions in the batch
        for (const fnId of batchMsg.fnIds) {
          this._functionManager.releaseFunction(fnId);
        }
        break;
      }

      default:
        logger.warn('Unknown message type:', type);
    }
  }

  /**
   * Handle attribute change from parent
   *
   * Updates the props object and emits an attribute change event.
   * Includes security checks to prevent prototype pollution.
   *
   * @param attribute - Attribute name to update
   * @param value - New value (may be serialized, will be deserialized)
   */
  private _handleAttributeChange(attribute: string, value: unknown) {
    // Validate attribute name to prevent prototype pollution
    if (
      attribute === '__proto__' ||
      attribute === 'constructor' ||
      attribute === 'prototype'
    ) {
      console.warn(`[frameSDK] Forbidden attribute name: ${attribute}`);
      return;
    }

    // Deserialize value (may contain functions)
    const deserializedValue = this._functionManager.deserialize(value);

    // Update props safely using Reflect
    Reflect.set(this.props, attribute, deserializedValue);

    // Emit attribute change event
    this._emitLocalEvent(`attr:${attribute}`, deserializedValue);
  }

  /**
   * Emit custom event to parent
   *
   * Parent can listen to events on the <fragment-frame> element.
   *
   * @param eventName - Event name
   * @param data - Optional event data
   *
   * @example
   * ```typescript
   * frameSDK.emit('state-change', { theme: 'dark' });
   * frameSDK.emit('user-action', { type: 'click', id: 123 });
   * ```
   */
  emit(eventName: string, data?: unknown) {
    if (!eventName || !/^[a-zA-Z0-9_:.-]+$/.test(eventName)) {
      logger.error('Invalid event name:', eventName);
      return;
    }

    const { serialized, transferables } = this._functionManager.serialize(data);

    this._sendToParent(
      {
        payload: { data: serialized, name: eventName },
        type: MessageEvent.CUSTOM_EVENT,
      },
      transferables
    );
  }

  /**
   * Listen to events from parent
   *
   * Use 'attr:' prefix to listen to attribute changes.
   *
   * @param eventName - Event name or 'attr:name' for attribute changes
   * @param handler - Event handler function
   *
   * @example
   * ```typescript
   * frameSDK.on('theme-changed', (theme) => {
   *   applyTheme(theme);
   * });
   *
   * frameSDK.on('attr:apiUrl', (url) => {
   *   updateApiClient(url);
   * });
   * ```
   */
  on(eventName: string, handler: EventHandler) {
    if (!this._eventListeners.has(eventName)) {
      this._eventListeners.set(eventName, new Set());
    }
    this._eventListeners.get(eventName)!.add(handler);
  }

  /**
   * Remove event listener
   *
   * @param eventName - Event name
   * @param handler - Handler to remove
   *
   * @example
   * ```typescript
   * const handler = (data) => console.log(data);
   * frameSDK.on('user-updated', handler);
   * frameSDK.off('user-updated', handler);
   * ```
   */
  off(eventName: string, handler: EventHandler) {
    this._eventListeners.get(eventName)?.delete(handler);
  }

  /**
   * Clean up all resources
   *
   * Call this when unmounting/destroying the fragment to prevent memory leaks.
   * Clears all event listeners, closes MessagePort, and cleans up function manager.
   * Ensures cleanup continues even if individual steps fail (fail-safe pattern).
   *
   * @example
   * ```typescript
   * // In framework cleanup (useEffect, onUnmounted, ngOnDestroy, etc.)
   * frameSDK.cleanup();
   * ```
   */
  cleanup(): void {
    this._eventListeners.clear();

    // Remove beforeunload handler
    if (this._beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this._beforeUnloadHandler);
      this._beforeUnloadHandler = undefined;
    }

    // Release tracked functions
    const functionIds = Array.from(this._functionManager?.getTrackedFunctions() || []);
    if (functionIds.length > 0) {
      this._sendToParent({
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

    // Clean up function manager
    this._functionManager?.cleanup();
  }

  /**
   * Emit event to local event listeners
   *
   * Calls all registered handlers for the event. Protects against handler
   * errors by wrapping each call in try-catch to ensure all handlers run.
   *
   * @param eventName - Event name
   * @param data - Event data to pass to handlers
   */
  private _emitLocalEvent(eventName: string, data: unknown) {
    const handlers = this._eventListeners.get(eventName);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[frameSDK] Error in event handler for '${eventName}':`, error);
          // Continue executing other handlers even if one throws
        }
      });
    }
  }

  /**
   * Send message to parent via MessagePort with optional transferables
   *
   * Handles errors gracefully (e.g., DataCloneError, port closed, transferable already transferred)
   */
  private _sendToParent(message: unknown, transferables: Transferable[] = []): boolean {
    if (!this._port) {
      logger.error('MessagePort not ready');
      return false;
    }

    try {
      this._port.postMessage(message, transferables);
      return true;
    } catch (error) {
      logger.error('Failed to send message:', error);

      this._emitLocalEvent('message-send-failed', {
        error: error instanceof Error ? error.message : String(error),
        message,
        transferablesCount: transferables.length,
      });

      return false;
    }
  }
}

/**
 * Singleton SDK instance for fragment applications
 *
 * Import and use directly without creating new instances.
 *
 * @example
 * ```typescript
 * import { frameSDK } from '@micro-fe/fragment-elements/sdk';
 *
 * await frameSDK.initialize();
 * ```
 */
export const frameSDK = new FrameSDK();
