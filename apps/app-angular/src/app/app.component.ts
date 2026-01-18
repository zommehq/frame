import { CommonModule } from "@angular/common";
import { Component, effect, inject } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { FramePropsService, injectFrameProps } from "@zomme/frame-angular";
import type { AppFrameProps } from "./models/frame-props";
import type { User } from "./models/types";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  private frameProps = inject(FramePropsService);
  private props = injectFrameProps<AppFrameProps>();

  // Reactive data from parent - auto-updates via Signals
  protected theme = this.props.theme;
  protected user = this.props.user;

  constructor() {
    // Sync theme with body class
    effect(() => {
      const currentTheme = this.theme() || "light";
      document.body.className = currentTheme;
    });

    // Call success callback when props are available
    this.callSuccessCallback();

    // Setup global error reporting to parent
    this.setupErrorReporting();
  }

  private async callSuccessCallback() {
    // Small delay to ensure props are ready
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      await this.props.successCallback({
        message: "Angular app initialized successfully",
        sdkVersion: "1.0.0",
        timestamp: Date.now(),
      });
    } catch {
      // Callback not available - running in standalone mode or parent didn't provide it
    }
  }

  private setupErrorReporting() {
    window.addEventListener("error", (event) => {
      this.frameProps.emit("error", {
        error: event.error?.message || String(event.error),
        source: "window.error",
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      this.frameProps.emit("error", {
        error: event.reason instanceof Error ? event.reason.message : String(event.reason),
        source: "unhandledrejection",
      });
    });
  }

  // Helper to get user safely
  get currentUser(): User | undefined {
    return this.user() as User | undefined;
  }

  get currentTheme(): "dark" | "light" {
    return (this.theme() as "dark" | "light") || "light";
  }
}
