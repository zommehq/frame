import { inject, isDevMode, type Signal } from "@angular/core";
import { FramePropsService } from "./frame-props.service";

/**
 * Remove index signatures from type, keeping only explicit keys
 */
type RemoveIndexSignature<T> = {
  [K in keyof T as string extends K
    ? never
    : number extends K
      ? never
      : symbol extends K
        ? never
        : K]: T[K];
};

/**
 * Get the non-undefined version of a type
 */
type NonUndefined<T> = T extends undefined ? never : T;

/**
 * Check if a type (excluding undefined) is a function
 */
type IsFunction<T> = NonUndefined<T> extends (...args: any[]) => any ? true : false;

/**
 * Extract function argument types from potentially optional function
 */
type FunctionArgs<T> = NonUndefined<T> extends (...args: infer A) => any ? A : never;

/**
 * Extract function return type from potentially optional function
 */
type FunctionReturn<T> = NonUndefined<T> extends (...args: any[]) => infer R ? R : never;

/**
 * Proxy type that converts:
 * - Data props -> Signal<T> (keeps original type including undefined)
 * - Function props -> always-callable async method returning Promise
 */
export type PropsProxy<T> = {
  [K in keyof RemoveIndexSignature<T>]-?: IsFunction<T[K]> extends true
    ? (...args: FunctionArgs<T[K]>) => Promise<Awaited<FunctionReturn<T[K]>> | undefined>
    : Signal<T[K]>;
};

/**
 * A hybrid object that acts as BOTH a Signal AND an async function.
 *
 * - If the current prop value is a function: executes it and returns Promise
 * - If the current prop value is NOT a function: returns the value (Signal behavior)
 *
 * This solves the timing problem where we don't know if a prop will be
 * a function or data until it arrives from the parent.
 */
function createHybrid(
  propsSignal: Signal<Record<string, unknown>>,
  propsService: FramePropsService,
  prop: string,
): Signal<unknown> & ((...args: unknown[]) => Promise<unknown>) {
  // Create the hybrid function that delegates to propsSignal directly
  // No intermediate computed - we call propsSignal() directly for reactivity
  const hybrid = (...args: unknown[]): unknown => {
    const props = propsService.get<Record<string, unknown>>();
    const currentValue = props[prop];

    // If the current value IS a function, call it
    if (typeof currentValue === "function") {
      try {
        const result = currentValue(...args);
        // Wrap in Promise for consistent async behavior
        return Promise.resolve(result);
      } catch (error) {
        return Promise.reject(error);
      }
    }

    // If NOT a function, this is being used as a Signal
    // CRITICAL: Read from propsSignal() directly - this creates the reactive dependency!
    if (args.length === 0) {
      const allProps = propsSignal();
      return allProps[prop];
    }

    // Called with args but value is not a function - this is an error
    const errorMsg = `Function "${prop}" not available in props (current value: ${typeof currentValue})`;
    if (isDevMode()) {
      throw new Error(`[injectFrameProps] ${errorMsg}`);
    }
    console.warn(`[injectFrameProps] ${errorMsg}`);
    return Promise.resolve(undefined);
  };

  // Make the hybrid identifiable
  Object.defineProperty(hybrid, Symbol.toStringTag, { value: "FramePropsHybrid" });

  return hybrid as Signal<unknown> & ((...args: unknown[]) => Promise<unknown>);
}

/**
 * Inject frame props with full type safety.
 *
 * Creates a proxy where each property is a "hybrid" that works as both:
 * - A Signal (for data props): call with `()` to get the value
 * - An async function (for action props): call with args to execute
 *
 * The hybrid checks the actual prop value at call time to determine behavior.
 * This handles the case where functions arrive after data from the parent.
 */
export function injectFrameProps<T>(): PropsProxy<T> {
  const propsService = inject(FramePropsService);
  // Get the CACHED props signal - same instance every time
  const propsSignal = propsService.asSignal<Record<string, unknown>>();
  const cache = new Map<string, ReturnType<typeof createHybrid>>();

  const getOrCreateHybrid = (prop: string) => {
    if (!cache.has(prop)) {
      cache.set(prop, createHybrid(propsSignal, propsService, prop));
    }
    return cache.get(prop)!;
  };

  return new Proxy({} as PropsProxy<T>, {
    get(_, prop: string) {
      return getOrCreateHybrid(prop);
    },
  });
}
