import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@zomme/frame/sdk": resolve(__dirname, "../../packages/frame/dist/sdk.js"),
      "@zomme/frame/constants": resolve(__dirname, "../../packages/frame/dist/constants.js"),
      "@zomme/frame/types": resolve(__dirname, "../../packages/frame/dist/types.js"),
      "@zomme/frame": resolve(__dirname, "../../packages/frame/dist/index.js"),
    },
  },
  optimizeDeps: {
    exclude: ["@zomme/frame-angular"],
  },
  server: {
    port: 4200,
    cors: true,
  },
});
