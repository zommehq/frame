import "@zomme/fragment-frame";
import React, { useEffect, useRef } from "react";

interface FragmentFrameProps {
  /** Name of the fragment (used for identification) */
  name: string;

  /** URL to load in the iframe */
  src: string;

  /** Sandbox permissions for the iframe */
  sandbox?: string;

  /** Optional HTML attributes */
  className?: string;
  style?: React.CSSProperties;
  id?: string;

  /** Event handlers for fragment-frame events */
  onReady?: (event: CustomEvent) => void;
  onNavigate?: (event: CustomEvent) => void;
  onError?: (event: CustomEvent) => void;

  /** Props to pass to the child frame (serialized automatically) */
  [key: string]: unknown;
}

/**
 * React component wrapper for <fragment-frame> custom element
 *
 * @example
 * ```tsx
 * <FragmentFrame
 *   name="my-app"
 *   src="http://localhost:3000/"
 *   user={{ id: 1, name: "John" }}
 *   theme="dark"
 *   onReady={(e) => console.log('Ready:', e.detail)}
 *   onNavigate={(e) => console.log('Navigate:', e.detail)}
 * />
 * ```
 */
export const FragmentFrame = React.forwardRef<HTMLElement, FragmentFrameProps>(
  ({ name, src, sandbox = "allow-scripts allow-same-origin", onReady, onNavigate, onError, ...props }, ref) => {
    const elementRef = useRef<HTMLElement>(null);

    useEffect(() => {
      const element = elementRef.current;
      if (!element) return;

      // Set up event listeners
      const listeners: Array<[string, EventListener]> = [];

      if (onReady) {
        const handler = onReady as EventListener;
        element.addEventListener("ready", handler);
        listeners.push(["ready", handler]);
      }

      if (onNavigate) {
        const handler = onNavigate as EventListener;
        element.addEventListener("navigate", handler);
        listeners.push(["navigate", handler]);
      }

      if (onError) {
        const handler = onError as EventListener;
        element.addEventListener("error", handler);
        listeners.push(["error", handler]);
      }

      // Handle custom event handlers (on*)
      Object.entries(props).forEach(([key, value]) => {
        if (key.startsWith("on") && typeof value === "function" && key !== "onReady" && key !== "onNavigate" && key !== "onError") {
          const eventName = key.slice(2).toLowerCase();
          const handler = value as EventListener;
          element.addEventListener(eventName, handler);
          listeners.push([eventName, handler]);
        }
      });

      return () => {
        listeners.forEach(([event, handler]) => {
          element.removeEventListener(event, handler);
        });
      };
    }, [onReady, onNavigate, onError, props]);

    useEffect(() => {
      const element = elementRef.current;
      if (!element) return;

      // Set props as properties (for complex objects, functions, etc.)
      Object.entries(props).forEach(([key, value]) => {
        // Skip event handlers and standard HTML attributes
        if (key.startsWith("on") || ["className", "style", "id"].includes(key)) return;

        // Set as property for complex types
        (element as any)[key] = value;
      });
    }, [props]);

    return React.createElement("fragment-frame", {
      ref: (el: HTMLElement | null) => {
        (elementRef as React.MutableRefObject<HTMLElement | null>).current = el;
        if (typeof ref === "function") {
          ref(el);
        } else if (ref) {
          ref.current = el;
        }
      },
      name,
      src,
      sandbox,
      ...Object.fromEntries(
        Object.entries(props).filter(([key]) =>
          !key.startsWith("on") && ["className", "style", "id"].includes(key)
        )
      ),
    });
  }
);

FragmentFrame.displayName = "FragmentFrame";
