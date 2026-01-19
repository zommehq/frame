import { CommonModule } from "@angular/common";
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from "@angular/core";
import { Router, RouterModule } from "@angular/router";

import { AngularFrameActions, ZFrame } from "./models/types";
import { SettingsService } from "./services/settings.service";
import { TasksService } from "./services/tasks.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  private router = inject(Router);

  // Expose services for template bindings (signals are accessed directly)
  protected tasks = inject(TasksService);
  protected settings = inject(SettingsService);

  private angularFrame: ZFrame<AngularFrameActions> | null = null;
  private isSyncing = false;

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
    this.angularFrame = frameElement as ZFrame<AngularFrameActions>;

    // Send initial route to frame so it navigates to the correct page on refresh
    const frameName = frameElement.getAttribute("name");
    const currentPath = this.router.url;

    // Extract the path relative to the frame's base (e.g., "/angular/settings" -> "/settings")
    const basePath = `/${frameName}`;
    if (currentPath.startsWith(basePath)) {
      const relativePath = currentPath.slice(basePath.length) || "/";
      this.angularFrame.emit("route-change", { path: relativePath, replace: true });
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
    console.log("[shell] Frame registered actions:", functions);
  }

  onFrameUnregister(event: Event) {
    const customEvent = event as CustomEvent;
    const { functions } = customEvent.detail;
    console.log("[shell] Frame unregistered actions:", functions);
  }

  // Angular frame action test methods
  async testGetStats() {
    if (!this.angularFrame) {
      console.warn("[shell] Angular frame not ready");
      return;
    }
    const result = await this.angularFrame.getStats();
    console.log("[shell] getStats() result:", result);
  }

  async testRefreshData() {
    if (!this.angularFrame) {
      console.warn("[shell] Angular frame not ready");
      return;
    }
    const result = await this.angularFrame.refreshData();
    console.log("[shell] refreshData() result:", result);
  }

  async testNavigateTo(path: string) {
    if (!this.angularFrame) {
      console.warn("[shell] Angular frame not ready");
      return;
    }
    const result = await this.angularFrame.navigateTo(path);
    console.log("[shell] navigateTo() result:", result);
  }
}
