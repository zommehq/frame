import { bootstrapApplication } from "@angular/platform-browser";
import { Router } from "@angular/router";
import { frameSDK, setupRouterSync } from "@zomme/fragment-frame-angular";

import { AppComponent } from "./app/app.component";
import { appConfig } from "./app/app.config";

async function bootstrap() {
  const appRef = await bootstrapApplication(AppComponent, appConfig);
  const router = appRef.injector.get(Router);

  let base = "/angular/";
  let sdkAvailable = false;

  try {
    await frameSDK.initialize();
    base = (frameSDK.props.base as string) || "/angular/";
    sdkAvailable = true;

    // Setup bidirectional router sync with parent shell
    void setupRouterSync(router, base);

    // Report any uncaught errors to parent
    window.addEventListener("error", (event) => {
      frameSDK.emit("error", {
        error: event.error?.message || String(event.error),
        source: "window.error",
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      frameSDK.emit("error", {
        error:
          event.reason instanceof Error
            ? event.reason.message
            : String(event.reason),
        source: "unhandledrejection",
      });
    });

    console.log("FrameSDK initialized successfully");
  } catch (error) {
    console.warn("FrameSDK not available, running in standalone mode:", error);
    sdkAvailable = false;
  }

  console.log(
    `Angular app rendered with base: ${base} (SDK available: ${sdkAvailable})`
  );
}

bootstrap();
