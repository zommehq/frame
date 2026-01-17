import { frameSDK } from "@zomme/fragment-frame-vue";
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

    frameSDK.on("route-change", (data) => {
      const payload = data as { path: string; replace?: boolean };
      const fullPath = base + payload.path.replace(/^\//, "");

      if (payload.replace) {
        router.replace(fullPath);
      } else {
        router.push(fullPath);
      }
    });

    sdkAvailable = true;
  } catch (error) {
    console.warn("FrameSDK not available, running in standalone mode:", error);
    sdkAvailable = false;
  }

  const router = createAppRouter(base);

  if (sdkAvailable) {
    let isInitialNavigation = true;

    router.afterEach((to) => {
      // Skip emitting event for initial navigation
      if (isInitialNavigation) {
        isInitialNavigation = false;
        return;
      }

      const path = to.fullPath.replace(base, "/");
      frameSDK.emit("navigate", { path, replace: false, state: to.meta });
    });
  }

  const app = createApp(App);
  app.use(router);
  app.mount("#app");
}

bootstrap().catch((error) => {
  console.error("Failed to bootstrap Vue app:", error);
});
