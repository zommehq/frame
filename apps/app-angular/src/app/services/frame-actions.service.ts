import { Injectable, inject } from "@angular/core";
import { Router } from "@angular/router";
import { frameSDK, isStandaloneMode } from "@zomme/frame-angular";

/**
 * Service to register functions that the parent shell can call.
 *
 * These functions are exposed via frameSDK.register() and can be called
 * from the parent using frame.actionName() syntax.
 *
 * @example
 * ```typescript
 * // In parent shell:
 * const stats = await frame.getStats();
 * await frame.refreshData();
 * await frame.navigateTo('/settings');
 * ```
 */
@Injectable({ providedIn: "root" })
export class FrameActionsService {
  private router = inject(Router);
  private unregister?: () => void;

  /**
   * Register all actions with the parent shell.
   * Only registers if SDK is connected (not standalone mode).
   */
  register(): void {
    // Don't register if running in standalone mode
    if (isStandaloneMode()) {
      console.log("[app-angular] Standalone mode - skipping action registration");
      return;
    }

    this.unregister = frameSDK.register({
      getStats: () => this.getStats(),
      navigateTo: (path: string) => this.navigateTo(path),
      refreshData: () => this.refreshData(),
    });

    console.log("[app-angular] Registered actions: getStats, navigateTo, refreshData");
  }

  /**
   * Cleanup registered actions.
   * Called automatically on app destroy.
   */
  cleanup(): void {
    this.unregister?.();
  }

  /**
   * Get current app stats
   */
  private getStats() {
    return {
      currentRoute: this.router.url,
      theme: document.body.className || "light",
      timestamp: Date.now(),
    };
  }

  /**
   * Navigate to a specific route
   */
  private async navigateTo(path: string) {
    await this.router.navigateByUrl(path);
    return {
      navigatedTo: path,
      timestamp: Date.now(),
    };
  }

  /**
   * Refresh data in the app
   */
  private async refreshData() {
    console.log("[app-angular] Parent requested data refresh");
    // Simulate async refresh operation
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      refreshedAt: Date.now(),
      success: true,
    };
  }
}
