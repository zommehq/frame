import { CommonModule } from "@angular/common";
import { Component, VERSION } from "@angular/core";
import { frameSDK } from "@zomme/fragment-frame-angular";
import { PageLayoutComponent } from "../../components/page-layout/page-layout.component";

@Component({
  imports: [CommonModule, PageLayoutComponent],
  selector: "app-about",
  standalone: true,
  styleUrls: ["./about.component.css"],
  templateUrl: "./about.component.html",
})
export class AboutComponent {
  angularVersion = VERSION.full;
  basePath: string;
  apiUrl: string;

  constructor() {
    const props = (frameSDK.props || {}) as any;
    this.basePath = props.base || "/";
    this.apiUrl = props.apiUrl || "Not configured";
  }
}
