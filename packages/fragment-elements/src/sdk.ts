import { MessageEvent } from './constants';
import type {
  AttributeChangeMessage,
  CallMessage,
  ErrorPayload,
  EventMessage,
  FragmentFrameConfig,
  InitMessage,
  Message
} from './types';

type EventHandler = (data: unknown) => void;

/**
 * SDK for fragment applications to communicate with the parent
 *
 * Provides APIs for navigation, events, method registration, and configuration access.
 * Must be initialized before use.
 *
 * @example
 * ```typescript
 * import { microAppSDK } from '@micro-fe/fragment-elements/sdk';
 *
 * // Initialize SDK
 * await microAppSDK.initialize();
 *
 * // Access config
 * const config = microAppSDK.getConfig();
 * console.log(config.name, config.base);
 *
 * // Navigate
 * microAppSDK.navigate('/app/settings');
 *
 * // Emit events
 * microAppSDK.emit('user-action', { type: 'click' });
 *
 * // Register methods
 * microAppSDK.registerMethod('getData', async () => {
 *   return { items: [...] };
 * });
 *
 * // Listen to events
 * microAppSDK.on('theme-changed', (theme) => {
 *   applyTheme(theme);
 * });
 * ```
 */
export class MicroAppSDK {
  private config!: FragmentFrameConfig;
  private eventListeners = new Map<string, Set<EventHandler>>();
  private methodHandlers = new Map<string, (params: unknown) => unknown | Promise<unknown>>();
  private parentOrigin!: string;

  /**
   * Initialize the SDK and wait for configuration from parent
   *
   * Must be called before using any other SDK methods.
   * Waits for __INIT__ message from parent containing configuration.
   *
   * @returns Promise that resolves when SDK is ready
   *
   * @example
   * ```typescript
   * await microAppSDK.initialize();
   * console.log('SDK ready');
   * ```
   */
  async initialize(): Promise<void> {
    return new Promise((resolve) => {
      window.addEventListener(
        'message',
        (event) => {
          if (event.data.type === MessageEvent.INIT) {
            const message = event.data as InitMessage;
            this.config = message.payload;
            this.parentOrigin = event.origin;

            window.addEventListener('message', this.handleMessage.bind(this));

            this.sendToParent({ type: MessageEvent.READY });

            resolve();
          }
        },
        { once: true }
      );
    });
  }

  private handleMessage(event: MessageEvent) {
    if (event.origin !== this.parentOrigin) return;

    const message = event.data as Message;
    const { type } = message;

    switch (type) {
      case MessageEvent.CALL: {
        const { method, params, requestId } = message as CallMessage;
        this.handleMethodCall(method, params, requestId);
        break;
      }

      case MessageEvent.EVENT: {
        const { name, data } = message as EventMessage;
        this.emitLocalEvent(name, data);
        break;
      }

      case MessageEvent.ATTRIBUTE_CHANGE: {
        const { attribute, value } = message as AttributeChangeMessage;
        this.handleAttributeChange(attribute, value);
        break;
      }
    }
  }

  private async handleMethodCall(method: string, params: unknown, requestId: string) {
    try {
      const handler = this.methodHandlers.get(method);
      if (!handler) {
        throw new Error(`Method not found: ${method}`);
      }

      const result = await handler(params);

      this.sendToParent({
        payload: { result, success: true },
        requestId,
        type: MessageEvent.CALL_RESPONSE,
      });
    } catch (error) {
      this.sendToParent({
        payload: { error: error instanceof Error ? error.message : 'Unknown error', success: false },
        requestId,
        type: MessageEvent.CALL_RESPONSE,
      });
    }
  }

  private handleAttributeChange(attribute: string, value: unknown) {
    this.emitLocalEvent(`attribute:${attribute}`, value);

    if (attribute === 'theme') {
      this.config.theme = value as string;
    } else if (attribute === 'api-url') {
      this.config.apiUrl = value as string;
    }
  }

