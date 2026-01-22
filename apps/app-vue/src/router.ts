import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    component: () => import("./views/Home.vue"),
    name: "home",
    path: "/",
  },
  {
    component: () => import("./views/TaskList.vue"),
    name: "tasks",
    path: "/tasks",
  },
  {
    component: () => import("./views/Analytics.vue"),
    name: "analytics",
    path: "/analytics",
  },
  {
    component: () => import("./views/Settings.vue"),
    name: "settings",
    path: "/settings",
  },
];

export function createAppRouter() {
  return createRouter({
    history: createWebHistory(),
    routes,
  });
}
