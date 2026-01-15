import { frameSDK } from '@micro-fe/fragment-elements/sdk';
import { useEffect, useState, useCallback } from 'react';

export function useFrameSDK() {
  const [props, setProps] = useState<any>(frameSDK.props || {});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    frameSDK.initialize().then(() => {
      setProps(frameSDK.props);
      setIsReady(true);
    }).catch((error) => {
      frameSDK.emit('error', { error });
    });

    return () => frameSDK.cleanup();
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    frameSDK.emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: (data: any) => void) => {
    frameSDK.on(event, handler);
    return () => frameSDK.off(event, handler);
  }, []);

  return { props, isReady, emit, on };
}
