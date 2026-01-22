import { frameSDK, setupRouterSync } from "@zomme/frame-vue";
import { createApp } from "vue";

import App from "./App.vue";
import { createAppRouter } from "./router";

async function bootstrap() {
  let sdkAvailable = false;
  let initialPath = window.location.pathname; // Default for standalone

  try {
    await frameSDK.initialize();
    sdkAvailable = true;
    // Use pathname from props (source of truth when in shell)
    initialPath = frameSDK.props.pathname || window.location.pathname;
  } catch (error) {
    console.warn("FrameSDK not available, running in standalone mode:", error);
    sdkAvailable = false;
    // Keep window.location.pathname for standalone
  }

  // Navigate BEFORE mounting Vue to avoid flash
  if (initialPath !== window.location.pathname) {
    window.history.replaceState(null, "", initialPath);
  }

  const router = createAppRouter();

  // Setup bidirectional route synchronization with parent shell
  if (sdkAvailable) {
    setupRouterSync(router);
  }

  const app = createApp(App);
  app.use(router);
  app.mount("#app");
}

bootstrap().catch((error) => {
  console.error("Failed to bootstrap Vue app:", error);
});
