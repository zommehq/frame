import { FUNCTION_REGISTRY_MAX_SIZE, SERIALIZATION_MAX_DEPTH } from '../constants';
import type { SerializedFunction } from '../types';

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
  if (typeof value !== 'object' || value === null) return false;

  return (
    value instanceof ArrayBuffer ||
    value instanceof MessagePort ||
    (typeof ImageBitmap !== 'undefined' && value instanceof ImageBitmap) ||
    (typeof OffscreenCanvas !== 'undefined' && value instanceof OffscreenCanvas) ||
    (typeof ReadableStream !== 'undefined' && value instanceof ReadableStream) ||
    (typeof WritableStream !== 'undefined' && value instanceof WritableStream) ||
    (typeof TransformStream !== 'undefined' && value instanceof TransformStream)
  );
}

/**
 * Serialize value for postMessage, collecting transferables and serializing functions
 *
 * Recursively processes values, converting functions to UUID tokens and collecting
 * transferable objects. Detects circular references to prevent infinite loops.
 * Limits recursion depth to prevent stack overflow.
 *
 * @param value - Value to serialize
 * @param functionRegistry - Map to store serialized functions
 * @param trackedFunctions - Set to track function IDs for cleanup
 * @param seen - WeakSet for circular reference detection. Uses WeakSet (not Set) because:
 *   - Objects are tracked by identity (===), not by value
 *   - No memory leaks: WeakSet doesn't prevent garbage collection of tracked objects
 *   - Automatic cleanup: When an object is no longer referenced elsewhere, it's removed from WeakSet
 *   - Cannot store primitives: Only objects/functions can be tracked (primitives can't be circular)
 *   Example: `const obj = { a: 1 }; obj.self = obj;` → WeakSet detects `obj.self === obj`
 * @param transferables - Array to collect transferable objects
 * @returns Serialized value and array of transferables
 */
export function serializeValue(
  value: unknown,
  functionRegistry: Map<string, Function>,
  trackedFunctions: Set<string>,
  seen = new WeakSet<object>(),
  transferables: Transferable[] = []
): { serialized: unknown; transferables: Transferable[] } {
  const serialize = (value: unknown, depth = 0): unknown => {
    // Check depth limit to prevent stack overflow
    // Throw error instead of silently truncating to prevent data loss
    if (depth > SERIALIZATION_MAX_DEPTH) {
      throw new Error(
        `[serialization] Serialization depth limit (${SERIALIZATION_MAX_DEPTH}) exceeded at level ${depth}. ` +
          `Consider flattening your data structure or increasing the limit.`
      );
    }

    if (value === null || value === undefined) {
      return value;
    }
    if (typeof value !== 'object' && typeof value !== 'function') {
      return value;
    }

    // Serialize functions
    if (typeof value === 'function') {
      // Check registry size limit to prevent DoS
      // Throw error instead of silently returning undefined for security limits
      if (functionRegistry.size >= FUNCTION_REGISTRY_MAX_SIZE) {
        throw new Error(
          `[serialization] Function registry limit (${FUNCTION_REGISTRY_MAX_SIZE}) exceeded. Cannot serialize more functions.`
        );
      }

      const fnId = crypto.randomUUID();
      functionRegistry.set(fnId, value);
      trackedFunctions.add(fnId);
      return {
        __fn: fnId,
        __meta: { name: value.name || 'anonymous' },
      } satisfies SerializedFunction;
    }

    // Collect transferable objects
    if (isTransferable(value)) {
      transferables.push(value);
      return value; // Keep in structure, postMessage will transfer
    }

    // Circular reference detection
    if (seen.has(value as object)) {
      console.warn('[serialization] Circular reference detected');
      return undefined;
    }
    seen.add(value as object);

    // Serialize arrays
    // At this point, value is known to be an object (not primitive, not function, not transferable)
    // Array.isArray provides runtime type safety, but TypeScript can't infer the type
    // Using explicit annotation is clearer than type assertion
    if (Array.isArray(value)) {
      const array: unknown[] = value;
      return array.map((item) => serialize(item, depth + 1));
    }

    // Serialize plain objects
    if (Object.prototype.toString.call(value) === '[object Object]') {
      const result: Record<string, unknown> = {};
      for (const [key, propertyValue] of Object.entries(value)) {
        result[key] = serialize(propertyValue, depth + 1);
      }
      return result;
    }

    return value;
  };

  return {
    serialized: serialize(value),
    transferables,
  };
}

/**
 * Deserialize value from postMessage, creating proxy functions
 */
export function deserializeValue(
  value: unknown,
  createProxyFunction: (fnId: string) => Function
): unknown {
  const deserialize = (value: unknown): unknown => {
    if (value === null || value === undefined) return value;
    if (typeof value !== 'object') return value;

    // Deserialize functions to proxy
    if (
      typeof value === 'object' &&
      value !== null &&
      '__fn' in value &&
      typeof (value as SerializedFunction).__fn === 'string'
    ) {
      const { __fn: fnId } = value as SerializedFunction;
      return createProxyFunction(fnId);
    }

    // Deserialize arrays
    if (Array.isArray(value)) {
      return value.map((item) => deserialize(item));
    }

    // Deserialize plain objects
    if (Object.prototype.toString.call(value) === '[object Object]') {
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
