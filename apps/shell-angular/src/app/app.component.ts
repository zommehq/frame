import { CommonModule } from "@angular/common";
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
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

function getFrameFromPath(path: string): FrameName {
  if (path.startsWith("/react")) return "react";
  if (path.startsWith("/vue")) return "vue";
  return "angular";
}

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

  // Active frame based on current route - use location.pathname for immediate value
  activeFrame = signal<FrameName>(getFrameFromPath(location.pathname));

  /**
   * Extract pathname relative to frame base
   * Ex: URL="/react/tasks" + frameName="react" → "/tasks"
   *
   * Uses location.pathname to get immediate value (router.url is async and may be '/' on first render)
   */
  getFramePathname(frameName: FrameName): string {
    // Use location.pathname for immediate sync value (router.url is async)
    const currentUrl = location.pathname;
    const basePath = `/${frameName}`;

    if (currentUrl.startsWith(basePath)) {
      return currentUrl.slice(basePath.length) || "/";
    }

    return "/";
  }

  private frames = new Map<FrameName, ZFrame<AngularFrameActions>>();
  private isSyncing = false;
  private routerSubscription: Subscription | null = null;

  ngOnInit() {
    // Listen to router navigation events (including browser back/forward)
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const navEvent = event as NavigationEnd;
        this.activeFrame.set(getFrameFromPath(navEvent.urlAfterRedirects));
        // pathname attribute automatically syncs via Angular change detection
        // No need to emit route-change event manually
      });
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
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

    // pathname attribute already handles initial route - no need to emit route-change here
  }

  onFrameNavigate(event: Event) {
    const customEvent = event as CustomEvent;
    const { path } = customEvent.detail;
    const frameName = (event.target as HTMLElement).getAttribute("name") as FrameName;

    // Ignore navigation events from inactive frames
    if (frameName !== this.activeFrame()) {
      return;
    }

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

  onFrameRegister(_event: Event) {
    // Frame registered actions - can be used for tracking
  }

  onFrameUnregister(_event: Event) {
    // Frame unregistered actions - can be used for cleanup
  }

  // Frame action test methods
  private getCurrentFrame(): ZFrame<AngularFrameActions> | null {
    return this.frames.get(this.activeFrame()) || null;
  }

  async testGetStats() {
    const frame = this.getCurrentFrame();
    if (!frame) return;
    await frame.getStats();
  }

  async testRefreshData() {
    const frame = this.getCurrentFrame();
    if (!frame) return;
    await frame.refreshData();
  }

  async testNavigateTo(path: string) {
    const frame = this.getCurrentFrame();
    if (!frame) return;
    await frame.navigateTo(path);
  }
}
