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
    // Flag to prevent emit loop when navigation comes from parent
    let isSyncingFromParent = false;
    let isInitialNavigation = true;

    // Listen to route-change events from parent shell
    frameSDK.on("route-change", (data) => {
      const payload = data as { path: string; replace?: boolean };
      const path = payload.path.startsWith("/") ? payload.path : `/${payload.path}`;

      // Skip if already on this path
      if (router.currentRoute.value.path === path) {
        return;
      }

      isSyncingFromParent = true;
      const navPromise = payload.replace ? router.replace(path) : router.push(path);
      navPromise.finally(() => {
        setTimeout(() => {
          isSyncingFromParent = false;
        }, 50);
      });
    });

    // Emit navigation events to parent when route changes
    router.afterEach((to) => {
      // Skip emitting event for initial navigation
      if (isInitialNavigation) {
        isInitialNavigation = false;
        return;
      }

      // Skip if navigation was triggered by parent
      if (isSyncingFromParent) {
        return;
      }

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
