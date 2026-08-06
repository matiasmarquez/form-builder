import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import HomeView from './views/HomeView.vue';
import EditorView from './views/EditorView.vue';
import PreviewView from './views/PreviewView.vue';

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/forms/:id/edit', name: 'form-edit', component: EditorView },
  { path: '/forms/:id/preview', name: 'form-preview', component: PreviewView },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
