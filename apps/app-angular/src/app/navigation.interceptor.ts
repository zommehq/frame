import { Injectable } from "@angular/core";
import { NavigationEnd, type Router } from "@angular/router";
import { frameSDK } from "@zomme/fragment-frame-angular";
import { filter } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class NavigationInterceptor {
  constructor(private router: Router) {}

  initialize() {
    // Listen to Angular router NavigationEnd events
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Notify parent app about navigation changes (just the local path)
        frameSDK.emit("navigate", { path: event.urlAfterRedirects });
      });
  }
}
