import { type ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideFrameSDK } from "@zomme/fragment-frame-angular";
import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFrameSDK({
      routerSync: true,
      onStandalone: () => {
        console.warn("[app-angular] Running in standalone mode (no parent shell)");
      },
    }),
  ],
};
