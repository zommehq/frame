import { CommonModule } from "@angular/common";
import { Component, effect, inject, type OnDestroy, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FramePropsService, injectFrameProps } from "@zomme/fragment-frame-angular";
import { PageLayoutComponent } from "../../components/page-layout/page-layout.component";
import type { SettingsFragmentProps } from "../../models/fragment-props";

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
export class SettingsComponent implements OnDestroy {
  private frameProps = inject(FramePropsService);
  private props = injectFrameProps<SettingsFragmentProps>();

  // Reactive data from parent
  protected theme = this.props.theme;
  protected user = this.props.user;

  // Local state
  isReady = signal(true);
  isSaving = signal(false);
  saveMessage = signal("");

  settings = signal<SettingsData>({
    appName: "Angular Micro-App",
    language: "en",
    notifications: true,
    theme: "light",
  });

  private eventUnsubscribers: Array<() => void> = [];

  constructor() {
    // Sync theme with body class
    effect(() => {
      const currentTheme = this.theme() || "light";
      document.body.classList.remove("light", "dark");
      document.body.classList.add(currentTheme);

      // Also sync to local settings
      this.settings.update((s) => ({ ...s, theme: currentTheme }));
    });

    // Setup parent event listeners
    this.setupParentEventListeners();
  }

  ngOnDestroy() {
    // Cleanup all event listeners
    for (const unsub of this.eventUnsubscribers) {
      unsub();
    }
  }

  private setupParentEventListeners() {
    // Listen for force theme change from parent
    const unsub1 = this.frameProps.on("force-theme-change", (data: any) => {
      if (data?.theme) {
        this.settings.update((s) => ({ ...s, theme: data.theme }));
        this.saveMessage.set(`Theme forced to ${data.theme} by parent`);
        setTimeout(() => this.saveMessage.set(""), 2000);
      }
    });

    // Listen for reset settings command
    const unsub2 = this.frameProps.on("reset-settings", () => {
      this.handleReset();
      this.saveMessage.set("Settings reset by parent");
      setTimeout(() => this.saveMessage.set(""), 2000);
    });

    // Listen for load preset command
    const unsub3 = this.frameProps.on("load-preset", (preset: any) => {
      if (preset) {
        this.settings.set({
          appName: preset.appName || "Angular Micro-App",
          language: preset.language || "en",
          notifications: preset.notifications ?? true,
          theme: preset.theme || (this.theme() as "dark" | "light") || "light",
        });
        this.saveMessage.set(`Preset "${preset.name || "custom"}" loaded`);
        setTimeout(() => this.saveMessage.set(""), 2000);
      }
    });

    // Listen for data refresh request
    const unsub4 = this.frameProps.on("data-refresh", () => {
      const currentTheme = this.theme();
      if (currentTheme) {
        this.settings.update((s) => ({ ...s, theme: currentTheme }));
      }
      this.saveMessage.set("Data refreshed");
      setTimeout(() => this.saveMessage.set(""), 2000);
    });

    this.eventUnsubscribers.push(unsub1, unsub2, unsub3, unsub4);
  }

  handleSubmit() {
    this.isSaving.set(true);
    this.saveMessage.set("");

    try {
      this.saveMessage.set("Settings saved successfully!");

      this.frameProps.emit("settings-saved", {
        settings: this.settings(),
        timestamp: Date.now(),
      });

      setTimeout(() => {
        this.saveMessage.set("");
      }, 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      this.saveMessage.set("Error saving settings");

      this.frameProps.emit("error", {
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
      theme: (this.theme() as "dark" | "light") || "light",
    });

    this.saveMessage.set("Settings reset to defaults");

    this.frameProps.emit("settings-reset", {
      timestamp: Date.now(),
    });

    setTimeout(() => {
      this.saveMessage.set("");
    }, 3000);
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
    // Call parent callback to change theme
    this.props.changeTheme(value);
    // Update local settings (will be synced from parent via effect)
    this.settings.update((s) => ({ ...s, theme: value }));
  }

  get notifications(): boolean {
    return this.settings().notifications;
  }

  set notifications(value: boolean) {
    this.settings.update((s) => ({ ...s, notifications: value }));
  }
}
