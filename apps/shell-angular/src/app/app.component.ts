import { CommonModule } from "@angular/common";
import { Component, CUSTOM_ELEMENTS_SCHEMA, type OnInit } from "@angular/core";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { filter } from "rxjs/operators";

interface FrameConfig {
  baseUrl: string;
  name: string;
  port: number;
}

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent implements OnInit {
  activeApp: string = "";

  apps: FrameConfig[] = [
    { name: "angular", baseUrl: "http://localhost", port: 4200 },
    { name: "react", baseUrl: "http://localhost", port: 4201 },
    { name: "vue", baseUrl: "http://localhost", port: 4202 },
  ];

  // Props para Angular (Callbacks bidirecionais + Error handling)
  currentUser = {
    id: 1,
    name: "John Doe",
    role: "admin",
    email: "john@example.com",
  };

  // Props para Vue e Angular (Reatividade)
  currentTheme: "light" | "dark" = "light";

  // Props para React (Transferable Objects)
  metricsArrayBuffer!: ArrayBuffer;

  // Props para Solid (Batch Updates)
  chatMessages: any[] = [
    { id: 1, text: "Welcome to the chat!", timestamp: Date.now() - 5000 },
    {
      id: 2,
      text: "This is a demo of SolidJS batch updates",
      timestamp: Date.now() - 3000,
    },
  ];

  private frameElements = new Map<string, HTMLElement>();
  private isSyncing = false;

  // Callbacks para Angular
  handleAngularSuccess = (data: any) => {
    console.log("[Shell] Angular success callback received:", data);
  };

  handleAngularAction = (data: any) => {
    console.log("[Shell] Angular action callback received:", data);
  };

  // Callback assíncrono para React
  handleFetchData = (query: any): Promise<any> => {
    console.log("[Shell] Async function called from React with query:", query);

    // Simular chamada assíncrona
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: [
            { id: 1, value: Math.random() * 100 },
            { id: 2, value: Math.random() * 100 },
            { id: 3, value: Math.random() * 100 },
          ],
          query,
          timestamp: Date.now(),
        });
      }, 1000);
    });
  };

  constructor(private router: Router) {}

  ngOnInit() {
    // Criar ArrayBuffer para React (1000 floats)
    const buffer = new Float32Array(1000);
    for (let i = 0; i < 1000; i++) {
      buffer[i] = Math.random() * 100;
    }
    this.metricsArrayBuffer = buffer.buffer;

    // Listen to router navigation events
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateActiveApp(event.urlAfterRedirects);
      });

    // Set initial active app
    this.updateActiveApp(this.router.url);
  }

  getFrameUrl(appName: string): string {
    const app = this.apps.find((a) => a.name === appName);
    if (!app) return "";

    const basePath =
      appName === "vue"
        ? "/vue/"
        : appName === "react"
        ? "/react/"
        : "/angular/";

    return `${app.baseUrl}:${app.port}${basePath}`;
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === "light" ? "dark" : "light";
    console.log("[Shell] Theme toggled to:", this.currentTheme);
  }

  // Event handlers específicos de cada fragment

  onActionClicked(event: CustomEvent) {
    console.log("[Shell] Action clicked event from Angular:", event.detail);
  }

  onCounterChanged(event: CustomEvent) {
    console.log("[Shell] Counter changed event from Vue:", event.detail);
  }

  onDataLoaded(event: CustomEvent) {
    console.log("[Shell] Data loaded event from React:", event.detail);
  }

  onLargeData(event: CustomEvent) {
    const buffer = event.detail as ArrayBuffer;
    console.log(
      "[Shell] Received large data from React:",
      buffer.byteLength,
      "bytes"
    );

    // Processar ArrayBuffer recebido
    const float32 = new Float32Array(buffer);
    const stats = {
      length: float32.length,
      min: Math.min(...Array.from(float32)),
      max: Math.max(...Array.from(float32)),
      avg: Array.from(float32).reduce((a, b) => a + b, 0) / float32.length,
    };
    console.log("[Shell] Data stats:", stats);
  }

  onMessageSent(event: CustomEvent) {
    console.log("[Shell] Message sent event from Solid:", event.detail);

    // Adicionar mensagem à lista e atualizar prop (Solid receberá via watch handler)
    this.chatMessages = [...this.chatMessages, event.detail];
    console.log(
      "[Shell] Updated messages list, total:",
      this.chatMessages.length
    );
  }

  onFrameReady(event: Event) {
    const customEvent = event as CustomEvent;

    // Guard against null detail
    if (!customEvent.detail) {
      console.warn("[Shell] Received ready event with null detail, ignoring");
      return;
    }

    const { name } = customEvent.detail;
    if (!name) {
      console.warn("[Shell] Received ready event without name, ignoring");
      return;
    }

    console.log(
      `[Shell] Fragment '${name}' is ready. Active app: ${
        this.activeApp
      }, Will sync: ${name === this.activeApp}`
    );

    // Store reference to fragment-frame element
    const frameElement = event.target as HTMLElement;
    this.frameElements.set(name, frameElement);

    // Only sync route if this is the currently active app
    if (name === this.activeApp) {
      console.log(`[Shell] Frame '${name}' is ready, syncing current route`);
      this.syncRouteToFrame(name);
    } else {
      console.log(
        `[Shell] Frame '${name}' ready but not active, skipping sync`
      );
    }
  }

  onFrameNavigate(event: Event) {
    const customEvent = event as CustomEvent;
    const { path } = customEvent.detail;
    const frameName = (event.target as any).getAttribute("name");

    console.log(`[Shell] Fragment '${frameName}' navigated to:`, path);

    // Update browser URL when fragment-frame navigates
    const fullPath = `/${frameName}${path}`;

    console.log(
      `[Shell] Current route.url: ${
        this.router.url
      }, fullPath: ${fullPath}, will push: ${this.router.url !== fullPath}`
    );

    if (this.router.url !== fullPath) {
      console.log(`[Shell] Pushing to:`, fullPath);
      // Set flag to prevent sync loop
      this.isSyncing = true;
      this.router.navigateByUrl(fullPath).then(() => {
        // Reset flag after navigation completes
        setTimeout(() => {
          this.isSyncing = false;
        }, 100);
      });
    }
  }

  onFrameError(event: Event) {
    const customEvent = event as CustomEvent;
    const { name, error } = customEvent.detail;

    console.error(`[Shell] Error from ${name}:`, error);
  }

  private updateActiveApp(url: string) {
    console.log(
      `[Shell] updateActiveApp called with URL: ${url}, isSyncing: ${this.isSyncing}`
    );

    // Skip sync if we're in the middle of a programmatic navigation from frame
    if (this.isSyncing) {
      console.log(`[Shell] Skipping sync - navigation triggered by frame`);

      // Still update activeApp even when syncing
      const segments = url.split("/").filter((s) => s.length > 0);
      const firstSegment = segments[0] || "angular";
      const app = this.apps.find((a) => a.name === firstSegment);
      if (app) {
        this.activeApp = app.name;
      }
      return;
    }

    // Extract the first segment of the URL
    const segments = url.split("/").filter((s) => s.length > 0);
    const firstSegment = segments[0] || "angular";

    // Check if it matches any of our apps
    const app = this.apps.find((a) => a.name === firstSegment);

    if (app) {
      const previousActiveApp = this.activeApp;
      this.activeApp = app.name;

      console.log(
        `[Shell] Active app changed from '${previousActiveApp}' to '${this.activeApp}'`
      );

      // Don't sync here - wait for the frame to emit "ready" event
      // This ensures the SDK is initialized before we send route-change
    }
  }

  private syncRouteToFrame(appName: string) {
    const frameElement = this.frameElements.get(appName);

    if (!frameElement) {
      console.warn(
        `[Shell] Cannot sync route - no frame element found for '${appName}'`
      );
      return;
    }

    // Extract the path within the fragment-frame
    const fullPath = this.router.url;
    const fragmentPath = fullPath.replace(`/${appName}`, "") || "/";

    console.log(
      `[Shell] Syncing route to ${appName}: fullPath="${fullPath}", fragmentPath="${fragmentPath}"`
    );

    // Send navigation message to the fragment-frame using the correct emit method
    // This will be handled by the fragment's SDK
    (frameElement as any).emit("route-change", {
      path: fragmentPath,
      replace: false,
    });
  }
}
