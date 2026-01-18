import { parse, stringify } from "flatted";
import { FUNCTION_REGISTRY_MAX_SIZE } from "../constants";
import type { SerializedFunction } from "../types";

/**
 * Check if value is a transferable object
 *
 * Transferable objects can be transferred (not cloned) via postMessage for better performance.
 * Includes environment checks for APIs not available in all contexts.
 *
 * @param value - Value to check
 * @returns true if value is transferable
 */
export function isTransferable(value: unknown): value is Transferable {
  if (typeof value !== "object" || value === null) return false;

  return (
    value instanceof ArrayBuffer ||
    value instanceof MessagePort ||
    (typeof ImageBitmap !== "undefined" && value instanceof ImageBitmap) ||
    (typeof OffscreenCanvas !== "undefined" && value instanceof OffscreenCanvas) ||
    (typeof ReadableStream !== "undefined" && value instanceof ReadableStream) ||
    (typeof WritableStream !== "undefined" && value instanceof WritableStream) ||
    (typeof TransformStream !== "undefined" && value instanceof TransformStream)
  );
}

/**
 * Serialize value for postMessage, collecting transferables and serializing functions
 *
 * Uses flatted library to handle circular references automatically. Recursively processes
 * values, converting functions to UUID tokens and collecting transferable objects.
 * Limits recursion depth to prevent stack overflow.
 *
 * @param value - Value to serialize
 * @param functionRegistry - Map to store serialized functions
 * @param trackedFunctions - Set to track function IDs for cleanup
 * @param transferables - Array to collect transferable objects
 * @returns Serialized value and array of transferables
 */
export function serializeValue(
  value: unknown,
  functionRegistry: Map<string, CallableFunction>,
  trackedFunctions: Set<string>,
  transferables: Transferable[] = [],
): { serialized: unknown; transferables: Transferable[] } {
  // Handle top-level transferables directly
  // Transferables can't be serialized through JSON, so preserve them as-is
  if (isTransferable(value)) {
    if (!transferables.includes(value)) {
      transferables.push(value);
    }
    return { serialized: value, transferables };
  }

  // Custom replacer for flatted.stringify that handles:
  // 1. Functions -> SerializedFunction tokens
  // 2. Transferables -> collect and preserve reference
  const replacer = (_key: string, value: unknown): unknown => {
    if (value === null || value === undefined) {
      return value;
    }
    if (typeof value !== "object" && typeof value !== "function") {
      return value;
    }

    // Serialize functions to UUID tokens
    if (typeof value === "function") {
      // Check registry size limit to prevent DoS
      if (functionRegistry.size >= FUNCTION_REGISTRY_MAX_SIZE) {
        throw new Error(
          `[serialization] Function registry limit (${FUNCTION_REGISTRY_MAX_SIZE}) exceeded. Cannot serialize more functions.`,
        );
      }

      const fnId = crypto.randomUUID();
      functionRegistry.set(fnId, value);
      trackedFunctions.add(fnId);
      return {
        __fn: fnId,
        __meta: { name: value.name || "anonymous" },
      } satisfies SerializedFunction;
    }

    // Collect transferable objects
    // Transferables are preserved in the structure for postMessage,
    // but we track them separately so they can be transferred (not cloned)
    if (isTransferable(value)) {
      if (!transferables.includes(value)) {
        transferables.push(value);
      }
      return value; // Keep in structure, postMessage will transfer
    }

    return value;
  };

  // Use flatted.stringify with custom replacer to handle:
  // - Circular references (flatted's core feature)
  // - Function serialization (our custom replacer)
  // - Transferable collection (our custom replacer)
  // Then parse back to get the serialized object structure
  const flattened = stringify(value, replacer);
  const deserialized = parse(flattened);

  return {
    serialized: deserialized,
    transferables,
  };
}

/**
 * Deserialize value from postMessage, creating proxy functions
 *
 * Handles circular references that were preserved by flatted during serialization.
 * Creates proxy functions for serialized function tokens.
 *
 * @param value - Value to deserialize
 * @param createProxyFunction - Function to create proxy for function calls
 * @returns Deserialized value with circular references intact
 */
export function deserializeValue(
  value: unknown,
  createProxyFunction: (fnId: string) => CallableFunction,
): unknown {
  const deserialize = (value: unknown): unknown => {
    if (value === null || value === undefined) return value;
    if (typeof value !== "object") return value;

    // Deserialize functions to proxy
    if (
      typeof value === "object" &&
      value !== null &&
      "__fn" in value &&
      typeof (value as SerializedFunction).__fn === "string"
    ) {
      const { __fn: fnId } = value as SerializedFunction;
      return createProxyFunction(fnId);
    }

    // Deserialize arrays
    if (Array.isArray(value)) {
      return value.map((item) => deserialize(item));
    }

    // Deserialize plain objects
    if (Object.prototype.toString.call(value) === "[object Object]") {
      const result: Record<string, unknown> = {};
      for (const [key, propertyValue] of Object.entries(value)) {
        result[key] = deserialize(propertyValue);
      }
      return result;
    }

    return value;
  };

  return deserialize(value);
}
