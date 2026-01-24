import { frameSDK } from "@zomme/frame-react";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./App.css";

async function bootstrap() {
  let initialPath = window.location.pathname; // Default for standalone

  try {
    await frameSDK.initialize();
    // Use pathname from props (source of truth when in shell)
    initialPath = frameSDK.props.pathname || window.location.pathname;
  } catch (error) {
    console.error("FrameSDK not available, running in standalone mode:", error);
    // Keep window.location.pathname for standalone
  }

  // Navigate BEFORE mounting React to avoid flash
  if (initialPath !== window.location.pathname) {
    window.history.replaceState(null, "", initialPath);
  }

  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
}

bootstrap().catch(console.error);
