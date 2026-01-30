<script setup lang="ts">
import "@zomme/frame";
import { onMounted, onUnmounted, ref, watch } from "vue";

interface Props {
  /** URL to load in the iframe */
  src: string;

  /** Sandbox permissions for the iframe */
  sandbox?: string;

  /** Additional props to pass to the frame */
  [key: string]: unknown;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  error: [event: CustomEvent];
  navigate: [event: CustomEvent];
  ready: [event: CustomEvent];
}>();

const elementRef = ref<HTMLElement>();
const eventListeners: [string, EventListener][] = [];

const syncPropsToElement = () => {
  const element = elementRef.value;
  if (!element) return;

  Object.entries(props).forEach(([key, value]) => {
    // Skip src/sandbox (handled by template) and event handlers
    if (!["src", "sandbox"].includes(key) && !key.startsWith("on")) {
      (element as any)[key] = value;
    }
  });
};

onMounted(() => {
  const element = elementRef.value;
  if (!element) return;

  syncPropsToElement();

  const addListener = (eventName: string, emitName: string) => {
    const handler = (event: Event) => emit(emitName as any, event as CustomEvent);
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

  eventListeners.forEach(([event, handler]) => {
    element.removeEventListener(event, handler);
  });
  eventListeners.length = 0;
});

watch(() => props, syncPropsToElement, { deep: true });

defineExpose({ elementRef });
</script>

<template>
  <z-frame
    ref="elementRef"
    :sandbox="props.sandbox ?? 'allow-scripts allow-same-origin'"
    :src="props.src"
  />
</template>
