import { CommonModule } from "@angular/common";
import { Component, inject, type OnDestroy, type OnInit } from "@angular/core";
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { frameSDK, setupRouterSync } from "@zomme/fragment-frame-angular";
import type { User } from "./models/types";

interface AppProps {
  actionCallback?: (data: any) => void;
  successCallback?: (data: any) => void;
  theme?: "dark" | "light";
  user?: User;
}

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent implements OnInit, OnDestroy {
  private router = inject(Router);

  theme: "dark" | "light" = "light";
  user: User | null = null;
  isSDKReady = false;
  private unwatchProps?: () => void;
  private unsubscribeRouterSync?: () => void;

  async ngOnInit() {
    try {
      // ✅ Explicitly initialize SDK
      await frameSDK.initialize();
      this.isSDKReady = true;

      // Setup bidirectional router sync with parent shell
      this.unsubscribeRouterSync = setupRouterSync(this.router);

      // Setup error reporting to parent
      window.addEventListener("error", (event) => {
        frameSDK.emit("error", {
          error: event.error?.message || String(event.error),
          source: "window.error",
        });
      });

      window.addEventListener("unhandledrejection", (event) => {
        frameSDK.emit("error", {
          error:
            event.reason instanceof Error
              ? event.reason.message
              : String(event.reason),
          source: "unhandledrejection",
        });
      });

      // Now it's safe to access props and setup watchers
      this.setupPropsAndWatchers();
    } catch (error) {
      console.error("[Fragment App] Failed to initialize frameSDK:", error);

      // Fallback: run in standalone mode
      console.warn("[Fragment App] Running in standalone mode (no parent)");
      this.isSDKReady = false;
      this.setupStandaloneMode();
    }
  }

  private setupPropsAndWatchers() {
    const props = (frameSDK.props || {}) as Partial<AppProps>;

    this.theme = props.theme || "light";
    this.user = props.user || null;

    if (typeof props.successCallback === "function") {
      props.successCallback({
        message: "Angular app initialized successfully",
        sdkVersion: "1.0.0",
        timestamp: Date.now(),
      });
    }

    document.body.className = this.theme;

    // Watch for theme and user changes with modern API
    this.unwatchProps = frameSDK.watch(["theme", "user"], (changes) => {
      if ("theme" in changes && changes.theme) {
        const [newTheme] = changes.theme;
        this.theme = newTheme as "dark" | "light";
        document.body.className = newTheme as string;
      }

      if ("user" in changes && changes.user) {
        const [newUser] = changes.user;
        this.user = newUser as User;
      }
    });
  }

  private setupStandaloneMode() {
    // Standalone mode (running without parent)
    this.theme = "light";
    this.user = {
      id: 0,
      name: "Standalone User",
      email: "standalone@example.com",
      role: "user",
    };
    document.body.className = this.theme;
  }

  ngOnDestroy() {
    this.unwatchProps?.();
    this.unsubscribeRouterSync?.();
    if (this.isSDKReady) {
      frameSDK.cleanup();
    }
  }
}
