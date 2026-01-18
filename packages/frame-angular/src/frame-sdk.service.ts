import { Injectable } from "@angular/core";
import { frameSDK } from "@zomme/frame/sdk";
import type { PropChanges } from "@zomme/frame/types";
import { BehaviorSubject, Observable } from "rxjs";

/**
 * Angular service for using the Frame SDK
 *
 * @template T - Type of props from parent
 *
 * @example
 * ```ts
 * import { Component, OnInit } from '@angular/core';
 * import { FrameSDKService } from '@zomme/frame-angular';
 *
 * interface Props {
 *   user: { name: string };
 * }
 *
 * \@Component({
 *   selector: 'app-root',
 *   template: '<div>User: {{ (sdk.props$ | async)?.user?.name }}</div>'
 * })
 * export class AppComponent implements OnInit {
 *   constructor(public sdk: FrameSDKService<Props>) {}
 *
 *   ngOnInit() {
 *     this.sdk.initialize();
 *     this.sdk.on('route-change', (data) => {
 *       console.log('Route changed:', data);
 *     });
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: "root",
})
export class FrameSDKService<T = Record<string, unknown>> {
  private propsSubject = new BehaviorSubject<T>({} as T);
  private isReadySubject = new BehaviorSubject<boolean>(false);
  private sdkAvailableSubject = new BehaviorSubject<boolean>(false);

  /**
   * Observable stream of props from parent
   */
  props$: Observable<T> = this.propsSubject.asObservable();

  /**
   * Observable stream of SDK ready state
   */
  isReady$: Observable<boolean> = this.isReadySubject.asObservable();

  /**
   * Observable stream of SDK availability
   */
  sdkAvailable$: Observable<boolean> = this.sdkAvailableSubject.asObservable();

  /**
   * Get current props value (synchronous)
   */
  get props(): T {
    return this.propsSubject.value;
  }

  /**
   * Get current ready state (synchronous)
   */
  get isReady(): boolean {
    return this.isReadySubject.value;
  }

  /**
   * Get current SDK availability (synchronous)
   */
  get sdkAvailable(): boolean {
    return this.sdkAvailableSubject.value;
  }

  /**
   * Initialize the SDK
   * Should be called in ngOnInit or APP_INITIALIZER
   */
  async initialize(): Promise<void> {
    try {
      await frameSDK.initialize();
      this.propsSubject.next(frameSDK.props as T);
      this.isReadySubject.next(true);
      this.sdkAvailableSubject.next(true);
    } catch (error) {
      console.warn("FrameSDK not available, running in standalone mode", error);
      this.isReadySubject.next(true);
      this.sdkAvailableSubject.next(false);
    }
  }

  /**
   * Emit custom event to parent
   *
   * @param event - Event name
   * @param data - Event data (will be serialized)
   */
  emit(event: string, data?: unknown): void {
    if (this.sdkAvailable) {
      frameSDK.emit(event, data);
    }
  }

  /**
   * Listen to event from parent
   *
   * @param event - Event name
   * @param handler - Event handler
   * @returns Cleanup function
   */
  on(event: string, handler: (data: unknown) => void): () => void {
    return frameSDK.on(event, handler);
  }

  /**
   * Watch for property changes with Observable API
   * Returns an Observable stream of all property changes
   * Updates the props$ observable automatically
   *
   * @returns Observable of property changes
   *
   * @example
   * ```ts
   * ngOnInit() {
   *   this.sdk.watch$().subscribe(changes => {
   *     Object.entries(changes).forEach(([prop, [newVal, oldVal]]) => {
   *       console.log(`${prop} changed from ${oldVal} to ${newVal}`);
   *     });
   *   });
   * }
   * ```
   */
  watch$(): Observable<PropChanges<T>> {
    return new Observable((subscriber) => {
      const handler = (changes: PropChanges<T>) => {
        // Update props subject with new values
        const updates = Object.fromEntries(
          Object.entries(changes).map(([key, tuple]) => {
            const value = tuple as any;
            return [key, value?.[0]];
          }),
        );
        const currentProps = this.propsSubject.value;
        this.propsSubject.next({ ...currentProps, ...updates });
        subscriber.next(changes);
      };

      const unwatch = frameSDK.watch(handler as any);

      return () => unwatch();
    });
  }

  /**
   * Watch for specific property changes with Observable API
   * Returns an Observable stream of specified property changes
   * Updates the props$ observable automatically
   *
   * @param propNames - Array of property names to watch
   * @returns Observable of property changes
   *
   * @example
   * ```ts
   * ngOnInit() {
   *   this.sdk.watchProps$(['theme', 'user']).subscribe(changes => {
   *     if ('theme' in changes) {
   *       const [newTheme, oldTheme] = changes.theme;
   *       this.applyTheme(newTheme);
   *     }
   *   });
   * }
   * ```
   */
  watchProps$<K extends keyof T>(propNames: K[]): Observable<PropChanges<T, K>> {
    return new Observable((subscriber) => {
      const handler = (changes: PropChanges<T, K>) => {
        // Update props subject with new values
        const updates = Object.fromEntries(
          Object.entries(changes).map(([key, tuple]) => {
            const value = tuple as any;
            return [key, value?.[0]];
          }),
        );
        const currentProps = this.propsSubject.value;
        this.propsSubject.next({ ...currentProps, ...updates });
        subscriber.next(changes);
      };

      const unwatch = frameSDK.watch(propNames as string[], handler as any);

      return () => unwatch();
    });
  }

  /**
   * Cleanup SDK resources
   * Should be called in ngOnDestroy of root component
   */
  cleanup(): void {
    if (this.sdkAvailable) {
      frameSDK.cleanup();
    }
  }
}
