import type { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "angular",
    children: [
      {
        path: "**",
        component: {} as any, // Routes handled by fragment-frame
      },
    ],
  },
  {
    path: "vue",
    children: [
      {
        path: "**",
        component: {} as any, // Routes handled by fragment-frame
      },
    ],
  },
  {
    path: "react",
    children: [
      {
        path: "**",
        component: {} as any, // Routes handled by fragment-frame
      },
    ],
  },
  {
    path: "solid",
    children: [
      {
        path: "**",
        component: {} as any, // Routes handled by fragment-frame
      },
    ],
  },
  {
    path: "",
    redirectTo: "/angular",
    pathMatch: "full",
  },
];
