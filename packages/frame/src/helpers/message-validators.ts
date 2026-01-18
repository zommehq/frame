import { VALID_MESSAGE_TYPES } from "../constants";
import type { Message } from "../types";

/**
 * Message validation utilities
 *
 * Shared validation logic used by both SDK and Frame
 * to reduce code duplication and ensure consistent validation.
 */

/**
 * Validate message structure
 *
 * Checks if message is valid object with type property
 */
export function isValidMessageStructure(message: unknown): message is { type: unknown } {
  return (
    message !== null && message !== undefined && typeof message === "object" && "type" in message
  );
}

/**
 * Validate message type is string
 *
 * After structure validation, ensures type is a string
 */
export function hasStringType(message: { type: unknown }): message is { type: string } {
  return typeof message.type === "string";
}

/**
 * Validate message type against whitelist
 *
 * Ensures type is one of the valid message types
 */
export function isWhitelistedMessageType(type: string): boolean {
  // Type assertion needed because Set.has() expects exact literal type
  return VALID_MESSAGE_TYPES.has(type as never);
}

/**
 * Complete message validation pipeline
 *
 * Combines all validation steps into a single function
 * Returns null if validation fails, or the typed message if valid
 */
export function validateMessage(data: unknown, logPrefix: string): Message | null {
  // Step 1: Validate structure
  if (!isValidMessageStructure(data)) {
    console.warn(`${logPrefix} Invalid message format:`, data);
    return null;
  }

  // Step 2: Validate type is string
  if (!hasStringType(data)) {
    console.warn(`${logPrefix} Invalid message type (not a string):`, data);
    return null;
  }

  // Step 3: Validate type is whitelisted
  if (!isWhitelistedMessageType(data.type)) {
    console.warn(`${logPrefix} Unknown message type (potential attack): ${data.type}`);
    return null;
  }

  // All validation passed
  return data as Message;
}
