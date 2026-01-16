import { onMounted, onUnmounted, reactive, ref, type Ref } from "vue";
import type { PropChanges } from "@zomme/fragment-frame";
import { frameSDK } from "@zomme/fragment-frame/sdk";

interface UseFrameSDKReturn<T = Record<string, unknown>> {
  emit: (event: string, data?: unknown) => void;
  isReady: Ref<boolean>;
  on: (event: string, handler: (data: unknown) => void) => () => void;
  props: T;
  sdkAvailable: Ref<boolean>;
  watch: (handler: (changes: PropChanges<T>) => void) => () => void;
  watchProps: <K extends keyof T>(
    propNames: K[],
    handler: (changes: PropChanges<T, K>) => void
  ) => () => void;
}

/**
 * Vue composable for using the Fragment Frame SDK
 *
 * @template T - Type of props from parent
 * @returns SDK utilities and reactive state
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useFrameSDK } from '@zomme/fragment-frame-vue';
 *
 * interface Props {
 *   user: { name: string };
 * }
 *
 * const { props, emit, on, isReady } = useFrameSDK<Props>();
 *
 * on('route-change', (data) => {
 *   console.log('Route changed:', data);
 * });
 * </script>
 *
 * <template>
 *   <div>User: {{ props.user?.name }}</div>
 * </template>
 * ```
 */
export function useFrameSDK<T = Record<string, unknown>>(): UseFrameSDKReturn<T> {
  const props = reactive<Record<string, unknown>>({}) as T;
  const isReady = ref(false);
  const sdkAvailable = ref(false);

  onMounted(async () => {
    try {
      await frameSDK.initialize();
      Object.assign(props as Record<string, unknown>, frameSDK.props);
      isReady.value = true;
      sdkAvailable.value = true;
    } catch (error) {
      console.warn("FrameSDK not available, running in standalone mode", error);
      isReady.value = true;
      sdkAvailable.value = false;
    }
  });

  onUnmounted(() => {
    if (sdkAvailable.value) {
      frameSDK.cleanup();
    }
  });

  const emit = (event: string, data?: unknown) => {
    if (sdkAvailable.value) {
      frameSDK.emit(event, data);
    } else {
      console.log(`[Standalone] Event emitted: ${event}`, data);
    }
  };

  const on = (event: string, handler: (data: unknown) => void) => {
    return frameSDK.on(event, handler);
  };

  /**
   * Watch for property changes with modern API
   *
   * @param handler - Callback receiving all property changes
   * @returns Cleanup function to unwatch
   *
   * @example
   * ```vue
   * <script setup>
   * const { watch } = useFrameSDK();
   *
   * onMounted(() => {
   *   const unwatch = watch((changes) => {
   *     Object.entries(changes).forEach(([prop, [newVal, oldVal]]) => {
   *       console.log(`${prop} changed from ${oldVal} to ${newVal}`);
   *     });
   *   });
   *   onUnmounted(unwatch);
   * });
   * </script>
   * ```
   */
  const watch = (handler: (changes: PropChanges<T>) => void): (() => void) => {
    const wrappedHandler = (changes: PropChanges<T>) => {
      // Update reactive props with new values
      Object.entries(changes).forEach(([key, tuple]) => {
        const value = tuple as any;
        if (value) {
          (props as Record<string, unknown>)[key] = value[0];
        }
      });
      handler(changes);
    };

    return frameSDK.watch(wrappedHandler as any);
  };

  /**
   * Watch for specific property changes with modern API
   *
   * @param propNames - Array of property names to watch
   * @param handler - Callback receiving specified property changes
   * @returns Cleanup function to unwatch
   *
   * @example
   * ```vue
   * <script setup>
   * const { watchProps } = useFrameSDK();
   *
   * onMounted(() => {
   *   const unwatch = watchProps(['theme', 'user'], (changes) => {
   *     if ('theme' in changes) {
   *       const [newTheme, oldTheme] = changes.theme;
   *       applyTheme(newTheme);
   *     }
   *   });
   *   onUnmounted(unwatch);
   * });
   * </script>
   * ```
   */
  const watchProps = <K extends keyof T>(
    propNames: K[],
    handler: (changes: PropChanges<T, K>) => void
  ): (() => void) => {
    const wrappedHandler = (changes: PropChanges<T, K>) => {
      // Update reactive props with new values
      Object.entries(changes).forEach(([key, tuple]) => {
        const value = tuple as any;
        if (value) {
          (props as Record<string, unknown>)[key] = value[0];
        }
      });
      handler(changes);
    };

    return frameSDK.watch(propNames as string[], wrappedHandler as any);
  };

  return { emit, isReady, on, props, sdkAvailable, watch, watchProps };
}
