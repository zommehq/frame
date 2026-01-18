import type { MessageEvent } from "./constants";

/**
 * Props passed from parent to frame.
 *
 * Can include functions that will be automatically serialized and made callable
 * across the iframe boundary. Frame can call parent functions via frameSDK.props.functionName().
 *
 * Frame can expose functions to parent via frameSDK.register() which makes them
 * available in the parent's 'register' event listener.
 *
 * @example
 * ```typescript
 * // Parent sets props with functions
 * frame.props = {
 *   theme: 'dark',
 *   onSave: async (data) => { await api.save(data); }
 * };
 *
 * // Frame accesses props and calls parent functions
 * const theme = frameSDK.props.theme;
 * await frameSDK.props.onSave({ id: 123, name: 'Item' });
 *
 * // Frame exposes functions to parent
 * frameSDK.register({
 *   refresh: () => loadData(),
 *   export: async (format) => generateExport(format)
 * });
 *
 * // Parent receives and calls frame functions
 * frame.addEventListener('register', (event) => {
 *   const { refresh, export: exportFn } = event.detail;
 *   refresh();
 *   await exportFn('csv');
 * });
 * ```
 */
export interface FrameProps {
  base: string;
  name: string;
  [key: string]: unknown;
}

// Serialized function representation
export interface SerializedFunction {
  __fn: string; // UUID token
  __meta?: {
    name?: string;
  };
}

// Custom event payload
export interface CustomEventPayload {
  data?: unknown;
  name: string;
}

export type MessageType = (typeof MessageEvent)[keyof typeof MessageEvent];

export interface BaseMessage {
  type: MessageType;
}

// Lifecycle messages
export interface InitMessage extends BaseMessage {
  payload: FrameProps;
  type: typeof MessageEvent.INIT;
}

export interface ReadyMessage extends BaseMessage {
  type: typeof MessageEvent.READY;
}

// Property change message
export interface AttributeChangeMessage extends BaseMessage {
  attribute: string;
  type: typeof MessageEvent.ATTRIBUTE_CHANGE;
  value: unknown;
}

// Event messages
export interface EventMessage extends BaseMessage {
  data?: unknown;
  name: string;
  type: typeof MessageEvent.EVENT;
}

export interface CustomEventMessage extends BaseMessage {
  payload: CustomEventPayload;
  type: typeof MessageEvent.CUSTOM_EVENT;
}

// Function call messages
export interface FunctionCallMessage extends BaseMessage {
  callId: string;
  fnId: string;
  params: unknown[];
  type: typeof MessageEvent.FUNCTION_CALL;
}

export interface FunctionResponseMessage extends BaseMessage {
  callId: string;
  error?: string;
  result?: unknown;
  success: boolean;
  type: typeof MessageEvent.FUNCTION_RESPONSE;
}

export interface FunctionReleaseMessage extends BaseMessage {
  fnId: string;
  type: typeof MessageEvent.FUNCTION_RELEASE;
}

export interface FunctionReleaseBatchMessage extends BaseMessage {
  fnIds: string[];
  type: typeof MessageEvent.FUNCTION_RELEASE_BATCH;
}

export type Message =
  | InitMessage
  | ReadyMessage
  | AttributeChangeMessage
  | EventMessage
  | CustomEventMessage
  | FunctionCallMessage
  | FunctionResponseMessage
  | FunctionReleaseMessage
  | FunctionReleaseBatchMessage;

/**
 * Callback function for sending messages via MessagePort.postMessage
 * Used by FunctionManager to send messages to the other side (parent or child).
 *
 * @param message - The message object to send (serialized)
 * @param transferables - Optional array of transferable objects (MessagePort, ArrayBuffer, etc.)
 *
 * @example
 * ```typescript
 * const postMessage: PostMessageFn = (msg, transferables = []) => {
 *   port.postMessage(msg, transferables);
 * };
 * ```
 */
export type PostMessageFn = (message: unknown, transferables?: Transferable[]) => void;

/**
 * Represents property changes in watch callbacks
 * Each changed property contains a tuple [newValue, oldValue]
 *
 * @example
 * ```typescript
 * const changes: PropChanges<{ theme: string, apiUrl: string }, 'theme'> = {
 *   theme: ['dark', 'light']
 * };
 * ```
 */
export type PropChanges<T, K extends keyof T = keyof T> = {
  [P in K]?: [newValue: T[P], oldValue: T[P]];
};

/**
 * Handler function for watch() callbacks
 * Receives an object with changed properties and their [new, old] values
 *
 * @example
 * ```typescript
 * const handler: WatchHandler<FrameProps> = (changes) => {
 *   if ('theme' in changes) {
 *     const [newTheme, oldTheme] = changes.theme;
 *     console.log(`Theme changed from ${oldTheme} to ${newTheme}`);
 *   }
 * };
 * ```
 */
export type WatchHandler<T, K extends keyof T = keyof T> = (changes: PropChanges<T, K>) => void;
