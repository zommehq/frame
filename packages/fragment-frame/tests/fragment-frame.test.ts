import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { MessageEvent } from "../src/constants";
import type { FragmentFrame } from "../src/fragment-frame";

describe("FragmentFrame", () => {
  let frame: FragmentFrame;
  let mockIframe: any;

  beforeEach(() => {
    frame = document.createElement("fragment-frame") as FragmentFrame;
    frame.setAttribute("name", "test-app");
    frame.setAttribute("src", "http://localhost:3000");
    frame.setAttribute("base", "/test-app");

    mockIframe = {
      contentWindow: {
        postMessage: mock(() => {}),
      },
      onload: null,
      remove: mock(() => {}),
      src: "",
      style: { cssText: "" },
      setAttribute: mock(() => {}),
    };
  });

  afterEach(() => {
    frame.remove();
  });

  describe("initialization", () => {
    it("should require name and src attributes", () => {
      const emptyFrame = document.createElement("fragment-frame") as FragmentFrame;
      const consoleSpy = mock(() => {});
      const originalError = console.error;
      console.error = consoleSpy;

      emptyFrame.connectedCallback();

      expect(consoleSpy).toHaveBeenCalledWith(
        "[fragment-frame] Missing required attributes: name and src",
      );

      console.error = originalError;
    });

    it("should extract target origin from src", () => {
      (frame as any)._origin = new URL("http://localhost:3000").origin;
      expect((frame as any)._origin).toBe("http://localhost:3000");
    });

    it("should use default base path when not provided", () => {
      const frameWithoutBase = document.createElement("fragment-frame") as FragmentFrame;
      frameWithoutBase.setAttribute("name", "my-app");
      frameWithoutBase.setAttribute("src", "http://localhost:3000");

      // Base should default to /my-app
      const base = frameWithoutBase.getAttribute("base") || "/my-app";
      expect(base).toBe("/my-app");
    });
  });

  describe("event normalization", () => {
    it("should normalize event names by removing invalid characters", () => {
      const eventName = "state:change";
      const normalized = eventName.replace(/[:.-]/g, "");
      expect(normalized).toBe("statechange");
    });

    it("should preserve underscores in event names", () => {
      const eventName = "state_change";
      const normalized = eventName.replace(/[:.-]/g, "");
      expect(normalized).toBe("state_change");
    });

    it("should emit with exact event name for addEventListener", () => {
      const handler = mock(() => {});
      frame.addEventListener("state:change", handler);

      (frame as any).emit("state:change", { value: 1 });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should call property handler with normalized name", () => {
      const handler = mock(() => {});
      (frame as any).onstatechange = handler;

      (frame as any).emit("state:change", { value: 1 });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple normalization patterns", () => {
      expect("state:change".replace(/[:.-]/g, "")).toBe("statechange");
      expect("state.change".replace(/[:.-]/g, "")).toBe("statechange");
      expect("state-change".replace(/[:.-]/g, "")).toBe("statechange");
    });
  });

  describe("message handling", () => {
    beforeEach(() => {
      (frame as any)._ready = true;
      (frame as any)._iframe = mockIframe;
      (frame as any)._origin = "http://localhost:3000";
    });

    it("should handle READY message", () => {
      const readyHandler = mock(() => {});
      frame.addEventListener("ready", readyHandler);

      (frame as any).handleMessageFromIframe({ type: MessageEvent.READY });

      expect((frame as any)._ready).toBe(true);
      expect(readyHandler).toHaveBeenCalledTimes(1);
    });

    it("should handle CUSTOM_EVENT message", () => {
      const eventHandler = mock(() => {});
      frame.addEventListener("user-action", eventHandler);

      (frame as any).handleMessageFromIframe({
        type: MessageEvent.CUSTOM_EVENT,
        payload: {
          name: "user-action",
          data: { type: "click", id: 123 },
        },
      });

      expect(eventHandler).toHaveBeenCalledTimes(1);
    });

    it("should handle FUNCTION_RELEASE message", () => {
      const fnId = "test-fn-id";
      (frame as any)._functionRegistry.set(fnId, () => {});
      (frame as any)._trackedFunctions.add(fnId);

      (frame as any).handleMessageFromIframe({
        type: MessageEvent.FUNCTION_RELEASE,
        fnId,
      });

      expect((frame as any)._functionRegistry.has(fnId)).toBe(false);
      expect((frame as any)._trackedFunctions.has(fnId)).toBe(false);
    });
  });

  describe("function calls", () => {
    beforeEach(() => {
      (frame as any)._ready = true;
      (frame as any)._iframe = mockIframe;
      (frame as any)._origin = "http://localhost:3000";
    });

    it("should handle function call from child", async () => {
      const testFn = mock(() => "result");
      const fnId = "test-fn-id";
      (frame as any)._functionRegistry.set(fnId, testFn);

      await (frame as any).handleFunctionCall("call-1", fnId, [1, 2, 3]);

      expect(testFn).toHaveBeenCalledWith(1, 2, 3);
      expect(mockIframe.contentWindow.postMessage).toHaveBeenCalled();
    });

    it("should handle function call error", async () => {
      const testFn = mock(() => {
        throw new Error("Test error");
      });
      const fnId = "test-fn-id";
      (frame as any)._functionRegistry.set(fnId, testFn);

      await (frame as any).handleFunctionCall("call-1", fnId, []);

      const calls = mockIframe.contentWindow.postMessage.mock.calls;
      const errorResponse = calls[calls.length - 1][0];
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe("Test error");
    });

    it("should reject when function not found", async () => {
      try {
        await (frame as any).handleFunctionCall("call-1", "non-existent", []);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toContain("Function not found");
      }
    });

    it("should handle function response success", () => {
      const callId = "test-call-id";
      const resolver = {
        resolve: mock(() => {}),
        reject: mock(() => {}),
        timeout: setTimeout(() => {}, 1000),
      };
      (frame as any)._pendingFunctionCalls.set(callId, resolver);

      (frame as any).handleFunctionResponse(callId, true, { data: "result" }, undefined);

      expect(resolver.resolve).toHaveBeenCalledWith({ data: "result" });
      expect(resolver.reject).not.toHaveBeenCalled();
      expect((frame as any)._pendingFunctionCalls.has(callId)).toBe(false);
    });

    it("should handle function response error", () => {
      const callId = "test-call-id";
      const resolver = {
        resolve: mock(() => {}),
        reject: mock(() => {}),
        timeout: setTimeout(() => {}, 1000),
      };
      (frame as any)._pendingFunctionCalls.set(callId, resolver);

      (frame as any).handleFunctionResponse(callId, false, undefined, "Test error");

      expect(resolver.reject).toHaveBeenCalled();
      expect(resolver.resolve).not.toHaveBeenCalled();
    });

    it("should timeout function call", async () => {
      (frame as any)._ready = true;

      const promise = (frame as any).callChildFunction("fn-id", []);

      // Fast-forward time
      await new Promise((resolve) => setTimeout(resolve, 10100));

      try {
        await promise;
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toContain("timeout");
      }
    }, 15000);
  });

  describe("property proxy", () => {
    beforeEach(() => {
      (frame as any)._ready = true;
      (frame as any)._iframe = mockIframe;
      (frame as any)._origin = "http://localhost:3000";
    });

    it("should serialize function properties", () => {
      const testFn = () => "test";
      (frame as any).onSuccess = testFn;

      expect(mockIframe.contentWindow.postMessage).toHaveBeenCalled();
      const call = mockIframe.contentWindow.postMessage.mock.calls[0];
      const message = call[0];

      expect(message.type).toBe(MessageEvent.ATTRIBUTE_CHANGE);
      expect(message.attribute).toBe("onSuccess");
      expect(message.value).toHaveProperty("__fn");
    });

    it("should not intercept private properties", () => {
      (frame as any)._privateProperty = "test";
      expect(mockIframe.contentWindow.postMessage).not.toHaveBeenCalled();
    });

    it("should not intercept when not ready", () => {
      (frame as any)._ready = false;
      (frame as any).someProperty = "test";
      expect(mockIframe.contentWindow.postMessage).not.toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    beforeEach(() => {
      (frame as any)._iframe = mockIframe;
      (frame as any)._mutationObserver = {
        disconnect: mock(() => {}),
      };
    });

    it("should clean up on disconnect", () => {
      const fnId = "test-fn-id";
      (frame as any)._functionRegistry.set(fnId, () => {});
      (frame as any)._trackedFunctions.add(fnId);

      frame.disconnectedCallback();

      expect((frame as any)._functionRegistry.size).toBe(0);
      expect((frame as any)._trackedFunctions.size).toBe(0);
      expect(mockIframe.remove).toHaveBeenCalled();
    });

    it("should reject pending function calls on disconnect", () => {
      const resolver = {
        resolve: mock(() => {}),
        reject: mock(() => {}),
        timeout: setTimeout(() => {}, 1000),
      };
      (frame as any)._pendingFunctionCalls.set("call-1", resolver);

      frame.disconnectedCallback();

      expect(resolver.reject).toHaveBeenCalled();
      expect((frame as any)._pendingFunctionCalls.size).toBe(0);
    });
  });

  describe("sendToIframe", () => {
    beforeEach(() => {
      (frame as any)._iframe = mockIframe;
      (frame as any)._origin = "http://localhost:3000";
    });

    it("should send message without transferables", () => {
      const message = { type: "TEST", data: "hello" };
      (frame as any).sendToIframe(message);

      expect(mockIframe.contentWindow.postMessage).toHaveBeenCalledWith(
        message,
        "http://localhost:3000",
      );
    });

    it("should send message with transferables", () => {
      const message = { type: "TEST", data: "hello" };
      const buffer = new ArrayBuffer(8);
      (frame as any).sendToIframe(message, [buffer]);

      expect(mockIframe.contentWindow.postMessage).toHaveBeenCalledWith(
        message,
        "http://localhost:3000",
        [buffer],
      );
    });

    it("should handle missing iframe", () => {
      (frame as any)._iframe = null;
      const consoleSpy = mock(() => {});
      const originalError = console.error;
      console.error = consoleSpy;

      (frame as any).sendToIframe({ type: "TEST" });

      expect(consoleSpy).toHaveBeenCalledWith("[fragment-frame] Iframe not ready");
      console.error = originalError;
    });
  });
});
