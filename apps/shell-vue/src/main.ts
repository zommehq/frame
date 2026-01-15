// IMPORTANT: Import and register the fragment-frame Web Component BEFORE Vue imports
import '@micro-fe/fragment-elements';

import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';

const app = createApp(App);
app.use(router);
app.mount('#app');
