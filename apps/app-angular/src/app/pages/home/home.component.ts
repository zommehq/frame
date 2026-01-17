import { CommonModule } from "@angular/common";
import { Component, effect, inject, signal, VERSION } from "@angular/core";
import { RouterLink } from "@angular/router";
import { FramePropsService, injectFrameProps } from "@zomme/fragment-frame-angular";
import { PageLayoutComponent } from "../../components/page-layout/page-layout.component";
import type { HomeFragmentProps } from "../../models/fragment-props";

@Component({
  imports: [CommonModule, RouterLink, PageLayoutComponent],
  selector: "app-home",
  standalone: true,
  styleUrl: "./home.component.css",
  templateUrl: "./home.component.html",
})
export class HomeComponent {
  private frameProps = inject(FramePropsService);
  private props = injectFrameProps<HomeFragmentProps>();

  // Reactive data from parent
  protected theme = this.props.theme;
  protected base = this.props.base;
  protected apiUrl = this.props.apiUrl;

  // Local state
  angularVersion = VERSION.full;
  saveMessage = signal("");

  constructor() {
    // Sync theme with body class
    effect(() => {
      const currentTheme = this.theme() || "light";
      document.body.classList.remove("light", "dark");
      document.body.classList.add(currentTheme);
    });
  }

  get basePath(): string {
    return this.base() || "/";
  }

  get apiUrlValue(): string {
    return this.apiUrl() || "Not configured";
  }

  get propsString(): string {
    return JSON.stringify(
      {
        apiUrl: this.apiUrl(),
        base: this.base(),
        theme: this.theme(),
      },
      null,
      2,
    );
  }

  isErrorMessage(): boolean {
    return this.saveMessage().includes("Error");
  }

  testThemeToggle() {
    const newTheme = this.theme() === "light" ? "dark" : "light";
    this.frameProps.emit("change-theme", { theme: newTheme });
  }

  async triggerActionCallback() {
    try {
      await this.props.actionCallback({
        component: "Home",
        source: "callback-demo",
        timestamp: Date.now(),
        type: "test-action",
      });

      this.saveMessage.set("Action callback triggered!");
    } catch {
      this.saveMessage.set("No action callback provided");
    }

    setTimeout(() => {
      this.saveMessage.set("");
    }, 2000);
  }
}
