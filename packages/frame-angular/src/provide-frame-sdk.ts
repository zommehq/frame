import {
  APP_INITIALIZER,
  DestroyRef,
  type EnvironmentProviders,
  Injector,
  inject,
  makeEnvironmentProviders,
} from "@angular/core";
import { Router } from "@angular/router";
import { frameSDK } from "@zomme/frame/sdk";
import { setupRouterSync } from "./setup-router-sync";

/**
 * Configuration options for provideFrameSDK
 */
export interface FrameSDKConfig {
  /**
   * Expected parent origin for security validation.
   * If provided, SDK will reject connections from other origins.
   *
   * @example 'https://app.example.com'
   */
  expectedOrigin?: string;

  /**
   * Timeout for SDK initialization in milliseconds.
   * If the parent shell doesn't respond within this time, standalone mode is activated.
   *
   * @default 10000
   */
  timeout?: number;

  /**
   * Enable automatic router synchronization with parent shell.
   * When enabled, navigation in the frame will be synced to the parent
   * and vice versa.
   *
   * @default true
   */
  routerSync?: boolean;

  /**
   * Callback invoked when SDK initialization fails (standalone mode).
   * Use this to set up fallback behavior when running outside the shell.
   */
  onStandalone?: () => void;

  /**
   * Callback invoked when SDK initialization succeeds.
   * Use this for any post-initialization setup.
   * Receives the Angular Injector to access services.
   */
  onReady?: (injector: Injector) => void;
}

/**
 * Provides the Frame SDK for Angular applications.
 *
 * This provider:
 * - Automatically initializes the SDK via APP_INITIALIZER
 * - Sets up router synchronization with parent shell (if enabled)
 * - Handles cleanup when the app is destroyed
 * - Falls back to standalone mode if initialization fails
 *
 * @param config - Optional configuration options
 * @returns Environment providers to add to your app config
 *
 * @example
 * ```typescript
 * // app.config.ts
 * import { provideFrameSDK } from '@zomme/frame-angular';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideRouter(routes),
 *     provideFrameSDK({
 *       routerSync: true,
 *       onStandalone: () => {
 *         console.log('Running in standalone mode');
 *       },
 *       onReady: (injector) => {
 *         // Access services via injector
 *         injector.get(MyFrameActionsService).register();
 *       },
 *     }),
 *   ],
 * };
 * ```
 *
 * @example
 * ```typescript
 * // With security validation
 * provideFrameSDK({
 *   expectedOrigin: 'https://shell.example.com',
 *   timeout: 5000,
 * })
 * ```
 */
export function provideFrameSDK(config: FrameSDKConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const injector = inject(Injector);
        const destroyRef = inject(DestroyRef);
        const router = inject(Router, { optional: true });

        return async () => {
          try {
            // Initialize via FrameSDKService instead of direct frameSDK
            // This ensures FrameSDKService.sdkAvailable is properly updated
            const { FrameSDKService } = await import("./frame-sdk.service");
            const frameSDKService = injector.get(FrameSDKService);
            await frameSDKService.initialize(config.expectedOrigin, config.timeout);

            // Setup router sync if enabled and router is available
            if (config.routerSync !== false && router) {
              const unsubscribe = setupRouterSync(router);
              destroyRef.onDestroy(() => unsubscribe());
            }

            // Setup cleanup on destroy
            destroyRef.onDestroy(() => frameSDKService.cleanup());

            // Call onReady callback with injector
            config.onReady?.(injector);
          } catch (error) {
            console.warn("[provideFrameSDK] Running in standalone mode:", error);
            config.onStandalone?.();
          }
        };
      },
      multi: true,
    },
  ]);
}

/**
 * Check if the SDK is running in standalone mode (no parent shell).
 *
 * @deprecated Since version 2.0.0. Use `FrameSDKService.sdkAvailable` instead for consistency.
 *
 * **Migration Guide:**
 * ```typescript
 * // Before (deprecated):
 * import { isStandaloneMode } from '@zomme/frame-angular';
 *
 * @Component({...})
 * export class MyComponent {
 *   isStandalone = isStandaloneMode();
 * }
 *
 * // After (recommended):
 * import { FrameSDKService } from '@zomme/frame-angular';
 *
 * @Component({...})
 * export class MyComponent {
 *   private frameSDK = inject(FrameSDKService);
 *
 *   // For templates (reactive):
 *   isStandalone$ = this.frameSDK.sdkAvailable$.pipe(map(available => !available));
 *
 *   // For logic (synchronous):
 *   get isStandalone() {
 *     return !this.frameSDK.sdkAvailable;
 *   }
 * }
 * ```
 *
 * **Why deprecate?**
 * - Inconsistent with React and Vue patterns
 * - Checks `frameSDK.props` emptiness (different from `sdkAvailable`)
 * - Not reactive (computed value vs observable state)
 * - `FrameSDKService.sdkAvailable` is the standard API
 *
 * **Breaking Change:** This function will be removed in version 3.0.0.
 *
 * @returns true if running in standalone mode (no parent shell)
 */
export function isStandaloneMode(): boolean {
  return !frameSDK.props || Object.keys(frameSDK.props).length === 0;
}
