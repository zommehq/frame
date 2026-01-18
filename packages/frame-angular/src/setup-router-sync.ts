import { NavigationEnd, type Router } from "@angular/router";
import { frameSDK } from "@zomme/frame/sdk";
import { filter } from "rxjs/operators";

/**
 * Setup automatic router synchronization between Angular Router and parent shell
 *
 * This function handles bidirectional routing:
 * - Listens to 'route-change' events from parent and navigates the Angular router
 * - Emits 'navigate' events to parent when Angular router navigates
 *
 * @param router - Angular Router instance
 * @returns Cleanup function to remove listeners
 *
 * @example
 * ```ts
 * import { bootstrapApplication } from '@angular/platform-browser';
 * import { Router } from '@angular/router';
 * import { frameSDK, setupRouterSync } from '@zomme/frame-angular';
 * import { AppComponent } from './app/app.component';
 * import { appConfig } from './app/app.config';
 *
 * async function bootstrap() {
 *   const appRef = await bootstrapApplication(AppComponent, appConfig);
 *   const router = appRef.injector.get(Router);
 *
 *   try {
 *     await frameSDK.initialize();
 *
 *     // Setup router sync in a single line
 *     const cleanup = setupRouterSync(router);
 *
 *     console.log('FrameSDK initialized successfully');
 *   } catch (error) {
 *     console.warn('FrameSDK not available, running in standalone mode:', error);
 *   }
 * }
 *
 * bootstrap();
 * ```
 */
export function setupRouterSync(router: Router): () => void {
  // Listen to route-change events from parent shell
  const routeChangeHandler = (data: unknown) => {
    const payload = data as { path: string; replace?: boolean };

    if (payload.replace) {
      router.navigateByUrl(payload.path, { replaceUrl: true });
    } else {
      router.navigateByUrl(payload.path);
    }
  };

  frameSDK.on("route-change", routeChangeHandler);

  // Capture the current route immediately to avoid treating first navigation as initial
  let lastEmittedPath = router.url;

  const subscription = router.events
    .pipe(filter((event) => event instanceof NavigationEnd))
    .subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects || event.url;

      // Don't emit if path hasn't changed
      if (url === lastEmittedPath) {
        return;
      }

      lastEmittedPath = url;
      frameSDK.emit("navigate", { path: url, replace: false, state: {} });
    });

  // Return cleanup function
  return () => {
    frameSDK.off("route-change", routeChangeHandler);
    subscription.unsubscribe();
  };
}
