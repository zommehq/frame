import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { microAppSDK } from '@shared/sdk';
import { filter } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NavigationInterceptor {
  constructor(private router: Router) {}

  initialize() {
    // Listen to Angular router NavigationEnd events
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const config = microAppSDK.getConfig();
        const fullPath = `${config.base}${event.urlAfterRedirects}`;

        // Notify parent app about navigation changes
        microAppSDK.navigate(fullPath, false);
      });
  }
}
