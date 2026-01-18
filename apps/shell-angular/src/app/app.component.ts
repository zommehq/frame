import { CommonModule } from "@angular/common";
import { Component, CUSTOM_ELEMENTS_SCHEMA, effect, type OnInit } from "@angular/core";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { filter } from "rxjs/operators";

import { SettingsService } from "./services/settings.service";
import { TasksService } from "./services/tasks.service";

interface FrameConfig {
  baseUrl: string;
  name: string;
  port: number;
}

interface Task {
  completed: boolean;
  description: string;
  id: number;
  priority: "high" | "low" | "medium";
  title: string;
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

  // Properties synced from store
  currentUser: any;
  currentTheme: "dark" | "light" = "light";
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  filter: "active" | "all" | "completed" = "all";
  searchQuery = "";
  taskStats = { active: 0, completed: 0, total: 0 };

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
  private frameActions = new Map<string, any>();

  constructor(
    private router: Router,
    public tasksService: TasksService,
    public settingsService: SettingsService,
  ) {
    // Sync services to component properties
    effect(() => {
      this.currentTheme = this.settingsService.theme();
      this.currentUser = this.settingsService.user();
      this.tasks = this.tasksService.tasks();
      this.filteredTasks = this.tasksService.filteredTasks();
      this.filter = this.tasksService.filter();
      this.searchQuery = this.tasksService.searchQuery();
      this.taskStats = this.tasksService.taskStats();
    });
  }

  // Callbacks para Angular
  handleAngularSuccess = (data: any) => {};

  handleAngularAction = (data: any) => {};

  // Callback assíncrono para React
  handleFetchData = (query: any): Promise<any> => {
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

    const basePath = appName === "vue" ? "/vue/" : appName === "react" ? "/react/" : "/angular/";

    return `${app.baseUrl}:${app.port}${basePath}`;
  }

  // Theme management callback for frames
  handleChangeTheme = (theme: "dark" | "light"): void => {
    this.settingsService.setTheme(theme);
  };

  toggleTheme() {
    this.settingsService.toggleTheme();
  }

  // Event handlers específicos de cada frame

  onActionClicked(event: CustomEvent) {}

  onCounterChanged(event: CustomEvent) {}

  onDataLoaded(event: CustomEvent) {}

  onLargeData(event: CustomEvent) {
    const buffer = event.detail as ArrayBuffer;

    // Processar ArrayBuffer recebido
    const float32 = new Float32Array(buffer);
    const stats = {
      length: float32.length,
      min: Math.min(...Array.from(float32)),
      max: Math.max(...Array.from(float32)),
      avg: Array.from(float32).reduce((a, b) => a + b, 0) / float32.length,
    };
  }

  onMessageSent(event: CustomEvent) {
    // Adicionar mensagem à lista e atualizar prop (Solid receberá via watch handler)
    this.chatMessages = [...this.chatMessages, event.detail];
  }

  onFrameReady(event: Event) {
    const customEvent = event as CustomEvent;
    if (!customEvent.detail) return;

    const { name } = customEvent.detail;
    if (!name) return;

    const frameElement = event.target as any;
    this.frameElements.set(name, frameElement);

    // Apenas sincronizar rota
    if (name === this.activeApp) {
      this.syncRouteToFrame(name);
    }
  }

  onFrameNavigate(event: Event) {
    const customEvent = event as CustomEvent;
    const { path } = customEvent.detail;
    const frameName = (event.target as any).getAttribute("name");

    // Update browser URL when z-frame navigates
    const fullPath = `/${frameName}${path}`;

    if (this.isSyncing) {
      return;
    }

    if (this.router.url !== fullPath) {
      // Set flag to prevent sync loop
      this.isSyncing = true;
      this.router
        .navigateByUrl(fullPath)
        .then(() => {
          // Reset flag after navigation completes
          setTimeout(() => {
            this.isSyncing = false;
          }, 100);
        })
        .catch((error) => {
          this.isSyncing = false;
        });
    }
  }

  onFrameError(event: Event) {
    const customEvent = event as CustomEvent;
    const { name, error } = customEvent.detail;
  }

  onFrameRegister(event: Event) {
    const customEvent = event as CustomEvent;
    const frameName = (event.target as any).getAttribute("name");
    const functions = customEvent.detail;

    // Store functions for later use
    this.frameActions.set(frameName, functions);

    // Demonstrate immediate usage
    if (frameName === "angular" && functions.getStats) {
      const stats = functions.getStats();
    }
  }

  onFrameUnregister(event: Event) {
    const customEvent = event as CustomEvent;
    const frameName = (event.target as any).getAttribute("name");
    const { functions } = customEvent.detail;

    this.frameActions.delete(frameName);
  }

  private updateActiveApp(url: string) {
    // Skip sync if we're in the middle of a programmatic navigation from frame
    if (this.isSyncing) {
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

      // Don't sync here - wait for the frame to emit "ready" event
      // This ensures the SDK is initialized before we send route-change
    }
  }

  private syncRouteToFrame(appName: string) {
    const frameElement = this.frameElements.get(appName);

    if (!frameElement) {
      return;
    }

    // Extract the path within the z-frame
    const fullPath = this.router.url;
    const framePath = fullPath.replace(`/${appName}`, "") || "/";

    // Use emit method (camelCase methods require direct property access)
    (frameElement as any).emit("route-change", {
      path: framePath,
      replace: false,
    });
  }
}
