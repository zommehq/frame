import { microAppSDK } from '@shared/sdk';
import { createApp } from 'vue';

import App from './App.vue';
import { createAppRouter } from './router';

async function bootstrap() {
  await microAppSDK.initialize();

  const config = microAppSDK.getConfig();
  const base = config.base || '/vue/';

  const router = createAppRouter(base);

  router.afterEach((to) => {
    const path = to.fullPath.replace(base, '/');
    microAppSDK.navigate(path, false, to.meta);
  });

  microAppSDK.on('route-change', (data) => {
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
  microAppSDK.reportError(error);
});
