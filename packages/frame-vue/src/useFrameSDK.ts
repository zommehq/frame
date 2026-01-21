import { frameSDK } from "@zomme/frame/sdk";
import type { PropChanges } from "@zomme/frame/types";
import { onMounted, type Ref, shallowRef, triggerRef } from "vue";

// Global singleton state - shared across all useFrameSDK calls
let propsRef: Ref<Record<string, unknown>> | null = null;
let setupComplete = false;

function getPropsRef(): Ref<Record<string, unknown>> {
  if (!propsRef) {
    // Use shallowRef for better performance with objects
    propsRef = shallowRef({ ...frameSDK.props } as Record<string, unknown>);
  }
  return propsRef;
}

function setupGlobalPropSync() {
  if (setupComplete) return;
  setupComplete = true;

  const props = getPropsRef();

  // Watch for all prop changes from SDK and update the ref
  frameSDK.watch(() => {
    // Create a new object reference to trigger Vue reactivity
    props.value = { ...frameSDK.props } as Record<string, unknown>;
    // Force trigger reactivity (belt and suspenders)
    triggerRef(props);
  });
}

interface UseFrameSDKReturn<T = Record<string, unknown>> {
  emit: (event: string, data?: unknown) => void;
  isReady: Ref<boolean>;
  on: (event: string, handler: (data: unknown) => void) => () => void;
  props: Ref<T>;
  sdkAvailable: Ref<boolean>;
  watch: (handler: (changes: PropChanges<T>) => void) => () => void;
  watchProps: <K extends keyof T>(
    propNames: K[],
    handler: (changes: PropChanges<T, K>) => void,
  ) => () => void;
}

/**
 * Vue composable for using the Frame SDK
 *
 * @template T - Type of props from parent
 * @returns SDK utilities and reactive state
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useFrameSDK } from '@zomme/frame-vue';
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
  // Check if SDK was already initialized (e.g., in main.ts)
  const alreadyInitialized = frameSDK.isInitialized;

  // Use the global props ref
  const props = getPropsRef() as Ref<T>;

  const isReady = shallowRef(alreadyInitialized);
  const sdkAvailable = shallowRef(alreadyInitialized);

  if (alreadyInitialized) {
    // SDK already initialized, setup global sync if not done
    setupGlobalPropSync();
  }

  onMounted(async () => {
    // Skip if already initialized
    if (alreadyInitialized) {
      return;
    }

    try {
      await frameSDK.initialize();
      // Update props after initialization
      props.value = { ...frameSDK.props } as T;
      setupGlobalPropSync();
      isReady.value = true;
      sdkAvailable.value = true;
    } catch (error) {
      console.warn("FrameSDK not available, running in standalone mode", error);
      isReady.value = true;
      sdkAvailable.value = false;
    }
  });

  const emit = (event: string, data?: unknown) => {
    if (sdkAvailable.value) {
      frameSDK.emit(event, data);
    } else {
      console.warn(`[Standalone] Event emitted: ${event}`, data);
    }
  };

  const on = (event: string, handler: (data: unknown) => void) => {
    return frameSDK.on(event, handler);
  };

  /**
   * Watch for property changes with modern API
   */
  const watch = (handler: (changes: PropChanges<T>) => void): (() => void) => {
    return frameSDK.watch(handler as any);
  };

  /**
   * Watch for specific property changes with modern API
   */
  const watchProps = <K extends keyof T>(
    propNames: K[],
    handler: (changes: PropChanges<T, K>) => void,
  ): (() => void) => {
    return frameSDK.watch(propNames as string[], handler as any);
  };

  return { emit, isReady, on, props, sdkAvailable, watch, watchProps };
}
