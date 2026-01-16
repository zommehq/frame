import { CommonModule } from "@angular/common";
import { Component, effect, type OnDestroy, type OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { frameSDK } from "@zomme/fragment-frame-angular";
import { PageLayoutComponent } from "../../components/page-layout/page-layout.component";

interface User {
  email: string;
  id: number;
  name: string;
  role: string;
}

interface SettingsData {
  appName: string;
  language: string;
  notifications: boolean;
  theme: "dark" | "light";
}

@Component({
  imports: [CommonModule, FormsModule, PageLayoutComponent],
  selector: "app-settings",
  standalone: true,
  styleUrls: ["./settings.component.css"],
  templateUrl: "./settings.component.html",
})
export class SettingsComponent implements OnInit, OnDestroy {
  isReady = signal(false);
  isSaving = signal(false);
  saveMessage = signal("");
  theme = signal<"dark" | "light">("light");
  user = signal<User | null>(null);
  private unwatchProps?: () => void;

  settings = signal<SettingsData>({
    appName: "Angular Micro-App",
    language: "en",
    notifications: true,
    theme: "light",
  });

  constructor() {
    // Watch theme changes
    effect(() => {
      const currentTheme = this.theme();
      document.body.classList.remove("light", "dark");
      document.body.classList.add(currentTheme);
    });
  }

  async ngOnInit() {
    try {
      await frameSDK.initialize();
      this.isReady.set(true);

      const props = (frameSDK.props ?? {}) as {
        actionCallback?: (data: any) => void;
        saveCallback?: (
          settings: any
        ) => Promise<{ success: boolean; message: string }>;
        theme?: "dark" | "light";
        user?: User;
      };

      if (props.theme) {
        this.theme.set(props.theme);
        this.settings.update((s) => ({
          ...s,
          theme: props.theme as "dark" | "light",
        }));
      }

      if (props.user) {
        this.user.set(props.user);
      }

      // Watch for theme and user changes with modern API
      this.unwatchProps = frameSDK.watch(['theme', 'user'], (changes) => {
        if ('theme' in changes && changes.theme) {
          const [newTheme] = changes.theme;
          console.log("Theme attribute changed:", newTheme);
          this.theme.set(newTheme as "dark" | "light");
          this.settings.update((s) => ({ ...s, theme: newTheme as "dark" | "light" }));

          frameSDK.emit("theme-changed", {
            source: "watch-listener",
            theme: newTheme,
            timestamp: Date.now(),
          });
        }

        if ('user' in changes && changes.user) {
          const [newUser] = changes.user;
          console.log("User attribute changed:", newUser);
          this.user.set(newUser as User);

          frameSDK.emit("user-changed", {
            user: newUser,
          });
        }
      });
    } catch (error) {
      console.error("Failed to initialize SDK:", error);
      // Still set isReady to true so the component renders in standalone mode
      this.isReady.set(true);
    }
  }

  ngOnDestroy() {
    this.unwatchProps?.();
  }

  async handleSubmit() {
    this.isSaving.set(true);
    this.saveMessage.set("");

    try {
      const props = frameSDK.props as {
        saveCallback?: (
          settings: any
        ) => Promise<{ success: boolean; message: string }>;
      };

      if (typeof props.saveCallback === "function") {
        const result = await props.saveCallback(this.settings());

        if (result.success) {
          this.saveMessage.set(
            result.message || "Settings saved successfully!"
          );

          frameSDK.emit("settings-saved", {
            settings: this.settings(),
            timestamp: Date.now(),
          });
        } else {
          this.saveMessage.set(result.message || "Failed to save settings");
        }
      } else {
        this.saveMessage.set("Settings saved successfully!");

        frameSDK.emit("settings-saved", {
          settings: this.settings(),
          timestamp: Date.now(),
        });
      }

      setTimeout(() => {
        this.saveMessage.set("");
      }, 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      this.saveMessage.set("Error saving settings");

      frameSDK.emit("error", {
        component: "Settings",
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      });

      setTimeout(() => {
        this.saveMessage.set("");
      }, 3000);
    } finally {
      this.isSaving.set(false);
    }
  }

  handleReset() {
    this.settings.set({
      appName: "Angular Micro-App",
      language: "en",
      notifications: true,
      theme: this.theme(),
    });

    this.saveMessage.set("Settings reset to defaults");

    frameSDK.emit("settings-reset", {
      timestamp: Date.now(),
    });

    setTimeout(() => {
      this.saveMessage.set("");
    }, 3000);
  }

  triggerActionCallback() {
    const props = frameSDK.props as {
      actionCallback?: (data: any) => void;
    };

    if (typeof props.actionCallback === "function") {
      props.actionCallback({
        component: "Settings",
        source: "callback-demo",
        timestamp: Date.now(),
        type: "test-action",
      });

      this.saveMessage.set("Action callback triggered!");

      setTimeout(() => {
        this.saveMessage.set("");
      }, 2000);
    } else {
      this.saveMessage.set("No action callback provided");

      setTimeout(() => {
        this.saveMessage.set("");
      }, 2000);
    }
  }

  testThemeToggle() {
    const newTheme = this.theme() === "light" ? "dark" : "light";
    frameSDK.emit("change-theme", { theme: newTheme });
  }

  getUserInitial(): string {
    const currentUser = this.user();
    return currentUser ? currentUser.name.charAt(0).toUpperCase() : "";
  }

  isErrorMessage(): boolean {
    return this.saveMessage().includes("Error");
  }

  // For ngModel binding, we need getters and setters
  get appName(): string {
    return this.settings().appName;
  }

  set appName(value: string) {
    this.settings.update((s) => ({ ...s, appName: value }));
  }

  get language(): string {
    return this.settings().language;
  }

  set language(value: string) {
    this.settings.update((s) => ({ ...s, language: value }));
  }

  get settingsTheme(): "dark" | "light" {
    return this.settings().theme;
  }

  set settingsTheme(value: "dark" | "light") {
    this.settings.update((s) => ({ ...s, theme: value }));
  }

  get notifications(): boolean {
    return this.settings().notifications;
  }

  set notifications(value: boolean) {
    this.settings.update((s) => ({ ...s, notifications: value }));
  }
}
