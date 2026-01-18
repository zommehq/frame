import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { MessageEvent } from "../src/constants";
import { Frame } from "../src/frame";
import { FrameSDK } from "../src/sdk";

describe("integration: Frame <-> FrameSDK", () => {
  let frame: Frame;
  let sdk: FrameSDK;
  let parentMessages: any[];
  let childMessages: any[];

  beforeEach(() => {
    parentMessages = [];
    childMessages = [];

    // Setup Frame
    frame = new Frame() as any;
    (frame as any)._ready = true;
    (frame as any)._origin = "http://localhost:3000";

    // Mock iframe that captures messages to child
    (frame as any)._iframe = {
      contentWindow: {
        postMessage: (message: any, origin: string, transferables?: Transferable[]) => {
          childMessages.push({ message, origin, transferables });
          // Simulate child receiving message
          if (sdk) {
            (sdk as any).handleMessage({
              origin: "http://localhost:4200",
              data: message,
            });
          }
        },
      },
    };

    // Setup FrameSDK
    sdk = new FrameSDK() as any;
    (sdk as any).parentOrigin = "http://localhost:4200";

    // Mock parent.postMessage that captures messages to parent
    window.parent.postMessage = (message: any, origin: string, transferables?: Transferable[]) => {
      parentMessages.push({ message, origin, transferables });
      // Simulate parent receiving message
      if (frame) {
        (frame as any).handleMessageFromIframe(message);
      }
    };
  });

  afterEach(() => {
    parentMessages = [];
    childMessages = [];
  });

  describe("initialization flow", () => {
    it("should complete initialization handshake", async () => {
      // Parent sends INIT
      const initPromise = sdk.initialize();

      setTimeout(() => {
        (sdk as any).handleMessage({
          origin: "http://localhost:4200",
          data: {
            type: MessageEvent.INIT,
            payload: {
              name: "test-app",
              base: "/test-app",
            },
          },
        });
      }, 10);

      await initPromise;

      // Check child sent READY
      const readyMessage = parentMessages.find((msg) => msg.message.type === MessageEvent.READY);
      expect(readyMessage).toBeDefined();

      // Check SDK has props
      expect(sdk.props).toBeDefined();
      expect(sdk.props.name).toBe("test-app");
    });

    it("should deserialize functions in initial props", async () => {
      const testFn = () => "parent function";
      const fnId = "test-fn-id";
      (frame as any)._functionRegistry.set(fnId, testFn);

      const initPromise = sdk.initialize();

      setTimeout(() => {
        (sdk as any).handleMessage({
          origin: "http://localhost:4200",
          data: {
            type: MessageEvent.INIT,
            payload: {
              name: "test-app",
              base: "/test-app",
              onSuccess: {
                __fn: fnId,
                __meta: { name: "onSuccess" },
              },
            },
          },
        });
      }, 10);

      await initPromise;

      expect(typeof sdk.props.onSuccess).toBe("function");
    });
  });

  describe("bidirectional events", () => {
    beforeEach(async () => {
      const initPromise = sdk.initialize();

      setTimeout(() => {
        (sdk as any).handleMessage({
          origin: "http://localhost:4200",
          data: {
            type: MessageEvent.INIT,
            payload: { name: "test", base: "/test" },
          },
        });
      }, 10);

      await initPromise;
      parentMessages = [];
    });

    it("should emit event from child to parent", () => {
      const parentHandler = mock(() => {});
      frame.addEventListener("user-action", parentHandler);

      sdk.emit("user-action", { type: "click", id: 123 });

      expect(parentHandler).toHaveBeenCalledTimes(1);
      expect(parentHandler.mock.calls[0][0].detail).toEqual({
        type: "click",
        id: 123,
      });
    });

    it("should handle property event handlers", () => {
      const parentHandler = mock(() => {});
      (frame as any).onuseraction = parentHandler;

      sdk.emit("user-action", { type: "click" });

      expect(parentHandler).toHaveBeenCalledTimes(1);
    });

    it("should normalize event names for properties", () => {
      const parentHandler = mock(() => {});
      (frame as any).onstatechange = parentHandler;

      sdk.emit("state:change", { value: 1 });

      expect(parentHandler).toHaveBeenCalledTimes(1);
    });

    it("should use exact name for addEventListener", () => {
      const handler1 = mock(() => {});
      const handler2 = mock(() => {});

      frame.addEventListener("state:change", handler1);
      frame.addEventListener("state-change", handler2);

      sdk.emit("state:change", { value: 1 });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe("bidirectional function calls", () => {
    beforeEach(async () => {
      const initPromise = sdk.initialize();

      setTimeout(() => {
        (sdk as any).handleMessage({
          origin: "http://localhost:4200",
          data: {
            type: MessageEvent.INIT,
            payload: { name: "test", base: "/test" },
          },
        });
      }, 10);

      await initPromise;
      childMessages = [];
      parentMessages = [];
    });

    it("should call parent function from child", async () => {
      const parentFn = mock((data: any) => `Result: ${data.value}`);
      const fnId = "parent-fn-id";
      (frame as any)._functionRegistry.set(fnId, parentFn);

      // Deserialize function in child
      const childProxy = (sdk as any).deserializeValue({
        __fn: fnId,
        __meta: { name: "parentFn" },
      });

      // Call from child
      const promise = childProxy({ value: 42 });

      // Wait for async call to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      const result = await promise;

      expect(parentFn).toHaveBeenCalledWith({ value: 42 });
      expect(result).toBe("Result: 42");
    });

    it("should call child function from parent", async () => {
      const childFn = mock((data: any) => `Child result: ${data.value}`);
      const fnId = "child-fn-id";
      (sdk as any).functionRegistry.set(fnId, childFn);

      // Deserialize function in parent
      const parentProxy = (frame as any).deserializeValue({
        __fn: fnId,
        __meta: { name: "childFn" },
      });

      // Call from parent
      const promise = parentProxy({ value: 99 });

      // Wait for async call to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      const result = await promise;

      expect(childFn).toHaveBeenCalledWith({ value: 99 });
      expect(result).toBe("Child result: 99");
    });

    it("should pass functions as parameters", async () => {
      const parentCallback = mock((result: string) => `Processed: ${result}`);
      const childFn = mock((callback: Function) => {
        return callback("test data");
      });

      const childFnId = "child-fn-id";
      (sdk as any).functionRegistry.set(childFnId, childFn);

      // Parent has proxy to child function
      const parentProxy = (frame as any).deserializeValue({
        __fn: childFnId,
      });

      // Call with callback
      const promise = parentProxy(parentCallback);

      // Wait for async call
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await promise;

      expect(childFn).toHaveBeenCalled();
      expect(parentCallback).toHaveBeenCalledWith("test data");
      expect(result).toBe("Processed: test data");
    });
  });

  describe("transferable objects", () => {
    beforeEach(async () => {
      const initPromise = sdk.initialize();

      setTimeout(() => {
        (sdk as any).handleMessage({
          origin: "http://localhost:4200",
          data: {
            type: MessageEvent.INIT,
            payload: { name: "test", base: "/test" },
          },
        });
      }, 10);

      await initPromise;
      childMessages = [];
      parentMessages = [];
    });

    it("should transfer ArrayBuffer from parent to child", () => {
      const buffer = new ArrayBuffer(1024);

      // Parent sets property with buffer
      (frame as any).imageData = buffer;

      // Check message was sent with transferable
      const message = childMessages[childMessages.length - 1];
      expect(message.transferables).toContain(buffer);
    });

    it("should transfer ArrayBuffer in event data", () => {
      const buffer = new ArrayBuffer(512);

      sdk.emit("data-ready", { buffer });

      // Check message included transferable
      const message = parentMessages[parentMessages.length - 1];
      expect(message.transferables).toContain(buffer);
    });

    it("should transfer multiple buffers", () => {
      const buffer1 = new ArrayBuffer(256);
      const buffer2 = new ArrayBuffer(512);

      sdk.emit("multi-buffer", {
        buf1: buffer1,
        buf2: buffer2,
      });

      const message = parentMessages[parentMessages.length - 1];
      expect(message.transferables).toContain(buffer1);
      expect(message.transferables).toContain(buffer2);
      expect(message.transferables).toHaveLength(2);
    });
  });

  describe("property updates", () => {
    beforeEach(async () => {
      const initPromise = sdk.initialize();

      setTimeout(() => {
        (sdk as any).handleMessage({
          origin: "http://localhost:4200",
          data: {
            type: MessageEvent.INIT,
            payload: { name: "test", base: "/test", theme: "light" },
          },
        });
      }, 10);

      await initPromise;
      childMessages = [];
      parentMessages = [];
    });

    it("should update child props when parent changes attribute", () => {
      expect(sdk.props.theme).toBe("light");

      (sdk as any).handleMessage({
        origin: "http://localhost:4200",
        data: {
          type: MessageEvent.ATTRIBUTE_CHANGE,
          attribute: "theme",
          value: "dark",
        },
      });

      expect(sdk.props.theme).toBe("dark");
    });

    it("should trigger watch handlers on attribute change", () => {
      const handler = mock(() => {});
      sdk.watch(["theme"], handler);

      (sdk as any)._handleMessage({
        origin: "http://localhost:4200",
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

    it("should deserialize functions in attribute updates", () => {
      const parentFn = () => "updated function";
      const fnId = "new-fn-id";
      (frame as any)._functionRegistry.set(fnId, parentFn);

      (sdk as any).handleMessage({
        origin: "http://localhost:4200",
        data: {
          type: MessageEvent.ATTRIBUTE_CHANGE,
          attribute: "onUpdate",
          value: {
            __fn: fnId,
            __meta: { name: "onUpdate" },
          },
        },
      });

      expect(typeof sdk.props.onUpdate).toBe("function");
    });
  });

  describe("cleanup and garbage collection", () => {
    beforeEach(async () => {
      const initPromise = sdk.initialize();

      setTimeout(() => {
        (sdk as any).handleMessage({
          origin: "http://localhost:4200",
          data: {
            type: MessageEvent.INIT,
            payload: { name: "test", base: "/test" },
          },
        });
      }, 10);

      await initPromise;
    });

    it("should release child functions when parent disconnects", () => {
      const fnId = "test-fn-id";
      (frame as any)._functionRegistry.set(fnId, () => {});
      (frame as any)._trackedFunctions.add(fnId);

      (sdk as any).functionRegistry.set(fnId, () => {});
      (sdk as any).trackedFunctions.add(fnId);

      frame.disconnectedCallback();

      // Check parent sent release message
      const releaseMessage = childMessages.find(
        (msg) => msg.message.type === MessageEvent.FUNCTION_RELEASE && msg.message.fnId === fnId,
      );
      expect(releaseMessage).toBeDefined();

      // Check parent cleaned up
      expect((frame as any)._functionRegistry.has(fnId)).toBe(false);
      expect((frame as any)._trackedFunctions.has(fnId)).toBe(false);
    });

    it("should handle function release from parent", () => {
      const fnId = "test-fn-id";
      (sdk as any).functionRegistry.set(fnId, () => {});
      (sdk as any).trackedFunctions.add(fnId);

      (sdk as any).handleMessage({
        origin: "http://localhost:4200",
        data: {
          type: MessageEvent.FUNCTION_RELEASE,
          fnId,
        },
      });

      expect((sdk as any).functionRegistry.has(fnId)).toBe(false);
      expect((sdk as any).trackedFunctions.has(fnId)).toBe(false);
    });
  });

  describe("error handling", () => {
    beforeEach(async () => {
      const initPromise = sdk.initialize();

      setTimeout(() => {
        (sdk as any).handleMessage({
          origin: "http://localhost:4200",
          data: {
            type: MessageEvent.INIT,
            payload: { name: "test", base: "/test" },
          },
        });
      }, 10);

      await initPromise;
      childMessages = [];
      parentMessages = [];
    });

    it("should handle function call errors in parent", async () => {
      const parentFn = mock(() => {
        throw new Error("Parent error");
      });
      const fnId = "parent-fn-id";
      (frame as any)._functionRegistry.set(fnId, parentFn);

      const childProxy = (sdk as any).deserializeValue({ __fn: fnId });

      try {
        await childProxy();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toBe("Parent error");
      }
    });

    it("should handle function call errors in child", async () => {
      const childFn = mock(() => {
        throw new Error("Child error");
      });
      const fnId = "child-fn-id";
      (sdk as any).functionRegistry.set(fnId, childFn);

      const parentProxy = (frame as any).deserializeValue({ __fn: fnId });

      try {
        await parentProxy();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toBe("Child error");
      }
    });

    it("should handle missing function in parent", async () => {
      const childProxy = (sdk as any).deserializeValue({
        __fn: "non-existent-id",
      });

      try {
        await childProxy();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toContain("Function not found");
      }
    });
  });

  describe("register() method integration", () => {
    beforeEach(async () => {
      const initPromise = sdk.initialize();

      setTimeout(() => {
        (sdk as any).handleMessage({
          origin: "http://localhost:4200",
          data: {
            type: MessageEvent.INIT,
            payload: { name: "test", base: "/test" },
          },
        });
      }, 10);

      await initPromise;
      childMessages = [];
      parentMessages = [];
    });

    it("should register functions and parent should receive callable proxies", async () => {
      // Setup parent listener for register event
      const parentHandler = mock(() => {});
      frame.addEventListener("register", parentHandler);

      // Child registers functions
      const refreshFn = mock(() => "refreshed");
      const exportFn = mock(async (format: string) => `exported-${format}`);

      sdk.register({
        refresh: refreshFn,
        export: exportFn,
      });

      // Wait for event to propagate
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify parent received event
      expect(parentHandler).toHaveBeenCalledTimes(1);
      const eventData = parentHandler.mock.calls[0][0].detail;

      // Verify functions are callable (not serialized tokens)
      expect(typeof eventData.refresh).toBe("function");
      expect(typeof eventData.export).toBe("function");

      // Parent calls child functions
      const refreshResult = eventData.refresh();
      const exportResult = await eventData.export("csv");

      // Wait for function calls to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify child functions were called
      expect(refreshFn).toHaveBeenCalledTimes(1);
      expect(exportFn).toHaveBeenCalledWith("csv");

      // Verify results
      expect(await refreshResult).toBe("refreshed");
      expect(exportResult).toBe("exported-csv");
    });

    it("should deserialize functions in CUSTOM_EVENT (bug fix verification)", async () => {
      const parentHandler = mock(() => {});
      frame.addEventListener("custom-event-test", parentHandler);

      const testFn = mock(() => "test result");
      sdk.emit("custom-event-test", {
        action: testFn,
        data: { id: 123 },
      });

      // Wait for event to propagate
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(parentHandler).toHaveBeenCalledTimes(1);
      const eventData = parentHandler.mock.calls[0][0].detail;

      // CRITICAL: Verify function was deserialized, not just a serialized token
      expect(typeof eventData.action).toBe("function");
      expect(eventData.action).not.toHaveProperty("__fn");

      // Verify function is callable
      const result = await eventData.action();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(testFn).toHaveBeenCalledTimes(1);
      expect(await result).toBe("test result");
    });

    it("should handle unregister cleanup", async () => {
      const parentHandler = mock(() => {});
      frame.addEventListener("unregister", parentHandler);

      // Register functions
      const unregister = sdk.register({
        refresh: mock(() => {}),
        export: mock(() => {}),
      });

      // Clear messages
      parentMessages = [];

      // Call unregister
      unregister();

      // Wait for event to propagate
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify unregister event was received
      expect(parentHandler).toHaveBeenCalledTimes(1);
      const eventData = parentHandler.mock.calls[0][0].detail;

      expect(eventData.functions).toContain("refresh");
      expect(eventData.functions).toContain("export");
    });

    it("should register single function with name", async () => {
      const parentHandler = mock(() => {});
      frame.addEventListener("register", parentHandler);

      const pingFn = mock(() => "pong");
      sdk.register("ping", pingFn);

      // Wait for event to propagate
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(parentHandler).toHaveBeenCalledTimes(1);
      const eventData = parentHandler.mock.calls[0][0].detail;

      expect(typeof eventData.ping).toBe("function");

      // Call function
      const result = await eventData.ping();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(pingFn).toHaveBeenCalledTimes(1);
      expect(await result).toBe("pong");
    });

    it("should handle multiple register calls independently", async () => {
      const parentHandler = mock(() => {});
      frame.addEventListener("register", parentHandler);

      // First register
      sdk.register(
        "fn1",
        mock(() => {}),
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Second register
      sdk.register(
        "fn2",
        mock(() => {}),
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify two separate events
      expect(parentHandler).toHaveBeenCalledTimes(2);

      const event1Data = parentHandler.mock.calls[0][0].detail;
      const event2Data = parentHandler.mock.calls[1][0].detail;

      expect(event1Data).toHaveProperty("fn1");
      expect(event1Data).not.toHaveProperty("fn2");

      expect(event2Data).toHaveProperty("fn2");
      expect(event2Data).not.toHaveProperty("fn1");
    });

    it("should pass complex data in registered function calls", async () => {
      const parentHandler = mock(() => {});
      frame.addEventListener("register", parentHandler);

      const saveFn = mock((data: { id: number; name: string; items: string[] }) => {
        return { success: true, savedId: data.id };
      });

      sdk.register("save", saveFn);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const eventData = parentHandler.mock.calls[0][0].detail;

      // Parent calls with complex data
      const result = await eventData.save({
        id: 42,
        name: "Test Item",
        items: ["a", "b", "c"],
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(saveFn).toHaveBeenCalledWith({
        id: 42,
        name: "Test Item",
        items: ["a", "b", "c"],
      });

      expect(await result).toEqual({ success: true, savedId: 42 });
    });
  });
});
