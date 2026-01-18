// IMPORTANT: Import and register the z-frame Web Component BEFORE Vue imports
import "@zomme/frame";

import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.mount("#app");
