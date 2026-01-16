import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { frameSDK } from "@zomme/fragment-frame-angular";
import { PageLayoutComponent } from "../../components/page-layout/page-layout.component";

@Component({
  selector: "app-home",
  standalone: true,
  imports: [CommonModule, RouterLink, PageLayoutComponent],
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.css",
})
export class HomeComponent {
  props: Record<string, any> = {};

  constructor() {
    this.props = frameSDK.props;
  }

  handleEmitEvent() {
    frameSDK.emit("custom-event", {
      message: "Hello from Angular Task Dashboard!",
      timestamp: new Date().toISOString(),
    });
    console.log("Custom event emitted from angular app");
  }

  get propsString(): string {
    return JSON.stringify(this.props, null, 2);
  }
}
