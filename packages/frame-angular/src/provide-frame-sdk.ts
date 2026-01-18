import {
  APP_INITIALIZER,
  DestroyRef,
  type EnvironmentProviders,
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
   */
  onReady?: () => void;
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
 *       onReady: () => {
 *         console.log('SDK initialized successfully');
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
        const destroyRef = inject(DestroyRef);
        const router = inject(Router, { optional: true });

        return async () => {
          try {
            await frameSDK.initialize(config.expectedOrigin, config.timeout);

            // Setup router sync if enabled and router is available
            if (config.routerSync !== false && router) {
              const unsubscribe = setupRouterSync(router);
              destroyRef.onDestroy(() => unsubscribe());
            }

            // Setup cleanup on destroy
            destroyRef.onDestroy(() => frameSDK.cleanup());

            // Call onReady callback
            config.onReady?.();
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
 * This can be used to conditionally render UI or enable features
 * that are only available when running inside a shell.
 *
 * @returns true if running in standalone mode (no parent shell)
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   isStandalone = isStandaloneMode();
 *
 *   // In template: @if (!isStandalone) { <shell-only-feature /> }
 * }
 * ```
 */
export function isStandaloneMode(): boolean {
  return !frameSDK.props || Object.keys(frameSDK.props).length === 0;
}
