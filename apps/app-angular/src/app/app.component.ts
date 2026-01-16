import { CommonModule } from "@angular/common";
import { Component, type OnDestroy, type OnInit } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { frameSDK } from "@zomme/fragment-frame-angular";

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
  theme: "dark" | "light" = "light";
  user: User | null = null;
  private unwatchProps?: () => void;

  ngOnInit() {
    const props = (frameSDK.props || {}) as Partial<AppProps>;

    this.theme = props.theme || "light";
    this.user = props.user || null;

    console.log("Angular App Component initialized with user:", this.user);

    if (typeof props.successCallback === "function") {
      props.successCallback({ message: "Angular app initialized successfully" });
    }

    document.body.className = this.theme;

    // Watch for theme and user changes with modern API
    this.unwatchProps = frameSDK.watch(['theme', 'user'], (changes) => {
      if ('theme' in changes && changes.theme) {
        const [newTheme] = changes.theme;
        console.log("Theme changed:", newTheme);
        this.theme = newTheme as "dark" | "light";
        document.body.className = newTheme as string;
      }

      if ('user' in changes && changes.user) {
        const [newUser] = changes.user;
        console.log("User updated:", newUser);
        this.user = newUser as User;
      }
    });
  }

  triggerAction() {
    const props = frameSDK.props as AppProps;
    console.log("Action triggered");

    frameSDK.emit("action-clicked", {
      component: "AppComponent",
      timestamp: Date.now(),
    });

    if (typeof props.actionCallback === "function") {
      props.actionCallback({
        source: "navigation",
        type: "button-click",
      });
    }
  }

  triggerError() {
    try {
      throw new Error("Test error from Angular AppComponent");
    } catch (error) {
      console.error("Error triggered:", error);

      frameSDK.emit("error", {
        component: "AppComponent",
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      });
    }
  }

  ngOnDestroy() {
    this.unwatchProps?.();
    frameSDK.cleanup();
  }
}
