import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@zomme/fragment-elements/sdk": resolve(
        __dirname,
        "../../packages/fragment-elements/dist/sdk.js",
      ),
      "@zomme/fragment-elements/constants": resolve(
        __dirname,
        "../../packages/fragment-elements/dist/constants.js",
      ),
      "@zomme/fragment-elements/types": resolve(
        __dirname,
        "../../packages/fragment-elements/dist/types.js",
      ),
      "@zomme/fragment-elements": resolve(
        __dirname,
        "../../packages/fragment-elements/dist/index.js",
      ),
    },
  },
  optimizeDeps: {
    exclude: ['@zomme/fragment-frame-angular']
  },
  server: {
    port: 4200,
    cors: true,
  },
});
