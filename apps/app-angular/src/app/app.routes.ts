import type { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () => import("./pages/home/home.component").then((m) => m.HomeComponent),
  },
  {
    path: "tasks",
    loadComponent: () => import("./pages/tasks/tasks.component").then((m) => m.TasksComponent),
  },
  {
    path: "analytics",
    loadComponent: () =>
      import("./pages/analytics/analytics.component").then((m) => m.AnalyticsComponent),
  },
  {
    path: "settings",
    loadComponent: () =>
      import("./pages/settings/settings.component").then((m) => m.SettingsComponent),
  },
  {
    path: "about",
    loadComponent: () => import("./pages/about/about.component").then((m) => m.AboutComponent),
  },
  {
    path: "contact",
    loadComponent: () =>
      import("./pages/contact/contact.component").then((m) => m.ContactComponent),
  },
  {
    path: "**",
    redirectTo: "",
  },
];
