import { MessageEvent } from './constants';

export interface FragmentFrameConfig {
  base: string;
  name: string;
  [key: string]: unknown;
}

export interface NavigatePayload {
  path: string;
  replace?: boolean;
  state?: unknown;
}

export interface ErrorPayload {
  message: string;
  stack?: string;
}

export interface CustomEventPayload {
  data?: unknown;
  name: string;
}

export interface CallResponsePayload {
  error?: string;
  result?: unknown;
  success: boolean;
}

export type MessageType = (typeof MessageEvent)[keyof typeof MessageEvent];

export interface BaseMessage {
  type: MessageType;
}

export interface InitMessage extends BaseMessage {
  payload: FragmentFrameConfig;
  type: '__INIT__';
}

export interface ReadyMessage extends BaseMessage {
  type: '__READY__';
}

export interface NavigateMessage extends BaseMessage {
  payload: NavigatePayload;
  type: 'NAVIGATE';
}

export interface ErrorMessage extends BaseMessage {
  payload: ErrorPayload;
  type: 'ERROR';
}

export interface CustomEventMessage extends BaseMessage {
  payload: CustomEventPayload;
  type: 'CUSTOM_EVENT';
}

export interface AttributeChangeMessage extends BaseMessage {
  attribute: string;
  type: 'ATTRIBUTE_CHANGE';
  value: unknown;
}

export interface CallMessage extends BaseMessage {
  method: string;
  params?: unknown;
  requestId: string;
  type: 'CALL';
}

export interface CallResponseMessage extends BaseMessage {
  payload: {
    error?: string;
    result?: unknown;
    success: boolean;
  };
  requestId: string;
  type: 'CALL_RESPONSE';
}

export interface EventMessage extends BaseMessage {
  data?: unknown;
  name: string;
  type: 'EVENT';
}

export interface StateChangeMessage extends BaseMessage {
  payload: unknown;
  type: 'STATE_CHANGE';
}

export type Message =
  | InitMessage
  | ReadyMessage
  | NavigateMessage
  | ErrorMessage
  | CustomEventMessage
  | AttributeChangeMessage
  | CallMessage
  | CallResponseMessage
  | EventMessage
  | StateChangeMessage;
