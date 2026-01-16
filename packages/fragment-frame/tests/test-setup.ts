import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Register happy-dom globally BEFORE any other imports
GlobalRegistrator.register();

// Mock window.parent if not available
if (!window.parent) {
  (window as any).parent = window;
}

// Import and register fragment-frame custom element after DOM is ready
await import("../src/fragment-frame");
