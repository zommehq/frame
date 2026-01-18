<script setup lang="ts">
import "@zomme/frame";
import { onMounted, onUnmounted, ref, watch } from "vue";

interface Props {
  /** Name of the frame (used for identification) */
  name: string;

  /** URL to load in the iframe */
  src: string;

  /** Sandbox permissions for the iframe */
  sandbox?: string;

  /** Props to pass to the child frame (any complex objects) */
  [key: string]: unknown;
}

const props = withDefaults(defineProps<Props>(), {
  sandbox: "allow-scripts allow-same-origin",
});

const emit = defineEmits<{
  ready: [event: CustomEvent];
  navigate: [event: CustomEvent];
  error: [event: CustomEvent];
  [key: string]: [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement>();
const eventListeners: Array<[string, EventListener]> = [];

onMounted(() => {
  const element = elementRef.value;
  if (!element) return;

  // Set props as properties on the custom element
  Object.entries(props).forEach(([key, value]) => {
    if (!["name", "src", "sandbox"].includes(key)) {
      (element as any)[key] = value;
    }
  });

  // Setup event listeners
  const addListener = (eventName: string, emitName: string) => {
    const handler = (event: Event) => emit(emitName, event as CustomEvent);
    element.addEventListener(eventName, handler);
    eventListeners.push([eventName, handler]);
  };

  addListener("ready", "ready");
  addListener("navigate", "navigate");
  addListener("error", "error");
});

onUnmounted(() => {
  const element = elementRef.value;
  if (!element) return;

  // Clean up all event listeners
  eventListeners.forEach(([event, handler]) => {
    element.removeEventListener(event, handler);
  });
  eventListeners.length = 0;
});

// Watch for prop changes and update element properties
watch(
  () => props,
  (newProps) => {
    const element = elementRef.value;
    if (!element) return;

    Object.entries(newProps).forEach(([key, value]) => {
      if (!["name", "src", "sandbox"].includes(key)) {
        (element as any)[key] = value;
      }
    });
  },
  { deep: true },
);
</script>

<template>
  <z-frame
    ref="elementRef"
    :name="name"
    :src="src"
    :sandbox="sandbox"
  />
</template>
