import { CommonModule } from "@angular/common";
import { Component, effect, type OnDestroy, type OnInit, signal, VERSION } from "@angular/core";
import { RouterLink } from "@angular/router";
import { frameSDK } from "@zomme/fragment-frame-angular";
import { PageLayoutComponent } from "../../components/page-layout/page-layout.component";

@Component({
  imports: [CommonModule, RouterLink, PageLayoutComponent],
  selector: "app-home",
  standalone: true,
  styleUrl: "./home.component.css",
  templateUrl: "./home.component.html",
})
export class HomeComponent implements OnInit, OnDestroy {
  angularVersion = VERSION.full;
  apiUrl: string;
  basePath: string;
  props: Record<string, any> = {};
  saveMessage = signal("");
  theme = signal<"dark" | "light">("light");
  private unwatchProps?: () => void;

  constructor() {
    const props = (frameSDK.props || {}) as any;
    this.props = props;
    this.basePath = props.base || "/";
    this.apiUrl = props.apiUrl || "Not configured";

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

      const props = (frameSDK.props ?? {}) as {
        theme?: "dark" | "light";
      };

      if (props.theme) {
        this.theme.set(props.theme);
      }

      // Watch for theme changes with modern API
      this.unwatchProps = frameSDK.watch(["theme"], (changes) => {
        if ("theme" in changes && changes.theme) {
          const [newTheme] = changes.theme;
          this.theme.set(newTheme as "dark" | "light");

          frameSDK.emit("theme-changed", {
            source: "watch-listener",
            theme: newTheme,
            timestamp: Date.now(),
          });
        }
      });
    } catch (error) {
      console.error("Failed to initialize SDK:", error);
    }
  }

  ngOnDestroy() {
    this.unwatchProps?.();
  }

  get propsString(): string {
    return JSON.stringify(this.props, null, 2);
  }

  isErrorMessage(): boolean {
    return this.saveMessage().includes("Error");
  }

  testThemeToggle() {
    const newTheme = this.theme() === "light" ? "dark" : "light";
    frameSDK.emit("change-theme", { theme: newTheme });
  }

  triggerActionCallback() {
    const props = frameSDK.props as {
      actionCallback?: (data: any) => void;
    };

    if (typeof props.actionCallback === "function") {
      props.actionCallback({
        component: "Home",
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
}
