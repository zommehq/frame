import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";

@Component({
  selector: "app-page-layout",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./page-layout.component.html",
  styleUrls: ["./page-layout.component.css"],
})
export class PageLayoutComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
}
