import { computed, Injectable, inject, NgZone, type Signal, signal } from "@angular/core";
import { frameSDK } from "@zomme/frame/sdk";

/**
 * Service for accessing frameSDK props with type safety
 *
 * This service provides a type-safe way to access props passed from the parent
 * application to the frame. Use it with dependency injection in your components.
 *
 * @example
 * ```typescript
 * import { FramePropsService } from '@zomme/frame-angular';
 *
 * interface MyFrameProps {
 *   theme?: 'light' | 'dark';
 *   onSave?: (data: any) => Promise<void>;
 * }
 *
 * @Component({...})
 * export class MyComponent {
 *   // Recommended: Use asSignal for reactive props
 *   protected readonly props = this.frameProps.asSignal<MyFrameProps>();
 *
 *   constructor(private frameProps: FramePropsService) {}
 *
 *   async save() {
 *     await this.props().onSave?.(this.data);
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: "root",
})
export class FramePropsService {
  // Inject NgZone to ensure Signal updates trigger change detection
  private _zone = inject(NgZone);

  // Internal signal that triggers re-computation when props change
  private _propsVersion = signal(0);

  // Cached computed signal - MUST be the same instance across all calls
  private _propsSignal: Signal<unknown>;

  constructor() {
    // Create the cached computed signal ONCE
    // This ensures all consumers share the same reactive dependency
    this._propsSignal = computed(() => {
      // Read version to create dependency - this makes Angular re-run computed when props change
      this._propsVersion();
      return (frameSDK.props ?? {}) as unknown;
    });

    // Watch for any prop changes from the parent and increment version
    // CRITICAL: Run inside NgZone so Angular detects the Signal change!
    // postMessage callbacks run outside Angular's zone by default
    frameSDK.watch(() => {
      this._zone.run(() => {
        this._propsVersion.update((v) => v + 1);
      });
    });
  }

  /**
   * Get current frameSDK props with type safety
   *
   * Returns the current props from the parent application, cast to the
   * specified type. Use this in a getter to always access the latest values.
   *
   * @template T - Type of props expected (e.g., MyFrameProps)
   * @returns Typed props object
   *
   * @example
   * ```typescript
   * protected get props() {
   *   return this.frameProps.get<TasksFrameProps>();
   * }
   *
   * // Use in methods
   * addTask() {
   *   const newTask = this.props.handleAddRandomTask?.();
   * }
   * ```
   */
  get<T>(): T {
    return (frameSDK.props ?? {}) as T;
  }

  /**
   * Get props as a computed Signal for reactive access
   *
   * **Recommended approach** - Returns an Angular Signal that automatically
   * updates when frameSDK props change. Use this in the constructor for
   * a clean, reactive solution.
   *
   * IMPORTANT: This returns the SAME cached Signal instance on every call.
   * This is critical for Angular's change detection to work properly.
   *
   * @template T - Type of props expected (e.g., MyFrameProps)
   * @returns Computed Signal with typed props
   *
   * @example
   * ```typescript
   * @Component({...})
   * export class TasksComponent {
   *   // Create reactive props in constructor
   *   protected readonly props = this.frameProps.asSignal<TasksFrameProps>();
   *
   *   constructor(private frameProps: FramePropsService) {
   *     // Initialize with current props
   *     if (this.props().tasks) {
   *       this.tasks.set(this.props().tasks);
   *     }
   *   }
   *
   *   addTask() {
   *     // Access props reactively - no getter needed!
   *     const newTask = this.props().handleAddRandomTask?.();
   *   }
   * }
   * ```
   */
  asSignal<T>(): Signal<T> {
    // Return the SAME cached signal instance - critical for reactivity!
    return this._propsSignal as Signal<T>;
  }

  /**
   * Emit event to parent shell
   *
   * @param eventName - Name of the event
   * @param data - Optional event data (will be serialized)
   *
   * @example
   * ```typescript
   * this.frameProps.emit('settings-saved', { theme: 'dark' });
   * this.frameProps.emit('user-action', { type: 'click', id: 123 });
   * ```
   */
  emit(eventName: string, data?: unknown): void {
    frameSDK.emit(eventName, data);
  }

  /**
   * Listen to events from parent shell
   *
   * @param eventName - Name of the event to listen for
   * @param handler - Callback function to handle the event
   * @returns Cleanup function to remove the listener
   *
   * @example
   * ```typescript
   * ngOnInit() {
   *   this.cleanup = this.frameProps.on('theme-change', (data) => {
   *     console.log('Theme changed:', data);
   *   });
   * }
   *
   * ngOnDestroy() {
   *   this.cleanup?.();
   * }
   * ```
   */
  on(eventName: string, handler: (data: unknown) => void): () => void {
    return frameSDK.on(eventName, handler);
  }

  /**
   * Watch for specific property changes from parent
   *
   * Note: In most cases, you don't need this if you're using injectFrameProps()
   * since Signals are automatically reactive. Use this only for side effects
   * that need to run when specific props change.
   *
   * @param props - Array of property names to watch
   * @param handler - Callback receiving changes as { propName: [newValue, oldValue] }
   * @returns Cleanup function to stop watching
   *
   * @example
   * ```typescript
   * ngOnInit() {
   *   this.unwatch = this.frameProps.watch(['theme', 'user'], (changes) => {
   *     if ('theme' in changes) {
   *       const [newTheme] = changes.theme;
   *       document.body.className = newTheme;
   *     }
   *   });
   * }
   *
   * ngOnDestroy() {
   *   this.unwatch?.();
   * }
   * ```
   */
  watch<K extends string>(
    props: K[],
    handler: (changes: Record<K, [unknown, unknown]>) => void,
  ): () => void {
    return frameSDK.watch(props, handler as any);
  }
}
