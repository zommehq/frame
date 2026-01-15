import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { MessageEvent } from '../src/constants';
import { FrameSDK } from '../src/sdk';
import type { InitMessage } from '../src/types';

describe('FrameSDK', () => {
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

  describe('initialization', () => {
    it('should wait for INIT message', async () => {
      const initPromise = sdk.initialize();

      // Simulate INIT message
      setTimeout(() => {
        const initMessage: InitMessage = {
          type: MessageEvent.INIT,
          payload: {
            name: 'test-app',
            base: '/test-app',
            apiUrl: 'https://api.test.com',
          },
        };

        window.dispatchEvent(
          new MessageEvent('message', {
            data: initMessage,
            origin: 'http://localhost:4200',
          } as any)
        );
      }, 10);

      await initPromise;

      expect(sdk.props).toBeDefined();
      expect(sdk.props.name).toBe('test-app');
      expect(sdk.props.base).toBe('/test-app');
      expect(sdk.props.apiUrl).toBe('https://api.test.com');
    });

    it('should send READY message after initialization', async () => {
      const initPromise = sdk.initialize();

      setTimeout(() => {
        const initMessage: InitMessage = {
          type: MessageEvent.INIT,
          payload: {
            name: 'test-app',
            base: '/test-app',
          },
        };

        window.dispatchEvent(
          new MessageEvent('message', {
            data: initMessage,
            origin: 'http://localhost:4200',
          } as any)
        );
      }, 10);

      await initPromise;

      const postMessageMock = window.parent.postMessage as any;
      expect(postMessageMock).toHaveBeenCalled();

      const calls = postMessageMock.mock.calls;
      const readyCall = calls.find((call: any) => call[0].type === MessageEvent.READY);
      expect(readyCall).toBeDefined();
    });

    it('should deserialize functions in props', async () => {
      const initPromise = sdk.initialize();

      setTimeout(() => {
        const initMessage: InitMessage = {
          type: MessageEvent.INIT,
          payload: {
            name: 'test-app',
            base: '/test-app',
            onSuccess: {
              __fn: 'test-fn-id',
              __meta: { name: 'onSuccess' },
            } as any,
          },
        };

        window.dispatchEvent(
          new MessageEvent('message', {
            data: initMessage,
            origin: 'http://localhost:4200',
          } as any)
        );
      }, 10);

      await initPromise;

      expect(typeof sdk.props.onSuccess).toBe('function');
    });
  });

  describe('emit', () => {
    beforeEach(async () => {
      const initPromise = sdk.initialize();

      setTimeout(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: MessageEvent.INIT,
              payload: { name: 'test', base: '/test' },
            },
            origin: 'http://localhost:4200',
          } as any)
        );
      }, 10);

      await initPromise;
    });

    it('should emit custom event to parent', () => {
      sdk.emit('user-action', { type: 'click', id: 123 });

      const postMessageMock = window.parent.postMessage as any;
      const calls = postMessageMock.mock.calls;
      const emitCall = calls.find(
        (call: any) => call[0].type === MessageEvent.CUSTOM_EVENT
      );

      expect(emitCall).toBeDefined();
      expect(emitCall[0].payload.name).toBe('user-action');
      expect(emitCall[0].payload.data).toEqual({ type: 'click', id: 123 });
    });

    it('should emit event without data', () => {
      sdk.emit('data-loaded');

      const postMessageMock = window.parent.postMessage as any;
      const calls = postMessageMock.mock.calls;
      const emitCall = calls.find(
        (call: any) => call[0].type === MessageEvent.CUSTOM_EVENT
      );

      expect(emitCall).toBeDefined();
      expect(emitCall[0].payload.name).toBe('data-loaded');
    });

    it('should serialize functions in event data', () => {
      const callback = () => 'test';
      sdk.emit('action', { callback });

      const postMessageMock = window.parent.postMessage as any;
      const calls = postMessageMock.mock.calls;
      const emitCall = calls.find(
        (call: any) => call[0].type === MessageEvent.CUSTOM_EVENT
      );

      expect(emitCall[0].payload.data.callback).toHaveProperty('__fn');
    });

    it('should send transferables', () => {
      const buffer = new ArrayBuffer(8);
      sdk.emit('data', { buffer });

      const postMessageMock = window.parent.postMessage as any;
      const calls = postMessageMock.mock.calls;
      const emitCall = calls.find(
        (call: any) => call[0].type === MessageEvent.CUSTOM_EVENT
      );

      expect(emitCall[2]).toContain(buffer);
    });
  });

  describe('event listeners', () => {
    beforeEach(async () => {
      const initPromise = sdk.initialize();

      setTimeout(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: MessageEvent.INIT,
              payload: { name: 'test', base: '/test' },
            },
            origin: 'http://localhost:4200',
          } as any)
        );
      }, 10);

      await initPromise;
    });

    it('should register event listener', () => {
      const handler = mock(() => {});
      sdk.on('test-event', handler);

      expect((sdk as any).eventListeners.has('test-event')).toBe(true);
      expect((sdk as any).eventListeners.get('test-event').has(handler)).toBe(true);
    });

    it('should remove event listener', () => {
      const handler = mock(() => {});
      sdk.on('test-event', handler);
      sdk.off('test-event', handler);

      expect((sdk as any).eventListeners.get('test-event')?.has(handler)).toBe(false);
    });

    it('should call listener when event received', () => {
      const handler = mock(() => {});
      sdk.on('custom-event', handler);

      (sdk as any).handleMessage({
        origin: (sdk as any).parentOrigin,
        data: {
          type: MessageEvent.EVENT,
          name: 'custom-event',
          data: { value: 42 },
        },
      });

      expect(handler).toHaveBeenCalledWith({ value: 42 });
    });

    it('should support attribute change events', () => {
      const handler = mock(() => {});
      sdk.on('attr:theme', handler);

      (sdk as any).handleMessage({
        origin: (sdk as any).parentOrigin,
        data: {
          type: MessageEvent.ATTRIBUTE_CHANGE,
          attribute: 'theme',
          value: 'dark',
        },
      });

      expect(handler).toHaveBeenCalledWith('dark');
    });
  });

  describe('message handling', () => {
    beforeEach(async () => {
      const initPromise = sdk.initialize();

      setTimeout(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: MessageEvent.INIT,
              payload: { name: 'test', base: '/test' },
            },
            origin: 'http://localhost:4200',
          } as any)
        );
      }, 10);

      await initPromise;
    });

    it('should ignore messages from wrong origin', () => {
      const handler = mock(() => {});
      sdk.on('test-event', handler);

      (sdk as any).handleMessage({
        origin: 'http://evil.com',
        data: {
          type: MessageEvent.EVENT,
          name: 'test-event',
          data: {},
        },
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle ATTRIBUTE_CHANGE message', () => {
      (sdk as any).handleMessage({
        origin: (sdk as any).parentOrigin,
        data: {
          type: MessageEvent.ATTRIBUTE_CHANGE,
          attribute: 'theme',
          value: 'dark',
        },
      });

      expect(sdk.props.theme).toBe('dark');
    });

    it('should handle FUNCTION_RELEASE message', () => {
      const fnId = 'test-fn-id';
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

  describe('function calls', () => {
    beforeEach(async () => {
      const initPromise = sdk.initialize();

      setTimeout(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: MessageEvent.INIT,
              payload: { name: 'test', base: '/test' },
            },
            origin: 'http://localhost:4200',
          } as any)
        );
      }, 10);

      await initPromise;
    });

    it('should handle function call from parent', async () => {
      const testFn = mock(() => 'result');
      const fnId = 'test-fn-id';
      (sdk as any).functionRegistry.set(fnId, testFn);

      await (sdk as any).handleFunctionCall('call-1', fnId, [1, 2, 3]);

      expect(testFn).toHaveBeenCalledWith(1, 2, 3);
    });

    it('should handle function call error', async () => {
      const testFn = mock(() => {
        throw new Error('Test error');
      });
      const fnId = 'test-fn-id';
      (sdk as any).functionRegistry.set(fnId, testFn);

      await (sdk as any).handleFunctionCall('call-1', fnId, []);

      const postMessageMock = window.parent.postMessage as any;
      const calls = postMessageMock.mock.calls;
      const responseCall = calls.find(
        (call: any) => call[0].type === MessageEvent.FUNCTION_RESPONSE
      );

      expect(responseCall[0].success).toBe(false);
      expect(responseCall[0].error).toBe('Test error');
    });

    it('should handle function response success', () => {
      const callId = 'test-call-id';
      const resolver = {
        resolve: mock(() => {}),
        reject: mock(() => {}),
        timeout: setTimeout(() => {}, 1000),
      };
      (sdk as any).pendingFunctionCalls.set(callId, resolver);

      (sdk as any).handleFunctionResponse(callId, true, { data: 'result' }, undefined);

      expect(resolver.resolve).toHaveBeenCalledWith({ data: 'result' });
      expect(resolver.reject).not.toHaveBeenCalled();
    });

    it('should handle function response error', () => {
      const callId = 'test-call-id';
      const resolver = {
        resolve: mock(() => {}),
        reject: mock(() => {}),
        timeout: setTimeout(() => {}, 1000),
      };
      (sdk as any).pendingFunctionCalls.set(callId, resolver);

      (sdk as any).handleFunctionResponse(callId, false, undefined, 'Test error');

      expect(resolver.reject).toHaveBeenCalled();
      expect(resolver.resolve).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should release functions on beforeunload', async () => {
      const initPromise = sdk.initialize();

      setTimeout(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: MessageEvent.INIT,
              payload: { name: 'test', base: '/test' },
            },
            origin: 'http://localhost:4200',
          } as any)
        );
      }, 10);

      await initPromise;

      const fnId = 'test-fn-id';
      (sdk as any).trackedFunctions.add(fnId);

      window.dispatchEvent(new Event('beforeunload'));

      const postMessageMock = window.parent.postMessage as any;
      const calls = postMessageMock.mock.calls;
      const releaseCall = calls.find(
        (call: any) =>
          call[0].type === MessageEvent.FUNCTION_RELEASE && call[0].fnId === fnId
      );

      expect(releaseCall).toBeDefined();
    });
  });

  describe('sendToParent', () => {
    beforeEach(async () => {
      const initPromise = sdk.initialize();

      setTimeout(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: MessageEvent.INIT,
              payload: { name: 'test', base: '/test' },
            },
            origin: 'http://localhost:4200',
          } as any)
        );
      }, 10);

      await initPromise;
    });

    it('should send message without transferables', () => {
      const message = { type: 'TEST', data: 'hello' };
      (sdk as any).sendToParent(message);

      const postMessageMock = window.parent.postMessage as any;
      expect(postMessageMock).toHaveBeenCalledWith(
        message,
        (sdk as any).parentOrigin
      );
    });

    it('should send message with transferables', () => {
      const message = { type: 'TEST', data: 'hello' };
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
});
