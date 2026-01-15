import { describe, expect, it } from 'bun:test';
import { FragmentFrame } from '../../src/fragment-frame';
import { frameSDK } from '../../src/sdk';

describe('serialization', () => {
  describe('FragmentFrame serialization', () => {
    it('should serialize primitive values', () => {
      const frame = new FragmentFrame() as any;
      const { serialized } = frame.serializeValue('hello');
      expect(serialized).toBe('hello');
    });

    it('should serialize numbers', () => {
      const frame = new FragmentFrame() as any;
      const { serialized } = frame.serializeValue(42);
      expect(serialized).toBe(42);
    });

    it('should serialize booleans', () => {
      const frame = new FragmentFrame() as any;
      const { serialized } = frame.serializeValue(true);
      expect(serialized).toBe(true);
    });

    it('should serialize null and undefined', () => {
      const frame = new FragmentFrame() as any;
      expect(frame.serializeValue(null).serialized).toBe(null);
      expect(frame.serializeValue(undefined).serialized).toBe(undefined);
    });

    it('should serialize plain objects', () => {
      const frame = new FragmentFrame() as any;
      const obj = { name: 'test', count: 42 };
      const { serialized } = frame.serializeValue(obj);
      expect(serialized).toEqual(obj);
    });

    it('should serialize arrays', () => {
      const frame = new FragmentFrame() as any;
      const arr = [1, 2, 'three', { four: 4 }];
      const { serialized } = frame.serializeValue(arr);
      expect(serialized).toEqual(arr);
    });

    it('should serialize functions to SerializedFunction', () => {
      const frame = new FragmentFrame() as any;
      const fn = () => 'test';
      const { serialized } = frame.serializeValue(fn);

      expect(serialized).toHaveProperty('__fn');
      expect(typeof (serialized as any).__fn).toBe('string');
      expect((serialized as any).__fn).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    it('should store serialized function in registry', () => {
      const frame = new FragmentFrame() as any;
      const fn = () => 'test';
      const { serialized } = frame.serializeValue(fn);
      const fnId = (serialized as any).__fn;

      expect(frame._functionRegistry.has(fnId)).toBe(true);
      expect(frame._functionRegistry.get(fnId)).toBe(fn);
    });

    it('should serialize nested objects with functions', () => {
      const frame = new FragmentFrame() as any;
      const obj = {
        callback: () => 'test',
        data: { value: 42 },
      };
      const { serialized } = frame.serializeValue(obj);

      expect((serialized as any).data).toEqual({ value: 42 });
      expect((serialized as any).callback).toHaveProperty('__fn');
    });

    it('should detect and collect transferable objects', () => {
      const frame = new FragmentFrame() as any;
      const buffer = new ArrayBuffer(8);
      const { serialized, transferables } = frame.serializeValue(buffer);

      expect(serialized).toBe(buffer);
      expect(transferables).toContain(buffer);
      expect(transferables).toHaveLength(1);
    });

    it('should collect multiple transferables', () => {
      const frame = new FragmentFrame() as any;
      const buffer1 = new ArrayBuffer(8);
      const buffer2 = new ArrayBuffer(16);
      const obj = {
        buf1: buffer1,
        buf2: buffer2,
        data: 'test',
      };
      const { transferables } = frame.serializeValue(obj);

      expect(transferables).toContain(buffer1);
      expect(transferables).toContain(buffer2);
      expect(transferables).toHaveLength(2);
    });

    it('should detect circular references', () => {
      const frame = new FragmentFrame() as any;
      const obj: any = { name: 'test' };
      obj.self = obj;

      const { serialized } = frame.serializeValue(obj);
      expect((serialized as any).name).toBe('test');
      expect((serialized as any).self).toBe(undefined);
    });

    it('should include function metadata', () => {
      const frame = new FragmentFrame() as any;
      function namedFunction() {}
      const { serialized } = frame.serializeValue(namedFunction);

      expect((serialized as any).__meta).toHaveProperty('name');
      expect((serialized as any).__meta.name).toBe('namedFunction');
    });

    it('should handle anonymous functions', () => {
      const frame = new FragmentFrame() as any;
      const fn = () => {};
      const { serialized } = frame.serializeValue(fn);

      expect((serialized as any).__meta).toHaveProperty('name');
      expect((serialized as any).__meta.name).toBe('anonymous');
    });
  });

  describe('FragmentFrame deserialization', () => {
    it('should deserialize primitive values', () => {
      const frame = new FragmentFrame() as any;
      expect(frame.deserializeValue('hello')).toBe('hello');
      expect(frame.deserializeValue(42)).toBe(42);
      expect(frame.deserializeValue(true)).toBe(true);
      expect(frame.deserializeValue(null)).toBe(null);
      expect(frame.deserializeValue(undefined)).toBe(undefined);
    });

    it('should deserialize plain objects', () => {
      const frame = new FragmentFrame() as any;
      const obj = { name: 'test', count: 42 };
      const result = frame.deserializeValue(obj);
      expect(result).toEqual(obj);
    });

    it('should deserialize arrays', () => {
      const frame = new FragmentFrame() as any;
      const arr = [1, 2, 'three', { four: 4 }];
      const result = frame.deserializeValue(arr);
      expect(result).toEqual(arr);
    });

    it('should deserialize SerializedFunction to proxy function', () => {
      const frame = new FragmentFrame() as any;
      frame._ready = true;
      frame._iframe = {
        contentWindow: {
          postMessage: () => {},
        },
      };
      frame._origin = 'http://localhost:3000';

      const serialized = {
        __fn: 'test-uuid',
        __meta: { name: 'testFn' },
      };

      const result = frame.deserializeValue(serialized);
      expect(typeof result).toBe('function');
    });

    it('should deserialize nested objects with functions', () => {
      const frame = new FragmentFrame() as any;
      frame._ready = true;
      frame._iframe = {
        contentWindow: {
          postMessage: () => {},
        },
      };
      frame._origin = 'http://localhost:3000';

      const serialized = {
        callback: {
          __fn: 'test-uuid',
          __meta: { name: 'callback' },
        },
        data: { value: 42 },
      };

      const result = frame.deserializeValue(serialized) as any;
      expect(result.data).toEqual({ value: 42 });
      expect(typeof result.callback).toBe('function');
    });
  });

  describe('FrameSDK serialization', () => {
    it('should serialize primitive values', () => {
      const sdk = frameSDK as any;
      const { serialized } = sdk.serializeValue('hello');
      expect(serialized).toBe('hello');
    });

    it('should serialize functions to SerializedFunction', () => {
      const sdk = frameSDK as any;
      const fn = () => 'test';
      const { serialized } = sdk.serializeValue(fn);

      expect(serialized).toHaveProperty('__fn');
      expect(typeof (serialized as any).__fn).toBe('string');
    });

    it('should store serialized function in registry', () => {
      const sdk = frameSDK as any;
      const fn = () => 'test';
      const { serialized } = sdk.serializeValue(fn);
      const fnId = (serialized as any).__fn;

      expect(sdk.functionRegistry.has(fnId)).toBe(true);
      expect(sdk.functionRegistry.get(fnId)).toBe(fn);
    });

    it('should detect and collect transferable objects', () => {
      const sdk = frameSDK as any;
      const buffer = new ArrayBuffer(8);
      const { serialized, transferables } = sdk.serializeValue(buffer);

      expect(serialized).toBe(buffer);
      expect(transferables).toContain(buffer);
      expect(transferables).toHaveLength(1);
    });

    it('should detect circular references', () => {
      const sdk = frameSDK as any;
      const obj: any = { name: 'test' };
      obj.self = obj;

      const { serialized } = sdk.serializeValue(obj);
      expect((serialized as any).name).toBe('test');
      expect((serialized as any).self).toBe(undefined);
    });
  });

  describe('FrameSDK deserialization', () => {
    it('should deserialize primitive values', () => {
      const sdk = frameSDK as any;
      expect(sdk.deserializeValue('hello')).toBe('hello');
      expect(sdk.deserializeValue(42)).toBe(42);
      expect(sdk.deserializeValue(true)).toBe(true);
    });

    it('should deserialize SerializedFunction to proxy function', () => {
      const sdk = frameSDK as any;
      sdk.parentOrigin = 'http://localhost:4200';

      const serialized = {
        __fn: 'test-uuid',
        __meta: { name: 'testFn' },
      };

      const result = sdk.deserializeValue(serialized);
      expect(typeof result).toBe('function');
    });
  });

  describe('transferable detection', () => {
    it('should detect ArrayBuffer', () => {
      const frame = new FragmentFrame() as any;
      const buffer = new ArrayBuffer(8);
      expect(frame.isTransferable(buffer)).toBe(true);
    });

    it('should not detect plain objects', () => {
      const frame = new FragmentFrame() as any;
      expect(frame.isTransferable({})).toBe(false);
      expect(frame.isTransferable({ data: 'test' })).toBe(false);
    });

    it('should not detect primitives', () => {
      const frame = new FragmentFrame() as any;
      expect(frame.isTransferable('string')).toBe(false);
      expect(frame.isTransferable(42)).toBe(false);
      expect(frame.isTransferable(true)).toBe(false);
      expect(frame.isTransferable(null)).toBe(false);
      expect(frame.isTransferable(undefined)).toBe(false);
    });
  });
});
