import { frameSDK } from "@zomme/frame-vue";
import { createApp } from "vue";

import App from "./App.vue";
import { createAppRouter } from "./router";

async function bootstrap() {
  let base = "/vue";
  let sdkAvailable = false;

  try {
    await frameSDK.initialize();
    base = frameSDK.props.base || "/vue";
    sdkAvailable = true;
  } catch (error) {
    console.warn("FrameSDK not available, running in standalone mode:", error);
    sdkAvailable = false;
  }

  const router = createAppRouter(base);

  if (sdkAvailable) {
    // Listen to route-change events from parent shell
    frameSDK.on("route-change", (data: { path: string; replace?: boolean }) => {
      const payload = data as { path: string; replace?: boolean };
      const path = payload.path.startsWith("/") ? payload.path : `/${payload.path}`;

      if (payload.replace) {
        router.replace(path);
      } else {
        router.push(path);
      }
    });

    // Emit navigation events to parent when route changes
    let isInitialNavigation = true;

    router.afterEach((to) => {
      // Skip emitting event for initial navigation
      if (isInitialNavigation) {
        isInitialNavigation = false;
        return;
      }

      // to.path is relative to the base, no need to strip base
      frameSDK.emit("navigate", { path: to.path, replace: false, state: to.meta });
    });
  }

  const app = createApp(App);
  app.use(router);
  app.mount("#app");
}

bootstrap().catch((error) => {
  console.error("Failed to bootstrap Vue app:", error);
});
