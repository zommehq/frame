import { frameSDK } from "@zomme/fragment-frame-react";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./App.css";

async function bootstrap() {
  let base = "/react";
  let sdkAvailable = false;

  try {
    await frameSDK.initialize();
    base = frameSDK.props.base || "/react";
    sdkAvailable = true;

    console.log("FrameSDK initialized successfully");
  } catch (error) {
    console.warn("FrameSDK not available, running in standalone mode:", error);
    sdkAvailable = false;
  }

  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <BrowserRouter basename={base}>
        <App sdkAvailable={sdkAvailable} base={base} />
      </BrowserRouter>
    </React.StrictMode>,
  );

  console.log(`React app rendered with base: ${base} (SDK available: ${sdkAvailable})`);
}

bootstrap().catch((error) => {
  console.error("Failed to bootstrap React micro app:", error);
});
