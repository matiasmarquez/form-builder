import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router.ts';
import { createTemplate, updateTemplate } from './api.ts';
import { setTemplateSaveTransport } from './stores/editor.ts';
import './styles.css';

setTemplateSaveTransport({
  create: createTemplate,
  update: updateTemplate,
});

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');
