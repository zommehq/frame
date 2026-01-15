import { MessageEvent } from './constants';

// Fragment props passed from parent to child
export interface FragmentFrameProps {
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
  payload: FragmentFrameProps;
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
