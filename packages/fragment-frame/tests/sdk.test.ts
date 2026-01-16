import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { MessageEvent } from "../src/constants";
import { FrameSDK } from "../src/sdk";
import type { InitMessage } from "../src/types";

describe("FrameSDK", () => {
  let sdk: FrameSDK;
  let originalPostMessage: typeof window.parent.postMessage;

  beforeEach(() => {
    sdk = new FrameSDK();
    originalPostMessage = window.parent.postMessage;
    window.parent.postMessage = mock(() => {}) as any;
  });

  afterEach(() => {
    window.parent.postMessage = originalPostMessage;
  });

  describe("initialization", () => {
    it("should wait for INIT message", async () => {
      const initPromise = sdk.initialize();

      // Simulate INIT message
      setTimeout(() => {
        const initMessage: InitMessage = {
          type: MessageEvent.INIT,
          payload: {
            name: "test-app",
            base: "/test-app",
            apiUrl: "https://api.test.com",
          },
        };

        window.dispatchEvent(
          new MessageEvent("message", {
            data: initMessage,
            origin: "http://localhost:4200",
          } as any),
        );
      }, 10);

      await initPromise;

      expect(sdk.props).toBeDefined();
      expect(sdk.props.name).toBe("test-app");
      expect(sdk.props.base).toBe("/test-app");
      expect(sdk.props.apiUrl).toBe("https://api.test.com");
    });

    it("should send READY message after initialization", async () => {
      const initPromise = sdk.initialize();

      setTimeout(() => {
        const initMessage: InitMessage = {
          type: MessageEvent.INIT,
          payload: {
            name: "test-app",
            base: "/test-app",
          },
        };

        window.dispatchEvent(
          new MessageEvent("message", {
            data: initMessage,
            origin: "http://localhost:4200",
          } as any),
        );
      }, 10);

      await initPromise;

      const postMessageMock = window.parent.postMessage as any;
      expect(postMessageMock).toHaveBeenCalled();

      const calls = postMessageMock.mock.calls;
      const readyCall = calls.find((call: any) => call[0].type === MessageEvent.READY);
      expect(readyCall).toBeDefined();
    });

    it("should deserialize functions in props", async () => {
      const initPromise = sdk.initialize();

      setTimeout(() => {
        const initMessage: InitMessage = {
          type: MessageEvent.INIT,
          payload: {
            name: "test-app",
            base: "/test-app",
            onSuccess: {
              __fn: "test-fn-id",
              __meta: { name: "onSuccess" },
            } as any,
          },
        };

        window.dispatchEvent(
          new MessageEvent("message", {
            data: initMessage,
            origin: "http://localhost:4200",
          } as any),
        );
      }, 10);

      await initPromise;

      expect(typeof sdk.props.onSuccess).toBe("function");
    });
  });

  describe("emit", () => {
    beforeEach(async () => {
      const initPromise = sdk.initialize();

      setTimeout(() => {
        window.dispatchEvent(
          new MessageEvent("message", {
            data: {
              type: MessageEvent.INIT,
              payload: { name: "test", base: "/test" },
            },
            origin: "http://localhost:4200",
          } as any),
        );
      }, 10);

      await initPromise;
    });

    it("should emit custom event to parent", () => {
      sdk.emit("user-action", { type: "click", id: 123 });

      const postMessageMock = window.parent.postMessage as any;
      const calls = postMessageMock.mock.calls;
      const emitCall = calls.find((call: any) => call[0].type === MessageEvent.CUSTOM_EVENT);

      expect(emitCall).toBeDefined();
      expect(emitCall[0].payload.name).toBe("user-action");
      expect(emitCall[0].payload.data).toEqual({ type: "click", id: 123 });
    });

    it("should emit event without data", () => {
      sdk.emit("data-loaded");

      const postMessageMock = window.parent.postMessage as any;
      const calls = postMessageMock.mock.calls;
      const emitCall = calls.find((call: any) => call[0].type === MessageEvent.CUSTOM_EVENT);

      expect(emitCall).toBeDefined();
      expect(emitCall[0].payload.name).toBe("data-loaded");
    });

    it("should serialize functions in event data", () => {
      const callback = () => "test";
      sdk.emit("action", { callback });

      const postMessageMock = window.parent.postMessage as any;
      const calls = postMessageMock.mock.calls;
      const emitCall = calls.find((call: any) => call[0].type === MessageEvent.CUSTOM_EVENT);

      expect(emitCall[0].payload.data.callback).toHaveProperty("__fn");
    });

    it("should send transferables", () => {
      const buffer = new ArrayBuffer(8);
      sdk.emit("data", { buffer });

      const postMessageMock = window.parent.postMessage as any;
      const calls = postMessageMock.mock.calls;
      const emitCall = calls.find((call: any) => call[0].type === MessageEvent.CUSTOM_EVENT);

      expect(emitCall[2]).toContain(buffer);
    });
  });

  describe("register", () => {
    beforeEach(async () => {
      const initPromise = sdk.initialize();

      setTimeout(() => {
        window.dispatchEvent(
          new MessageEvent("message", {
            data: {
              type: MessageEvent.INIT,
              payload: { name: "test", base: "/test" },
            },
            origin: "http://localhost:4200",
          } as any),
        );
      }, 10);

      await initPromise;
    });

    it("should register single function with name", () => {
      const refresh = mock(() => "refreshed");
      const unregister = sdk.register("refresh", refresh);

      const postMessageMock = window.parent.postMessage as any;
      const calls = postMessageMock.mock.calls;
      const registerCall = calls.find(
        (call: any) =>
          call[0].type === MessageEvent.CUSTOM_EVENT && call[0].payload.name === "register",
      );

      expect(registerCall).toBeDefined();
      expect(registerCall[0].payload.data.refresh).toHaveProperty("__fn");
      expect(typeof unregister).toBe("function");
    });

    it("should register multiple functions with object", () => {
      const functions = {
        refresh: mock(() => "refreshed"),
        export: mock(async (format: string) => `exported-${format}`),
        close: mock(() => undefined),
      };

      const unregister = sdk.register(functions);

      const postMessageMock = window.parent.postMessage as any;
      const calls = postMessageMock.mock.calls;
      const registerCall = calls.find(
        (call: any) =>
          call[0].type === MessageEvent.CUSTOM_EVENT && call[0].payload.name === "register",
      );

      expect(registerCall).toBeDefined();
      expect(registerCall[0].payload.data.refresh).toHaveProperty("__fn");
      expect(registerCall[0].payload.data.export).toHaveProperty("__fn");
      expect(registerCall[0].payload.data.close).toHaveProperty("__fn");
      expect(typeof unregister).toBe("function");
    });

    it("should throw TypeError if single function registration receives non-function", () => {
      expect(() => {
        sdk.register("invalid", "not-a-function" as any);
      }).toThrow(TypeError);

      expect(() => {
        sdk.register("invalid", 123 as any);
      }).toThrow(TypeError);

      expect(() => {
        sdk.register("invalid", null as any);
      }).toThrow(TypeError);
    });

    it("should throw TypeError if object registration contains non-function values", () => {
      expect(() => {
        sdk.register({
          validFn: () => {},
          invalidValue: "not-a-function",
        } as any);
      }).toThrow(TypeError);

      expect(() => {
        sdk.register({
          fn1: () => {},
          fn2: 123,
        } as any);
      }).toThrow(TypeError);
    });

    it("should throw TypeError if first parameter is neither string nor object", () => {
      expect(() => {
        sdk.register(123 as any);
      }).toThrow(TypeError);

      expect(() => {
        sdk.register(null as any);
      }).toThrow(TypeError);

      expect(() => {
        sdk.register(undefined as any);
      }).toThrow(TypeError);
    });

    it("should emit unregister event when cleanup function is called", () => {
      const refresh = mock(() => "refreshed");
      const unregister = sdk.register("refresh", refresh);

      // Clear previous calls
      const postMessageMock = window.parent.postMessage as any;
      postMessageMock.mockClear();

      // Call unregister
      unregister();

      const calls = postMessageMock.mock.calls;
      const unregisterCall = calls.find(
        (call: any) =>
          call[0].type === MessageEvent.CUSTOM_EVENT && call[0].payload.name === "unregister",
      );

      expect(unregisterCall).toBeDefined();
      expect(unregisterCall[0].payload.data.functions).toContain("refresh");
    });

    it("should emit unregister with multiple function names", () => {
      const functions = {
        refresh: mock(() => {}),
        export: mock(() => {}),
        close: mock(() => {}),
      };

      const unregister = sdk.register(functions);

      // Clear previous calls
      const postMessageMock = window.parent.postMessage as any;
      postMessageMock.mockClear();

      // Call unregister
      unregister();

      const calls = postMessageMock.mock.calls;
      const unregisterCall = calls.find(
        (call: any) =>
          call[0].type === MessageEvent.CUSTOM_EVENT && call[0].payload.name === "unregister",
      );

      expect(unregisterCall).toBeDefined();
      expect(unregisterCall[0].payload.data.functions).toContain("refresh");
      expect(unregisterCall[0].payload.data.functions).toContain("export");
      expect(unregisterCall[0].payload.data.functions).toContain("close");
    });

    it("should use standard 'register' event name", () => {
      const fn = mock(() => {});
      sdk.register("test", fn);

      const postMessageMock = window.parent.postMessage as any;
      const calls = postMessageMock.mock.calls;
      const registerCall = calls.find((call: any) => call[0].type === MessageEvent.CUSTOM_EVENT);

      expect(registerCall[0].payload.name).toBe("register");
    });
  });

  describe("event listeners", () => {
    beforeEach(async () => {
      const initPromise = sdk.initialize();

      setTimeout(() => {
        window.dispatchEvent(
          new MessageEvent("message", {
            data: {
              type: MessageEvent.INIT,
              payload: { name: "test", base: "/test" },
            },
            origin: "http://localhost:4200",
          } as any),
        );
      }, 10);

      await initPromise;
    });

    it("should register event listener", () => {
      const handler = mock(() => {});
      sdk.on("test-event", handler);

      expect((sdk as any).eventListeners.has("test-event")).toBe(true);
      expect((sdk as any).eventListeners.get("test-event").has(handler)).toBe(true);
    });

    it("should remove event listener", () => {
      const handler = mock(() => {});
      sdk.on("test-event", handler);
      sdk.off("test-event", handler);

      expect((sdk as any).eventListeners.get("test-event")?.has(handler)).toBe(false);
    });

    it("should call listener when event received", () => {
      const handler = mock(() => {});
      sdk.on("custom-event", handler);

      (sdk as any).handleMessage({
        origin: (sdk as any).parentOrigin,
        data: {
          type: MessageEvent.EVENT,
          name: "custom-event",
          data: { value: 42 },
        },
      });

      expect(handler).toHaveBeenCalledWith({ value: 42 });
    });

    it("should handle custom events from parent", () => {
      const handler = mock(() => {});
      sdk.on("custom-event", handler);

      (sdk as any)._handleMessage({
        origin: (sdk as any)._parentOrigin,
        data: {
          type: MessageEvent.EVENT,
          name: "custom-event",
          data: { value: 42 },
        },
      });

      expect(handler).toHaveBeenCalledWith({ value: 42 });
    });
  });

  describe("message handling", () => {
    beforeEach(async () => {
      const initPromise = sdk.initialize();

      setTimeout(() => {
        window.dispatchEvent(
          new MessageEvent("message", {
            data: {
              type: MessageEvent.INIT,
              payload: { name: "test", base: "/test" },
            },
            origin: "http://localhost:4200",
          } as any),
        );
      }, 10);

      await initPromise;
    });

    it("should ignore messages from wrong origin", () => {
      const handler = mock(() => {});
      sdk.on("test-event", handler);

      (sdk as any).handleMessage({
        origin: "http://evil.com",
        data: {
          type: MessageEvent.EVENT,
          name: "test-event",
          data: {},
        },
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it("should handle ATTRIBUTE_CHANGE message", () => {
      (sdk as any).handleMessage({
        origin: (sdk as any).parentOrigin,
        data: {
          type: MessageEvent.ATTRIBUTE_CHANGE,
          attribute: "theme",
          value: "dark",
        },
      });

      expect(sdk.props.theme).toBe("dark");
    });

    it("should handle FUNCTION_RELEASE message", () => {
      const fnId = "test-fn-id";
      (sdk as any).functionRegistry.set(fnId, () => {});
      (sdk as any).trackedFunctions.add(fnId);

      (sdk as any).handleMessage({
        origin: (sdk as any).parentOrigin,
        data: {
          type: MessageEvent.FUNCTION_RELEASE,
          fnId,
        },
      });

      expect((sdk as any).functionRegistry.has(fnId)).toBe(false);
      expect((sdk as any).trackedFunctions.has(fnId)).toBe(false);
    });
  });

  describe("function calls", () => {
    beforeEach(async () => {
      const initPromise = sdk.initialize();

      setTimeout(() => {
        window.dispatchEvent(
          new MessageEvent("message", {
            data: {
              type: MessageEvent.INIT,
              payload: { name: "test", base: "/test" },
            },
            origin: "http://localhost:4200",
          } as any),
        );
      }, 10);

      await initPromise;
    });

    it("should handle function call from parent", async () => {
      const testFn = mock(() => "result");
      const fnId = "test-fn-id";
      (sdk as any).functionRegistry.set(fnId, testFn);

      await (sdk as any).handleFunctionCall("call-1", fnId, [1, 2, 3]);

      expect(testFn).toHaveBeenCalledWith(1, 2, 3);
    });

    it("should handle function call error", async () => {
      const testFn = mock(() => {
        throw new Error("Test error");
      });
      const fnId = "test-fn-id";
      (sdk as any).functionRegistry.set(fnId, testFn);

      await (sdk as any).handleFunctionCall("call-1", fnId, []);

      const postMessageMock = window.parent.postMessage as any;
      const calls = postMessageMock.mock.calls;
      const responseCall = calls.find(
        (call: any) => call[0].type === MessageEvent.FUNCTION_RESPONSE,
      );

      expect(responseCall[0].success).toBe(false);
      expect(responseCall[0].error).toBe("Test error");
    });

    it("should handle function response success", () => {
      const callId = "test-call-id";
      const resolver = {
        resolve: mock(() => {}),
        reject: mock(() => {}),
        timeout: setTimeout(() => {}, 1000),
      };
      (sdk as any).pendingFunctionCalls.set(callId, resolver);

      (sdk as any).handleFunctionResponse(callId, true, { data: "result" }, undefined);

      expect(resolver.resolve).toHaveBeenCalledWith({ data: "result" });
      expect(resolver.reject).not.toHaveBeenCalled();
    });

    it("should handle function response error", () => {
      const callId = "test-call-id";
      const resolver = {
        resolve: mock(() => {}),
        reject: mock(() => {}),
        timeout: setTimeout(() => {}, 1000),
      };
      (sdk as any).pendingFunctionCalls.set(callId, resolver);

      (sdk as any).handleFunctionResponse(callId, false, undefined, "Test error");

      expect(resolver.reject).toHaveBeenCalled();
      expect(resolver.resolve).not.toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("should release functions on beforeunload", async () => {
      const initPromise = sdk.initialize();

      setTimeout(() => {
        window.dispatchEvent(
          new MessageEvent("message", {
            data: {
              type: MessageEvent.INIT,
              payload: { name: "test", base: "/test" },
            },
            origin: "http://localhost:4200",
          } as any),
        );
      }, 10);

      await initPromise;

      const fnId = "test-fn-id";
      (sdk as any).trackedFunctions.add(fnId);

      window.dispatchEvent(new Event("beforeunload"));

      const postMessageMock = window.parent.postMessage as any;
      const calls = postMessageMock.mock.calls;
      const releaseCall = calls.find(
        (call: any) => call[0].type === MessageEvent.FUNCTION_RELEASE && call[0].fnId === fnId,
      );

      expect(releaseCall).toBeDefined();
    });
  });

  describe("sendToParent", () => {
    beforeEach(async () => {
      const initPromise = sdk.initialize();

      setTimeout(() => {
        window.dispatchEvent(
          new MessageEvent("message", {
            data: {
              type: MessageEvent.INIT,
              payload: { name: "test", base: "/test" },
            },
            origin: "http://localhost:4200",
          } as any),
        );
      }, 10);

      await initPromise;
    });

    it("should send message without transferables", () => {
      const message = { type: "TEST", data: "hello" };
      (sdk as any).sendToParent(message);

      const postMessageMock = window.parent.postMessage as any;
      expect(postMessageMock).toHaveBeenCalledWith(message, (sdk as any).parentOrigin);
    });

    it("should send message with transferables", () => {
      const message = { type: "TEST", data: "hello" };
      const buffer = new ArrayBuffer(8);
      (sdk as any).sendToParent(message, [buffer]);

      const postMessageMock = window.parent.postMessage as any;
      const calls = postMessageMock.mock.calls;
      const call = calls[calls.length - 1];

      expect(call[0]).toEqual(message);
      expect(call[1]).toBe((sdk as any).parentOrigin);
      expect(call[2]).toContain(buffer);
    });
  });

  describe("watch API", () => {
    beforeEach(async () => {
      const initPromise = sdk.initialize();

      setTimeout(() => {
        window.dispatchEvent(
          new MessageEvent("message", {
            data: {
              type: MessageEvent.INIT,
              payload: { name: "test", base: "/test", theme: "light" },
            },
            origin: "http://localhost:4200",
          } as any),
        );
      }, 10);

      await initPromise;
    });

    it("should watch all property changes", () => {
      const handler = mock(() => {});
      sdk.watch(handler);

      (sdk as any)._handleMessage({
        origin: (sdk as any)._parentOrigin,
        data: {
          type: MessageEvent.ATTRIBUTE_CHANGE,
          attribute: "theme",
          value: "dark",
        },
      });

      expect(handler).toHaveBeenCalledTimes(1);
      const changes = handler.mock.calls[0][0];
      expect(changes.theme).toBeDefined();
      expect(changes.theme[0]).toBe("dark");
      expect(changes.theme[1]).toBe("light");
    });

    it("should watch specific properties", () => {
      const handler = mock(() => {});
      sdk.watch(["theme"], handler);

      // Change watched property
      (sdk as any)._handleMessage({
        origin: (sdk as any)._parentOrigin,
        data: {
          type: MessageEvent.ATTRIBUTE_CHANGE,
          attribute: "theme",
          value: "dark",
        },
      });

      expect(handler).toHaveBeenCalledTimes(1);

      // Change unwatched property
      (sdk as any)._handleMessage({
        origin: (sdk as any)._parentOrigin,
        data: {
          type: MessageEvent.ATTRIBUTE_CHANGE,
          attribute: "apiUrl",
          value: "https://new-api.com",
        },
      });

      // Should not be called again
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should return unwatch function", () => {
      const handler = mock(() => {});
      const unwatch = sdk.watch(handler);

      // Call unwatch
      unwatch();

      // Trigger change
      (sdk as any)._handleMessage({
        origin: (sdk as any)._parentOrigin,
        data: {
          type: MessageEvent.ATTRIBUTE_CHANGE,
          attribute: "theme",
          value: "dark",
        },
      });

      // Should not be called after unwatch
      expect(handler).not.toHaveBeenCalled();
    });

    it("should provide [new, old] tuple format", () => {
      const handler = mock(() => {});
      sdk.watch(["theme"], handler);

      // First change
      (sdk as any)._handleMessage({
        origin: (sdk as any)._parentOrigin,
        data: {
          type: MessageEvent.ATTRIBUTE_CHANGE,
          attribute: "theme",
          value: "dark",
        },
      });

      expect(handler).toHaveBeenCalledTimes(1);
      let changes = handler.mock.calls[0][0];
      expect(changes.theme[0]).toBe("dark");
      expect(changes.theme[1]).toBe("light");

      // Second change
      (sdk as any)._handleMessage({
        origin: (sdk as any)._parentOrigin,
        data: {
          type: MessageEvent.ATTRIBUTE_CHANGE,
          attribute: "theme",
          value: "blue",
        },
      });

      expect(handler).toHaveBeenCalledTimes(2);
      changes = handler.mock.calls[1][0];
      expect(changes.theme[0]).toBe("blue");
      expect(changes.theme[1]).toBe("dark");
    });

    it("should support multiple watchers on same property", () => {
      const handler1 = mock(() => {});
      const handler2 = mock(() => {});

      sdk.watch(["theme"], handler1);
      sdk.watch(["theme"], handler2);

      (sdk as any)._handleMessage({
        origin: (sdk as any)._parentOrigin,
        data: {
          type: MessageEvent.ATTRIBUTE_CHANGE,
          attribute: "theme",
          value: "dark",
        },
      });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("should handle errors in watch handlers gracefully", () => {
      const errorHandler = mock(() => {
        throw new Error("Handler error");
      });
      const normalHandler = mock(() => {});

      sdk.watch(errorHandler);
      sdk.watch(normalHandler);

      // Should not throw
      expect(() => {
        (sdk as any)._handleMessage({
          origin: (sdk as any)._parentOrigin,
          data: {
            type: MessageEvent.ATTRIBUTE_CHANGE,
            attribute: "theme",
            value: "dark",
          },
        });
      }).not.toThrow();

      // Both handlers should be called despite error
      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(normalHandler).toHaveBeenCalledTimes(1);
    });

    it("should notify watchers when props change", () => {
      const handler = mock(() => {});
      sdk.watch(["theme"], handler);

      (sdk as any)._handleMessage({
        origin: (sdk as any)._parentOrigin,
        data: {
          type: MessageEvent.ATTRIBUTE_CHANGE,
          attribute: "theme",
          value: "dark",
        },
      });

      expect(handler).toHaveBeenCalledTimes(1);
      const changes = handler.mock.calls[0][0];
      expect(changes.theme).toBeDefined();
      expect(changes.theme[0]).toBe("dark");
    });

    it("should clean up watchers on cleanup", () => {
      const handler = mock(() => {});
      sdk.watch(handler);

      sdk.cleanup();

      expect((sdk as any)._watchHandlers.size).toBe(0);
      expect((sdk as any)._propOldValues.size).toBe(0);
    });

    it("should return dispose function from on()", () => {
      const handler = mock(() => {});
      const dispose = sdk.on("test-event", handler);

      expect(typeof dispose).toBe("function");

      // Call dispose
      dispose();

      // Trigger event
      (sdk as any)._handleMessage({
        origin: (sdk as any)._parentOrigin,
        data: {
          type: MessageEvent.EVENT,
          name: "test-event",
          data: { value: 42 },
        },
      });

      // Should not be called after dispose
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
