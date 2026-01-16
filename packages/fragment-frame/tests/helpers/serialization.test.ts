import { describe, expect, it } from "bun:test";
import { deserializeValue, isTransferable, serializeValue } from "../../src/helpers/serialization";

describe("serialization", () => {
  describe("serializeValue", () => {
    it("should serialize primitive values", () => {
      const functionRegistry = new Map();
      const trackedFunctions = new Set<string>();
      const { serialized } = serializeValue("hello", functionRegistry, trackedFunctions);
      expect(serialized).toBe("hello");
    });

    it("should serialize numbers", () => {
      const functionRegistry = new Map();
      const trackedFunctions = new Set<string>();
      const { serialized } = serializeValue(42, functionRegistry, trackedFunctions);
      expect(serialized).toBe(42);
    });

    it("should serialize booleans", () => {
      const functionRegistry = new Map();
      const trackedFunctions = new Set<string>();
      const { serialized } = serializeValue(true, functionRegistry, trackedFunctions);
      expect(serialized).toBe(true);
    });

    it("should serialize null and undefined", () => {
      const functionRegistry = new Map();
      const trackedFunctions = new Set<string>();
      expect(serializeValue(null, functionRegistry, trackedFunctions).serialized).toBe(null);
      expect(serializeValue(undefined, functionRegistry, trackedFunctions).serialized).toBe(
        undefined,
      );
    });

    it("should serialize plain objects", () => {
      const functionRegistry = new Map();
      const trackedFunctions = new Set<string>();
      const obj = { name: "test", count: 42 };
      const { serialized } = serializeValue(obj, functionRegistry, trackedFunctions);
      expect(serialized).toEqual(obj);
    });

    it("should serialize arrays", () => {
      const functionRegistry = new Map();
      const trackedFunctions = new Set<string>();
      const arr = [1, 2, "three", { four: 4 }];
      const { serialized } = serializeValue(arr, functionRegistry, trackedFunctions);
      expect(serialized).toEqual(arr);
    });

    it("should serialize functions to SerializedFunction", () => {
      const functionRegistry = new Map();
      const trackedFunctions = new Set<string>();
      const fn = () => "test";
      const { serialized } = serializeValue(fn, functionRegistry, trackedFunctions);

      expect(serialized).toHaveProperty("__fn");
      expect(typeof (serialized as any).__fn).toBe("string");
      expect((serialized as any).__fn).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it("should store serialized function in registry", () => {
      const functionRegistry = new Map();
      const trackedFunctions = new Set<string>();
      const fn = () => "test";
      const { serialized } = serializeValue(fn, functionRegistry, trackedFunctions);

      const fnId = (serialized as any).__fn;
      expect(functionRegistry.has(fnId)).toBe(true);
      expect(functionRegistry.get(fnId)).toBe(fn);
    });

    it("should track serialized functions", () => {
      const functionRegistry = new Map();
      const trackedFunctions = new Set<string>();
      const fn = () => "test";
      const { serialized } = serializeValue(fn, functionRegistry, trackedFunctions);

      const fnId = (serialized as any).__fn;
      expect(trackedFunctions.has(fnId)).toBe(true);
    });

    it("should serialize nested functions", () => {
      const functionRegistry = new Map();
      const trackedFunctions = new Set<string>();
      const obj = {
        name: "test",
        callback: () => "inner",
      };
      const { serialized } = serializeValue(obj, functionRegistry, trackedFunctions);

      expect((serialized as any).name).toBe("test");
      expect((serialized as any).callback).toHaveProperty("__fn");
      expect(functionRegistry.size).toBe(1);
    });

    it("should detect and collect transferable objects", () => {
      const functionRegistry = new Map();
      const trackedFunctions = new Set<string>();
      const buffer = new ArrayBuffer(8);
      const { serialized, transferables } = serializeValue(
        buffer,
        functionRegistry,
        trackedFunctions,
      );

      expect(transferables.length).toBe(1);
      expect(transferables[0]).toBe(buffer);
      expect(serialized).toBe(buffer);
    });

    it("should handle circular references with flatted", () => {
      const functionRegistry = new Map();
      const trackedFunctions = new Set<string>();
      const obj: any = { name: "test" };
      obj.self = obj;

      const { serialized } = serializeValue(obj, functionRegistry, trackedFunctions);

      // flatted should handle circular references without throwing
      expect(serialized).toBeDefined();
      expect((serialized as any).name).toBe("test");
      // The circular reference should be preserved by flatted
      expect((serialized as any).self).toBe(serialized);
    });

    it("should handle deeply nested circular references", () => {
      const functionRegistry = new Map();
      const trackedFunctions = new Set<string>();
      const parent: any = { name: "parent" };
      const child: any = { name: "child", parent: parent };
      parent.child = child;

      const { serialized } = serializeValue(parent, functionRegistry, trackedFunctions);

      expect(serialized).toBeDefined();
      expect((serialized as any).name).toBe("parent");
      expect((serialized as any).child.name).toBe("child");
      // Circular references should be preserved
      expect((serialized as any).child.parent).toBe(serialized);
    });

    it("should handle deeply nested objects", () => {
      const functionRegistry = new Map();
      const trackedFunctions = new Set<string>();

      // Create deeply nested object (non-circular)
      const obj: any = { value: "deep" };
      let current = obj;
      for (let i = 0; i < 50; i++) {
        current.nested = { value: i };
        current = current.nested;
      }

      const { serialized } = serializeValue(obj, functionRegistry, trackedFunctions);

      expect(serialized).toBeDefined();
      expect((serialized as any).value).toBe("deep");
    });

    it("should throw on excessive function registry size", () => {
      const functionRegistry = new Map();
      const trackedFunctions = new Set<string>();

      // Fill registry to max size (1000)
      for (let i = 0; i < 1000; i++) {
        const id = `fn-${i}`;
        functionRegistry.set(id, () => i);
      }

      const fn = () => "test";
      expect(() => {
        serializeValue(fn, functionRegistry, trackedFunctions);
      }).toThrow("Function registry limit");
    });
  });

  describe("deserializeValue", () => {
    it("should deserialize primitive values", () => {
      const createProxy = (fnId: string) => () => `proxy-${fnId}`;
      expect(deserializeValue("hello", createProxy)).toBe("hello");
      expect(deserializeValue(42, createProxy)).toBe(42);
      expect(deserializeValue(true, createProxy)).toBe(true);
      expect(deserializeValue(null, createProxy)).toBe(null);
      expect(deserializeValue(undefined, createProxy)).toBe(undefined);
    });

    it("should deserialize plain objects", () => {
      const createProxy = (fnId: string) => () => `proxy-${fnId}`;
      const obj = { name: "test", count: 42 };
      expect(deserializeValue(obj, createProxy)).toEqual(obj);
    });

    it("should deserialize arrays", () => {
      const createProxy = (fnId: string) => () => `proxy-${fnId}`;
      const arr = [1, 2, "three", { four: 4 }];
      expect(deserializeValue(arr, createProxy)).toEqual(arr);
    });

    it("should deserialize SerializedFunction to proxy function", () => {
      const createProxy = (fnId: string) => () => `proxy-${fnId}`;
      const serialized = {
        __fn: "test-uuid",
        __meta: { name: "testFn" },
      };

      const result = deserializeValue(serialized, createProxy);

      expect(typeof result).toBe("function");
      expect((result as any)()).toBe("proxy-test-uuid");
    });

    it("should deserialize nested functions", () => {
      const createProxy = (fnId: string) => () => `proxy-${fnId}`;
      const obj = {
        name: "test",
        callback: {
          __fn: "callback-uuid",
          __meta: { name: "callback" },
        },
      };

      const result = deserializeValue(obj, createProxy) as any;

      expect(result.name).toBe("test");
      expect(typeof result.callback).toBe("function");
      expect(result.callback()).toBe("proxy-callback-uuid");
    });
  });

  describe("isTransferable", () => {
    it("should detect ArrayBuffer", () => {
      const buffer = new ArrayBuffer(8);
      expect(isTransferable(buffer)).toBe(true);
    });

    it("should detect MessagePort", () => {
      const channel = new MessageChannel();
      expect(isTransferable(channel.port1)).toBe(true);
      expect(isTransferable(channel.port2)).toBe(true);
    });

    it("should not detect plain objects", () => {
      expect(isTransferable({})).toBe(false);
      expect(isTransferable({ data: "test" })).toBe(false);
    });

    it("should not detect arrays", () => {
      expect(isTransferable([])).toBe(false);
      expect(isTransferable([1, 2, 3])).toBe(false);
    });

    it("should not detect primitives", () => {
      expect(isTransferable("string")).toBe(false);
      expect(isTransferable(42)).toBe(false);
      expect(isTransferable(true)).toBe(false);
      expect(isTransferable(null)).toBe(false);
      expect(isTransferable(undefined)).toBe(false);
    });
  });
});
