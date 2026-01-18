import { FUNCTION_CALL_TIMEOUT, MessageEvent } from "../constants";
import type { PostMessageFn } from "../types";
import { deserializeValue, serializeValue } from "./serialization";

interface PendingFunctionCall {
  reject: (reason?: unknown) => void;
  resolve: (value: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
}

/**
 * Manages function serialization, remote calls, and lifecycle
 *
 * Centralizes all function-related logic for bidirectional RPC between parent and child:
 * - Serializes functions to UUID tokens
 * - Maintains function registry and tracks lifecycle
 * - Handles async remote function calls with timeout
 * - Manages cleanup on disconnect
 *
 * Used by both Frame (parent) and FrameSDK (child).
 */
export class FunctionManager {
  private _functionRegistry = new Map<string, Function>();
  private _pendingFunctionCalls = new Map<string, PendingFunctionCall>();
  private _trackedFunctions = new Set<string>();
  private _postMessage: PostMessageFn;

  constructor(postMessage: PostMessageFn) {
    this._postMessage = postMessage;
  }

  /**
   * Serialize a value (including functions and transferables)
   */
  serialize(value: unknown): {
    serialized: unknown;
    transferables: Transferable[];
  } {
    return serializeValue(value, this._functionRegistry, this._trackedFunctions);
  }

  /**
   * Deserialize a value (creating proxy functions)
   */
  deserialize(value: unknown): unknown {
    return deserializeValue(value, (fnId: string) => this._createProxyFunction(fnId));
  }

  /**
   * Create a proxy function that calls a remote function
   *
   * Returns a function that, when called, sends a FUNCTION_CALL message
   * to the remote side and waits for a response.
   *
   * @param fnId - Function ID to call remotely
   * @returns Proxy function that forwards calls to remote side
   */
  private _createProxyFunction(fnId: string): Function {
    return (...args: unknown[]) => this._callRemoteFunction(fnId, args);
  }

  /**
   * Call a function registered on the remote side
   *
   * Sends a FUNCTION_CALL message and waits for FUNCTION_RESPONSE.
   * Includes timeout protection to prevent indefinite waiting.
   *
   * @param fnId - Function ID to call
   * @param params - Parameters to pass to the function
   * @returns Promise that resolves with the function result
   * @throws Error if call times out or remote function throws
   */
  private _callRemoteFunction(fnId: string, params: unknown[]): Promise<unknown> {
    const callId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this._pendingFunctionCalls.delete(callId);
        reject(new Error(`Function call timeout: ${fnId}`));
      }, FUNCTION_CALL_TIMEOUT);

      this._pendingFunctionCalls.set(callId, { reject, resolve, timeout });

      const { serialized, transferables } = this.serialize(params);

      this._postMessage(
        {
          callId,
          fnId,
          params: serialized,
          type: MessageEvent.FUNCTION_CALL,
        },
        transferables,
      );
    });
  }

  /**
   * Handle incoming function call from remote side
   */
  async handleFunctionCall(callId: string, fnId: string, params: unknown): Promise<void> {
    try {
      const fn = this._functionRegistry.get(fnId);
      if (!fn) {
        throw new Error(`Function not found: ${fnId}`);
      }

      // Deserialize params (may contain functions from remote)
      const deserializedParams = this.deserialize(params);
      const args = Array.isArray(deserializedParams) ? deserializedParams : [deserializedParams];

      // Call function
      const result = await fn(...args);

      // Serialize result (may contain functions)
      const { serialized, transferables } = this.serialize(result);

      this._postMessage(
        {
          callId,
          result: serialized,
          success: true,
          type: MessageEvent.FUNCTION_RESPONSE,
        },
        transferables,
      );
    } catch (err) {
      this._postMessage({
        callId,
        error: err instanceof Error ? err.message : "Unknown error",
        success: false,
        type: MessageEvent.FUNCTION_RESPONSE,
      });
    }
  }

  /**
   * Handle function call response from remote side
   */
  handleFunctionResponse(callId: string, success: boolean, result?: unknown, error?: string): void {
    const pending = this._pendingFunctionCalls.get(callId);
    if (!pending) return;

    clearTimeout(pending.timeout);
    this._pendingFunctionCalls.delete(callId);

    if (success) {
      // Deserialize result (may contain functions from remote)
      const deserializedResult = this.deserialize(result);
      pending.resolve(deserializedResult);
    } else {
      pending.reject(new Error(error || "Unknown error"));
    }
  }

  /**
   * Release a function from registry
   */
  releaseFunction(fnId: string): void {
    this._functionRegistry.delete(fnId);
    this._trackedFunctions.delete(fnId);
  }

  /**
   * Get all tracked function IDs (for cleanup)
   */
  getTrackedFunctions(): string[] {
    return Array.from(this._trackedFunctions);
  }

  /**
   * Cleanup all resources
   *
   * CRITICAL: Clears ALL pending function call timeouts to prevent memory leaks.
   * Must be called when destroying the frame or parent component.
   */
  cleanup(): void {
    // Clear ALL pending timeouts and reject pending calls
    for (const [_callId, pending] of this._pendingFunctionCalls) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("FunctionManager destroyed"));
    }
    this._pendingFunctionCalls.clear();

    // Clear registries
    this._functionRegistry.clear();
    this._trackedFunctions.clear();
  }
}
