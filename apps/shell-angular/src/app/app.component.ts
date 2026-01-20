import { CommonModule } from "@angular/common";
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from "@angular/core";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { filter, Subscription } from "rxjs";

import { AngularFrameActions, ZFrame } from "./models/types";
import { SettingsService } from "./services/settings.service";
import { TasksService } from "./services/tasks.service";

type FrameName = "angular" | "react" | "vue";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent implements OnInit, OnDestroy {
  private router = inject(Router);

  // Expose services for template bindings (signals are accessed directly)
  protected tasks = inject(TasksService);
  protected settings = inject(SettingsService);

  // Active frame based on current route
  private currentPath = signal(this.router.url);
  activeFrame = computed<FrameName>(() => {
    const path = this.currentPath();
    if (path.startsWith("/react")) return "react";
    if (path.startsWith("/vue")) return "vue";
    return "angular";
  });

  private frames = new Map<FrameName, ZFrame<AngularFrameActions>>();
  private isSyncing = false;
  private routerSubscription: Subscription | null = null;

  ngOnInit() {
    // Listen to router navigation events (including browser back/forward)
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const navEvent = event as NavigationEnd;
        this.currentPath.set(navEvent.urlAfterRedirects);
        this.syncRouteToFrame(navEvent.urlAfterRedirects);
      });
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
  }

  private syncRouteToFrame(url: string) {
    const frameName = this.activeFrame();
    const frame = this.frames.get(frameName);

    if (!frame || this.isSyncing) return;

    const basePath = `/${frameName}`;
    if (url.startsWith(basePath)) {
      const relativePath = url.slice(basePath.length) || "/";
      frame.emit("route-change", { path: relativePath, replace: true });
    }
  }

  // Theme management
  handleChangeTheme = (theme: "dark" | "light"): void => {
    this.settings.setTheme(theme);
  };

  toggleTheme() {
    this.settings.toggleTheme();
  }

  // Frame event handlers
  onFrameReady(event: Event) {
    const customEvent = event as CustomEvent;
    if (!customEvent.detail) return;

    const frameElement = event.target as HTMLElement;
    const frameName = frameElement.getAttribute("name") as FrameName;
    const frame = frameElement as ZFrame<AngularFrameActions>;

    this.frames.set(frameName, frame);

    // Send initial route to frame so it navigates to the correct page on refresh
    const currentPath = this.router.url;
    const basePath = `/${frameName}`;

    if (currentPath.startsWith(basePath)) {
      const relativePath = currentPath.slice(basePath.length) || "/";
      frame.emit("route-change", { path: relativePath, replace: true });
    }
  }

  onFrameNavigate(event: Event) {
    const customEvent = event as CustomEvent;
    const { path } = customEvent.detail;
    const frameName = (event.target as HTMLElement).getAttribute("name");

    // Update browser URL when frame navigates
    const fullPath = `/${frameName}${path}`;

    // Prevent sync loop
    if (this.isSyncing) {
      return;
    }

    if (this.router.url !== fullPath) {
      this.isSyncing = true;
      this.router.navigateByUrl(fullPath).finally(() => {
        setTimeout(() => {
          this.isSyncing = false;
        }, 100);
      });
    }
  }

  onFrameError(event: Event) {
    const customEvent = event as CustomEvent;
    console.error("[shell] Frame error:", customEvent.detail);
  }

  onFrameRegister(event: Event) {
    const customEvent = event as CustomEvent;
    const functions = Object.keys(customEvent.detail);
    const frameName = (event.target as HTMLElement).getAttribute("name");
    console.log(`[shell] Frame ${frameName} registered actions:`, functions);
  }

  onFrameUnregister(event: Event) {
    const customEvent = event as CustomEvent;
    const { functions } = customEvent.detail;
    const frameName = (event.target as HTMLElement).getAttribute("name");
    console.log(`[shell] Frame ${frameName} unregistered actions:`, functions);
  }

  // Frame action test methods
  private getCurrentFrame(): ZFrame<AngularFrameActions> | null {
    return this.frames.get(this.activeFrame()) || null;
  }

  async testGetStats() {
    const frame = this.getCurrentFrame();
    if (!frame) {
      console.warn("[shell] Current frame not ready");
      return;
    }
    const result = await frame.getStats();
    console.log("[shell] getStats() result:", result);
  }

  async testRefreshData() {
    const frame = this.getCurrentFrame();
    if (!frame) {
      console.warn("[shell] Current frame not ready");
      return;
    }
    const result = await frame.refreshData();
    console.log("[shell] refreshData() result:", result);
  }

  async testNavigateTo(path: string) {
    const frame = this.getCurrentFrame();
    if (!frame) {
      console.warn("[shell] Current frame not ready");
      return;
    }
    const result = await frame.navigateTo(path);
    console.log("[shell] navigateTo() result:", result);
  }
}
