import { CommonModule } from "@angular/common";
import { Component, CUSTOM_ELEMENTS_SCHEMA, effect } from "@angular/core";
import { RouterModule } from "@angular/router";

import { AngularFrameActions, ZFrame } from "./models/types";
import { SettingsService, User } from "./services/settings.service";
import { Task, TaskStats, TasksService } from "./services/tasks.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  // Props synced from services (used in template bindings)
  currentUser: User | undefined;
  currentTheme: "dark" | "light" = "light";
  filteredTasks: Task[] = [];
  filter: "active" | "all" | "completed" = "all";
  searchQuery = "";
  taskStats: TaskStats = { active: 0, completed: 0, total: 0 };

  private angularFrame: ZFrame<AngularFrameActions> | null = null;

  constructor(
    public tasksService: TasksService,
    public settingsService: SettingsService,
  ) {
    // Sync services to component properties for template bindings
    effect(() => {
      this.currentTheme = this.settingsService.theme();
      this.currentUser = this.settingsService.user();
      this.filteredTasks = this.tasksService.filteredTasks();
      this.filter = this.tasksService.filter();
      this.searchQuery = this.tasksService.searchQuery();
      this.taskStats = this.tasksService.taskStats();
    });
  }

  // Theme management
  handleChangeTheme = (theme: "dark" | "light"): void => {
    this.settingsService.setTheme(theme);
  };

  toggleTheme() {
    this.settingsService.toggleTheme();
  }

  // Frame event handlers
  onFrameReady(event: Event) {
    const customEvent = event as CustomEvent;
    if (!customEvent.detail) return;

    const frameElement = event.target as HTMLElement;
    this.angularFrame = frameElement as ZFrame<AngularFrameActions>;
  }

  onFrameNavigate(event: Event) {
    const customEvent = event as CustomEvent;
    console.log("[shell] Frame navigated:", customEvent.detail);
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
