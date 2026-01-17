import { computed, Injectable, type Signal, signal } from "@angular/core";
import { frameSDK } from "@zomme/fragment-frame/sdk";

/**
 * Service for accessing frameSDK props with type safety
 *
 * This service provides a type-safe way to access props passed from the parent
 * application to the fragment. Use it with dependency injection in your components.
 *
 * @example
 * ```typescript
 * import { FramePropsService } from '@zomme/fragment-frame-angular';
 *
 * interface MyFragmentProps {
 *   theme?: 'light' | 'dark';
 *   onSave?: (data: any) => Promise<void>;
 * }
 *
 * @Component({...})
 * export class MyComponent {
 *   // Recommended: Use asSignal for reactive props
 *   protected readonly props = this.frameProps.asSignal<MyFragmentProps>();
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
  // Internal signal that triggers re-computation when props change
  private _propsVersion = signal(0);

  constructor() {
    // Watch for any prop changes from the parent and increment version
    // This triggers Angular's computed() to re-evaluate
    frameSDK.watch(() => {
      this._propsVersion.update((v) => v + 1);
    });
  }

  /**
   * Get current frameSDK props with type safety
   *
   * Returns the current props from the parent application, cast to the
   * specified type. Use this in a getter to always access the latest values.
   *
   * @template T - Type of props expected (e.g., MyFragmentProps)
   * @returns Typed props object
   *
   * @example
   * ```typescript
   * protected get props() {
   *   return this.frameProps.get<TasksFragmentProps>();
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
   * @template T - Type of props expected (e.g., MyFragmentProps)
   * @returns Computed Signal with typed props
   *
   * @example
   * ```typescript
   * @Component({...})
   * export class TasksComponent {
   *   // Create reactive props in constructor
   *   protected readonly props = this.frameProps.asSignal<TasksFragmentProps>();
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
    return computed(() => {
      // Read version to create dependency - this makes Angular re-run computed when props change
      this._propsVersion();
      return (frameSDK.props ?? {}) as T;
    });
  }
}
