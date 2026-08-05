import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import HomeView from './views/HomeView.vue';
import EditorView from './views/EditorView.vue';

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/forms/:id/edit', name: 'form-edit', component: EditorView },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
