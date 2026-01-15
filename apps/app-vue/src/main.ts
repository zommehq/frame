import { frameSDK } from '@micro-fe/fragment-elements/sdk';
import { createApp } from 'vue';

import App from './App.vue';
import { createAppRouter } from './router';

async function bootstrap() {
  await frameSDK.initialize();

  const base = frameSDK.props.base || '/vue/';

  const router = createAppRouter(base);

  router.afterEach((to) => {
    const path = to.fullPath.replace(base, '/');
    frameSDK.emit('navigate', { path, replace: false, state: to.meta });
  });

  frameSDK.on('route-change', (data) => {
    const payload = data as { path: string; replace?: boolean; state?: unknown };
    const fullPath = base + payload.path.replace(/^\//, '');

    if (payload.replace) {
      router.replace({ path: fullPath, state: payload.state });
    } else {
      router.push({ path: fullPath, state: payload.state });
    }
  });

  const app = createApp(App);
  app.use(router);
  app.mount('#app');
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap Vue fragment-frame:', error);
  frameSDK.emit('error', {
    error: error instanceof Error ? error.message : String(error),
    source: 'bootstrap'
  });
});
