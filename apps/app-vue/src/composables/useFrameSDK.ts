import { frameSDK } from '@micro-fe/fragment-elements/sdk';
import { reactive, onMounted, onUnmounted, ref } from 'vue';

export function useFrameSDK() {
  const props = reactive<any>({});
  const isReady = ref(false);

  onMounted(async () => {
    await frameSDK.initialize();
    Object.assign(props, frameSDK.props);
    isReady.value = true;
  });

  onUnmounted(() => {
    frameSDK.cleanup();
  });

  const emit = (event: string, data?: any) => {
    frameSDK.emit(event, data);
  };

  const onAttr = (attrName: string, handler: (value: any) => void) => {
    frameSDK.on(`attr:${attrName}`, (value) => {
      props[attrName] = value;
      handler(value);
    });
  };

  return { props, isReady, emit, onAttr };
}
