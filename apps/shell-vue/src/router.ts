import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/angular'
    },
    {
      path: '/angular/:pathMatch(.*)*',
      name: 'angular',
      component: () => import('./App.vue')
    },
    {
      path: '/vue/:pathMatch(.*)*',
      name: 'vue',
      component: () => import('./App.vue')
    },
    {
      path: '/react/:pathMatch(.*)*',
      name: 'react',
      component: () => import('./App.vue')
    },
    {
      path: '/solid/:pathMatch(.*)*',
      name: 'solid',
      component: () => import('./App.vue')
    }
  ]
});
