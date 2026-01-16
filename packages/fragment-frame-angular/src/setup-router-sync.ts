import { NavigationEnd, type Router } from "@angular/router";
import { frameSDK } from "@zomme/fragment-frame/sdk";
import { filter } from "rxjs/operators";

/**
 * Setup automatic router synchronization between Angular Router and parent shell
 *
 * This function handles bidirectional routing:
 * - Listens to 'route-change' events from parent and navigates the Angular router
 * - Emits 'navigate' events to parent when Angular router navigates
 *
 * @param router - Angular Router instance
 * @param base - Base path for the app (e.g., '/angular')
 * @returns Cleanup function to remove listeners
 *
 * @example
 * ```ts
 * import { bootstrapApplication } from '@angular/platform-browser';
 * import { Router } from '@angular/router';
 * import { frameSDK, setupRouterSync } from '@zomme/fragment-frame-angular';
 * import { AppComponent } from './app/app.component';
 * import { appConfig } from './app/app.config';
 *
 * async function bootstrap() {
 *   const appRef = await bootstrapApplication(AppComponent, appConfig);
 *   const router = appRef.injector.get(Router);
 *
 *   let base = '/angular/';
 *   let sdkAvailable = false;
 *
 *   try {
 *     await frameSDK.initialize();
 *     base = (frameSDK.props.base as string) || '/angular/';
 *     sdkAvailable = true;
 *
 *     // Setup router sync in a single line
 *     const cleanup = setupRouterSync(router, base);
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
export function setupRouterSync(router: Router, base: string): () => void {
  // Listen to route-change events from parent shell
  const routeChangeHandler = (data: unknown) => {
    const payload = data as { path: string; replace?: boolean };

    console.log(`[Angular] Received route-change: path="${payload.path}"`);

    if (payload.replace) {
      router.navigateByUrl(payload.path, { replaceUrl: true });
    } else {
      router.navigateByUrl(payload.path);
    }
  };

  frameSDK.on("route-change", routeChangeHandler);

  // Capture the current route immediately to avoid treating first navigation as initial
  const currentUrl = router.url;
  const currentPath = currentUrl.replace(base, "/");
  let lastEmittedPath: string | null = currentPath;

  console.log(
    `[Angular] setupRouterSync initialized with currentPath="${currentPath}"`
  );

  const subscription = router.events
    .pipe(filter((event) => event instanceof NavigationEnd))
    .subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects || event.url;
      const path = url.replace(base, "/");

      console.log(
        `[Angular] NavigationEnd: url="${url}", base="${base}", path="${path}", lastEmitted="${lastEmittedPath}"`
      );

      // Don't emit if path hasn't changed
      if (path === lastEmittedPath) {
        console.log("[Angular] Path unchanged, skipping emission");
        return;
      }

      lastEmittedPath = path;
      console.log("[Angular] Emitting navigate event to parent:", { path, url, base });
      frameSDK.emit("navigate", { path, replace: false, state: {} });
    });

  // Return cleanup function
  return () => {
    frameSDK.off("route-change", routeChangeHandler);
    subscription.unsubscribe();
  };
}