  /**
   * Request parent to navigate to a path
   *
   * Parent application must listen to 'navigate' event on the <fragment-frame>
   * element and handle the navigation using its router.
   *
   * @param path - Target path
   * @param replace - Replace history instead of push (default: false)
   * @param state - Optional navigation state
   *
   * @example
   * ```typescript
   * microAppSDK.navigate('/app/settings');
   * microAppSDK.navigate('/app/home', true);
   * microAppSDK.navigate('/app/profile', false, { from: 'dashboard' });
   * ```
   */
  navigate(path: string, replace = false, state?: unknown) {
    this.sendToParent({
      payload: { path, replace, state },
      type: MessageEvent.NAVIGATE,
    });
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
   * microAppSDK.emit('user-action', { type: 'click', id: 123 });
   * microAppSDK.emit('data-loaded');
   * ```
   */
  emit(eventName: string, data?: unknown) {
    this.sendToParent({
      payload: { data, name: eventName },
      type: MessageEvent.CUSTOM_EVENT,
    });
  }

  /**
   * Report error to parent
   *
   * Parent can listen to 'error' event on the <fragment-frame> element.
   *
   * @param error - Error to report
   *
   * @example
   * ```typescript
   * try {
   *   await riskyOperation();
   * } catch (error) {
   *   microAppSDK.reportError(error as Error);
   * }
   * ```
   */
  reportError(error: Error) {
    this.sendToParent({
      payload: {
        message: error.message,
        stack: error.stack,
      } as ErrorPayload,
      type: MessageEvent.ERROR,
    });
  }

  /**
   * Notify parent of state changes
   *
   * Parent can listen to 'state-change' event on the <fragment-frame> element.
   *
   * @param state - Current state
   *
   * @example
   * ```typescript
   * microAppSDK.notifyStateChange({
   *   user: currentUser,
   *   theme: currentTheme,
   * });
   * ```
   */
  notifyStateChange(state: unknown) {
    this.sendToParent({
      payload: state,
      type: MessageEvent.STATE_CHANGE,
    });
  }

  /**
   * Register a method that can be called from parent
   *
   * Parent can call the method using fragment.call(method, params).
   *
   * @param method - Method name
   * @param handler - Method handler function
   *
   * @example
   * ```typescript
   * microAppSDK.registerMethod('getUserData', async (params) => {
   *   const { id } = params as { id: number };
   *   return await fetchUser(id);
   * });
   * ```
   */
  registerMethod(method: string, handler: (params: unknown) => unknown | Promise<unknown>) {
    this.methodHandlers.set(method, handler);
  }

  /**
   * Listen to events from parent
   *
   * Use 'attribute:' prefix to listen to attribute changes.
   *
   * @param eventName - Event name or 'attribute:name' for attribute changes
   * @param handler - Event handler function
   *
   * @example
   * ```typescript
   * microAppSDK.on('theme-changed', (theme) => {
   *   applyTheme(theme);
   * });
   *
   * microAppSDK.on('attribute:api-url', (url) => {
   *   updateApiClient(url);
   * });
   * ```
   */
  on(eventName: string, handler: EventHandler) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set());
    }
    this.eventListeners.get(eventName)!.add(handler);
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
   * microAppSDK.on('user-updated', handler);
   * microAppSDK.off('user-updated', handler);
   * ```
   */
  off(eventName: string, handler: EventHandler) {
    this.eventListeners.get(eventName)?.delete(handler);
  }

  private emitLocalEvent(eventName: string, data: unknown) {
    const handlers = this.eventListeners.get(eventName);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  private sendToParent(message: unknown) {
    window.parent.postMessage(message, this.parentOrigin);
  }

  /**
   * Get configuration passed from parent
   *
   * Returns configuration object with name, base, and any dynamic attributes.
   *
   * @returns Fragment configuration
   *
   * @example
   * ```typescript
   * const config = microAppSDK.getConfig();
   * console.log(config.name);     // "my-app"
   * console.log(config.base);     // "/my-app"
   * console.log(config.apiUrl);   // Custom attribute
   * ```
   */
  getConfig(): FragmentFrameConfig {
    return this.config;
  }
}

/**
 * Singleton SDK instance for fragment applications
 *
 * Import and use directly without creating new instances.
 *
 * @example
 * ```typescript
 * import { microAppSDK } from '@micro-fe/fragment-elements/sdk';
 *
 * await microAppSDK.initialize();
 * ```
 */
export const microAppSDK = new MicroAppSDK();
