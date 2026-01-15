import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface MicroAppConfig {
  baseUrl: string;
  name: string;
  port: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="app-shell">
      <header class="header">
        <h1>Micro Frontend App Shell</h1>
        <nav class="nav">
          <a
            *ngFor="let app of apps"
            [routerLink]="['/' + app.name]"
            routerLinkActive="active"
            class="nav-link"
          >
            {{ app.name | titlecase }}
          </a>
        </nav>
      </header>

      <main class="main">
        <fragment-frame
          *ngIf="activeApp === 'angular'"
          name="angular"
          [url]="getMicroAppUrl('angular')"
          (ready)="onMicroAppReady($event)"
          (navigate)="onMicroAppNavigate($event)"
          (error)="onMicroAppError($event)"
        ></fragment-frame>

        <fragment-frame
          *ngIf="activeApp === 'vue'"
          name="vue"
          [url]="getMicroAppUrl('vue')"
          (ready)="onMicroAppReady($event)"
          (navigate)="onMicroAppNavigate($event)"
          (error)="onMicroAppError($event)"
        ></fragment-frame>

        <fragment-frame
          *ngIf="activeApp === 'react'"
          name="react"
          [url]="getMicroAppUrl('react')"
          (ready)="onMicroAppReady($event)"
          (navigate)="onMicroAppNavigate($event)"
          (error)="onMicroAppError($event)"
        ></fragment-frame>

        <fragment-frame
          *ngIf="activeApp === 'solid'"
          name="solid"
          [url]="getMicroAppUrl('solid')"
          (ready)="onMicroAppReady($event)"
          (navigate)="onMicroAppNavigate($event)"
          (error)="onMicroAppError($event)"
        ></fragment-frame>
      </main>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }

    .header {
      background: #1976d2;
      color: white;
      padding: 1rem 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .header h1 {
      margin: 0 0 1rem 0;
      font-size: 1.5rem;
    }

    .nav {
      display: flex;
      gap: 1rem;
    }

    .nav-link {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .nav-link:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .nav-link.active {
      background-color: rgba(255, 255, 255, 0.2);
      font-weight: bold;
    }

    .main {
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    fragment-frame {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class AppComponent implements OnInit {
  activeApp: string = '';

  apps: MicroAppConfig[] = [
    { name: 'angular', baseUrl: 'http://localhost', port: 4201 },
    { name: 'vue', baseUrl: 'http://localhost', port: 4202 },
    { name: 'react', baseUrl: 'http://localhost', port: 4203 },
    { name: 'solid', baseUrl: 'http://localhost', port: 4204 }
  ];

  private microAppElements = new Map<string, HTMLElement>();

  constructor(private router: Router) {}

  ngOnInit() {
    // Listen to router navigation events
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateActiveApp(event.urlAfterRedirects);
      });

    // Set initial active app
    this.updateActiveApp(this.router.url);
  }

  getMicroAppUrl(appName: string): string {
    const app = this.apps.find(a => a.name === appName);
    return app ? `${app.baseUrl}:${app.port}` : '';
  }

  onMicroAppReady(event: Event) {
    const customEvent = event as CustomEvent;
    const { name } = customEvent.detail;

    console.log(`Micro-app ${name} is ready`);

    // Store reference to fragment-frame element
    const element = event.target as HTMLElement;
    this.microAppElements.set(name, element);

    // Sync current route to the fragment-frame
    this.syncRouteToMicroApp(name);
  }

  onMicroAppNavigate(event: Event) {
    const customEvent = event as CustomEvent;
    const { name, path } = customEvent.detail;

    console.log(`Navigation from ${name}: ${path}`);

    // Update browser URL when fragment-frame navigates
    const newUrl = `/${name}${path}`;

    // Only navigate if the URL is different
    if (this.router.url !== newUrl) {
      this.router.navigateByUrl(newUrl);
    }
  }

  onMicroAppError(event: Event) {
    const customEvent = event as CustomEvent;
    const { name, error } = customEvent.detail;

    console.error(`Error from ${name}:`, error);

    // You could show a user-friendly error message here
    alert(`Error loading ${name} fragment-frame: ${error}`);
  }

  private updateActiveApp(url: string) {
    // Extract the first segment of the URL
    const segments = url.split('/').filter(s => s.length > 0);
    const firstSegment = segments[0] || 'angular';

    // Check if it matches any of our apps
    const app = this.apps.find(a => a.name === firstSegment);

    if (app) {
      this.activeApp = app.name;

      // Sync route to the newly activated fragment-frame after a short delay
      // to ensure the element is rendered
      setTimeout(() => {
        this.syncRouteToMicroApp(app.name);
      }, 100);
    }
  }

  private syncRouteToMicroApp(appName: string) {
    const element = this.microAppElements.get(appName);

    if (!element) {
      return;
    }

    // Extract the path within the fragment-frame
    const currentUrl = this.router.url;
    const appPath = currentUrl.replace(`/${appName}`, '') || '/';

    // Send navigation message to the fragment-frame
    const iframe = element.querySelector('iframe');

    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'navigate',
        path: appPath
      }, '*');
    }
  }
}
