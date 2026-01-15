import type {
  CallResponseMessage,
  CallResponsePayload,
  CustomEventMessage,
  ErrorMessage,
  FragmentFrameConfig,
  Message,
  NavigateMessage,
  StateChangeMessage,
} from './types';
import { MessageEvent } from './constants';

interface PendingCall {
  reject: (reason?: unknown) => void;
  resolve: (value: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
}

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
 *   src="http://localhost:3000"
 *   base="/my-app"
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

  private _iframe!: HTMLIFrameElement;
  private _mutationObserver?: MutationObserver;
  private _pendingCalls = new Map<string, PendingCall>();
  private _ready = false;
  private _targetOrigin!: string;

  constructor() {
    super();

    // Proxy to intercept property assignments
    return new Proxy(this, {
      set(target, prop, value) {
        const result = Reflect.set(target, prop, value);

        // Only public properties (not starting with _ and not fixed attributes)
        if (
          typeof prop === 'string' &&
          !prop.startsWith('_') &&
          !FragmentFrame.ATTRS_REGEX.test(prop) &&
          target._ready
        ) {
          target.sendToIframe({
            attribute: prop,
            type: MessageEvent.ATTRIBUTE_CHANGE,
            value,
          });
        }

        return result;
      },
    });
  }

  connectedCallback() {
    const name = this.getAttribute('name');
    const src = this.getAttribute('src');
    const base = this.getAttribute('base') || `/${name}`;
    const sandbox =
      this.getAttribute('sandbox') ||
      'allow-scripts allow-same-origin allow-forms allow-popups allow-modals';

    if (!name || !src) {
      console.error('[fragment-frame] Missing required attributes: name and src');
      return;
    }

    this._targetOrigin = new URL(src).origin;
    this.initializeApp(name, src, base, sandbox);
  }

  private async initializeApp(name: string, src: string, base: string, sandbox: string) {
    this._iframe = document.createElement('iframe');
    this._iframe.src = src;
    this._iframe.style.cssText = 'border:none;display:block;height:100%;width:100%;';
    this._iframe.setAttribute('sandbox', sandbox);

    window.addEventListener('message', (event) => {
      if (event.origin !== this._targetOrigin) return;
      if (event.source !== this._iframe.contentWindow) return;
      this.handleMessageFromIframe(event.data as Message);
    });

    this.appendChild(this._iframe);
    await new Promise((resolve) => (this._iframe.onload = resolve));

    // Collect all attributes except fixed ones
    const attrs: Record<string, string> = {};
    for (let i = 0; i < this.attributes.length; i++) {
      const attr = this.attributes[i];
      if (!FragmentFrame.ATTRS_REGEX.test(attr.name)) {
        attrs[attr.name] = attr.value;
      }
    }

    this.sendToIframe({
      payload: { base, name, ...attrs } as FragmentFrameConfig,
      type: MessageEvent.INIT,
    });

    // Observe dynamic attribute changes
    this._mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && this._ready) {
          const attrName = mutation.attributeName;
          if (attrName && !FragmentFrame.ATTRS_REGEX.test(attrName)) {
            this.sendToIframe({
              attribute: attrName,
              type: MessageEvent.ATTRIBUTE_CHANGE,
              value: this.getAttribute(attrName),
            });
          }
        }
      });
    });

    this._mutationObserver.observe(this, {
      attributes: true,
      attributeOldValue: false,
    });
  }

  private handleMessageFromIframe(message: Message) {
    const { type } = message;

    switch (type) {
      case MessageEvent.READY:
        this._ready = true;
        this.emit('ready');
        break;

      case MessageEvent.NAVIGATE: {
        const { payload } = message as NavigateMessage;
        this.emit('navigate', {
          path: payload.path,
          replace: payload.replace || false,
          state: payload.state,
        });
        break;
      }

      case MessageEvent.ERROR: {
        const { payload } = message as ErrorMessage;
        this.emit('error', payload);
        break;
      }

      case MessageEvent.STATE_CHANGE: {
        const { payload } = message as StateChangeMessage;
        this.emit('state-change', payload);
        break;
      }

      case MessageEvent.CUSTOM_EVENT: {
        const { payload } = message as CustomEventMessage;
        this.emit(payload.name, payload.data);
        break;
      }

      case MessageEvent.CALL_RESPONSE: {
        const { requestId, payload } = message as CallResponseMessage;
        this.handleCallResponse(requestId, payload);
        break;
      }

      default:
        console.warn(`[micro-app] Unknown message type: ${type}`);
    }
  }

  private emit(eventName: string, detail?: unknown) {
    this.dispatchEvent(
      new CustomEvent(eventName, { bubbles: true, composed: true, detail })
    );
  }

  /**
   * Call a method registered in the fragment application
   *
   * The fragment must have registered the method using SDK's `registerMethod()`.
   * Waits for fragment response or times out after 10 seconds.
   *
   * @param method - Method name to call
   * @param params - Parameters to pass to the method
   * @returns Promise resolving to the method's return value
   * @throws Error if fragment not ready, method not found, or timeout
   *
   * @example
   * ```typescript
   * const userData = await fragment.call('getUserData', { id: 123 });
   * console.log(userData); // { name: 'John', email: '...' }
   * ```
   */
  async call(method: string, params?: unknown): Promise<unknown> {
    if (!this._ready) {
      throw new Error('App not ready yet');
    }

    const requestId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this._pendingCalls.delete(requestId);
        reject(new Error(`Call timeout: ${method}`));
      }, 10000);

      this._pendingCalls.set(requestId, { reject, resolve, timeout });

      this.sendToIframe({
        method,
        params,
        requestId,
        type: MessageEvent.CALL,
      });
    });
  }

  /**
   * Send an event to the fragment application
   *
   * The fragment can listen to events using SDK's `on()` method.
   *
   * @param eventName - Event name
   * @param data - Optional event data
   *
   * @example
   * ```typescript
   * fragment.emitEvent('theme-changed', { theme: 'dark' });
   * fragment.emitEvent('refresh-data');
   * ```
   */
  emitEvent(eventName: string, data?: unknown) {
    this.sendToIframe({
      data,
      name: eventName,
      type: MessageEvent.EVENT,
    });
  }

  private handleCallResponse(requestId: string, payload: CallResponsePayload) {
    const pending = this._pendingCalls.get(requestId);
    if (!pending) return;

    clearTimeout(pending.timeout);
    this._pendingCalls.delete(requestId);

    if (payload.success) {
      pending.resolve(payload.result);
    } else {
      pending.reject(new Error(payload.error));
    }
  }

  private sendToIframe(message: unknown) {
    if (!this._iframe?.contentWindow) {
      console.error('[micro-app] Iframe not ready');
      return;
    }

    this._iframe.contentWindow.postMessage(message, this._targetOrigin);
  }

  disconnectedCallback() {
    this._mutationObserver?.disconnect();
    this._iframe?.remove();

    for (const [_, pending] of this._pendingCalls) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Web Component disconnected'));
    }
    this._pendingCalls.clear();
  }
}

customElements.define('fragment-frame', FragmentFrame);
