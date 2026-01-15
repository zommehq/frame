import { MessageEvent, VALID_MESSAGE_TYPES } from '../constants';
import type {
  AttributeChangeMessage,
  CustomEventMessage,
  EventMessage,
  FunctionCallMessage,
  FunctionReleaseBatchMessage,
  FunctionReleaseMessage,
  FunctionResponseMessage,
  InitMessage,
  Message,
  ReadyMessage,
} from '../types';

/**
 * Type guard utilities for runtime type checking and message validation
 *
 * Provides safe type narrowing for messages and data structures to:
 * - Prevent runtime type errors
 * - Enable proper TypeScript type inference
 * - Validate message structure before processing
 * - Improve code safety and maintainability
 *
 * @example
 * ```typescript
 * if (isMessage(data)) {
 *   // data is now typed as Message
 *   console.log(data.type);
 * }
 *
 * if (isFunctionCallMessage(message)) {
 *   // message is now typed as FunctionCallMessage
 *   this.handleFunctionCall(message.callId, message.fnId, message.params);
 * }
 * ```
 */

/**
 * Check if value is a valid Message object
 *
 * @param value - Value to check
 * @returns true if value is a Message with valid type
 */
export function isMessage(value: unknown): value is Message {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof value.type === 'string' &&
    VALID_MESSAGE_TYPES.has(value.type as (typeof MessageEvent)[keyof typeof MessageEvent])
  );
}

/**
 * Check if message is an InitMessage
 *
 * @param message - Message to check
 * @returns true if message is InitMessage
 */
export function isInitMessage(message: Message): message is InitMessage {
  return (
    message.type === MessageEvent.INIT &&
    'payload' in message &&
    typeof message.payload === 'object' &&
    message.payload !== null
  );
}

/**
 * Check if message is a ReadyMessage
 *
 * @param message - Message to check
 * @returns true if message is ReadyMessage
 */
export function isReadyMessage(message: Message): message is ReadyMessage {
  return message.type === MessageEvent.READY;
}

/**
 * Check if message is an AttributeChangeMessage
 *
 * @param message - Message to check
 * @returns true if message is AttributeChangeMessage
 */
export function isAttributeChangeMessage(message: Message): message is AttributeChangeMessage {
  return (
    message.type === MessageEvent.ATTRIBUTE_CHANGE &&
    'attribute' in message &&
    typeof message.attribute === 'string' &&
    'value' in message
  );
}

/**
 * Check if message is an EventMessage
 *
 * @param message - Message to check
 * @returns true if message is EventMessage
 */
export function isEventMessage(message: Message): message is EventMessage {
  return (
    message.type === MessageEvent.EVENT &&
    'name' in message &&
    typeof message.name === 'string'
  );
}

/**
 * Check if message is a CustomEventMessage
 *
 * @param message - Message to check
 * @returns true if message is CustomEventMessage
 */
export function isCustomEventMessage(message: Message): message is CustomEventMessage {
  return (
    message.type === MessageEvent.CUSTOM_EVENT &&
    'payload' in message &&
    typeof message.payload === 'object' &&
    message.payload !== null &&
    'name' in message.payload &&
    typeof message.payload.name === 'string'
  );
}

/**
 * Check if message is a FunctionCallMessage
 *
 * @param message - Message to check
 * @returns true if message is FunctionCallMessage
 */
export function isFunctionCallMessage(message: Message): message is FunctionCallMessage {
  return (
    message.type === MessageEvent.FUNCTION_CALL &&
    'callId' in message &&
    typeof message.callId === 'string' &&
    'fnId' in message &&
    typeof message.fnId === 'string' &&
    'params' in message
  );
}

/**
 * Check if message is a FunctionResponseMessage
 *
 * @param message - Message to check
 * @returns true if message is FunctionResponseMessage
 */
export function isFunctionResponseMessage(message: Message): message is FunctionResponseMessage {
  return (
    message.type === MessageEvent.FUNCTION_RESPONSE &&
    'callId' in message &&
    typeof message.callId === 'string' &&
    'success' in message &&
    typeof message.success === 'boolean'
  );
}

/**
 * Check if message is a FunctionReleaseMessage
 *
 * @param message - Message to check
 * @returns true if message is FunctionReleaseMessage
 */
export function isFunctionReleaseMessage(message: Message): message is FunctionReleaseMessage {
  return (
    message.type === MessageEvent.FUNCTION_RELEASE &&
    'fnId' in message &&
    typeof message.fnId === 'string'
  );
}

/**
 * Check if message is a FunctionReleaseBatchMessage
 *
 * @param message - Message to check
 * @returns true if message is FunctionReleaseBatchMessage
 */
export function isFunctionReleaseBatchMessage(
  message: Message
): message is FunctionReleaseBatchMessage {
  return (
    message.type === MessageEvent.FUNCTION_RELEASE_BATCH &&
    'fnIds' in message &&
    Array.isArray(message.fnIds) &&
    message.fnIds.every((id) => typeof id === 'string')
  );
}

/**
 * Check if event name is valid (prevents XSS and prototype pollution)
 *
 * @param name - Event name to validate
 * @returns true if event name is valid
 */
export function isValidEventName(name: unknown): name is string {
  return typeof name === 'string' && name.length > 0 && /^[a-zA-Z0-9_:.\-]+$/.test(name);
}

/**
 * Check if attribute name is safe (prevents prototype pollution)
 *
 * @param name - Attribute name to validate
 * @returns true if attribute name is safe
 */
export function isSafeAttributeName(name: unknown): name is string {
  return (
    typeof name === 'string' &&
    name !== '__proto__' &&
    name !== 'constructor' &&
    name !== 'prototype'
  );
}
