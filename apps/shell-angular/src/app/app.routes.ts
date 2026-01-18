import type { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "angular",
    children: [
      {
        path: "**",
        component: {} as any, // Routes handled by z-frame
      },
    ],
  },
  {
    path: "vue",
    children: [
      {
        path: "**",
        component: {} as any, // Routes handled by z-frame
      },
    ],
  },
  {
    path: "react",
    children: [
      {
        path: "**",
        component: {} as any, // Routes handled by z-frame
      },
    ],
  },
  {
    path: "",
    redirectTo: "/angular",
    pathMatch: "full",
  },
];
