import { CommonModule } from "@angular/common";
import { Component, effect } from "@angular/core";
import { RouterLink } from "@angular/router";
import { injectFrameProps } from "@zomme/frame-angular";
import { PageLayoutComponent } from "../../components/page-layout/page-layout.component";
import type { HomeFrameProps } from "../../models/frame-props";

@Component({
  imports: [CommonModule, RouterLink, PageLayoutComponent],
  selector: "app-home",
  standalone: true,
  styleUrl: "./home.component.css",
  templateUrl: "./home.component.html",
})
export class HomeComponent {
  private props = injectFrameProps<HomeFrameProps>();

  // Reactive data from parent
  protected theme = this.props.theme;
  protected base = this.props.base;
  protected apiUrl = this.props.apiUrl;

  constructor() {
    // Sync theme with body class
    effect(() => {
      const currentTheme = this.theme() || "light";
      document.body.classList.remove("light", "dark");
      document.body.classList.add(currentTheme);
    });
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
}
