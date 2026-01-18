import { type ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideFrameSDK } from "@zomme/frame-angular";
import { routes } from "./app.routes";
import { FrameActionsService } from "./services/frame-actions.service";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFrameSDK({
      routerSync: true,
      onReady: (injector) => {
        // Register actions that parent can call
        injector.get(FrameActionsService).register();
      },
      onStandalone: () => {
        console.warn("[app-angular] Running in standalone mode (no parent shell)");
      },
    }),
  ],
};
