import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface FrameConfig {
  baseUrl: string;
  name: string;
  port: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  activeApp: string = '';

  apps: FrameConfig[] = [
    { name: 'angular', baseUrl: 'http://localhost', port: 4201 },
    { name: 'vue', baseUrl: 'http://localhost', port: 4202 },
    { name: 'react', baseUrl: 'http://localhost', port: 4203 },
    { name: 'solid', baseUrl: 'http://localhost', port: 4204 }
  ];

  // Props para Angular (Callbacks bidirecionais + Error handling)
  currentUser = { id: 1, name: 'John Doe', role: 'admin', email: 'john@example.com' };

  // Props para Vue e Angular (Reatividade)
  currentTheme: 'light' | 'dark' = 'light';

  // Props para React (Transferable Objects)
  metricsArrayBuffer!: ArrayBuffer;

  // Props para Solid (Batch Updates)
  chatMessages: any[] = [
    { id: 1, text: 'Welcome to the chat!', timestamp: Date.now() - 5000 },
    { id: 2, text: 'This is a demo of SolidJS batch updates', timestamp: Date.now() - 3000 }
  ];

  private frameElements = new Map<string, HTMLElement>();

  // Callbacks para Angular
  handleAngularSuccess = (data: any) => {
    console.log('[Shell] Angular success callback received:', data);
  };

  handleAngularAction = (data: any) => {
    console.log('[Shell] Angular action callback received:', data);
  };

  // Callback assíncrono para React
  handleFetchData = async (query: any): Promise<any> => {
    console.log('[Shell] Async function called from React with query:', query);

    // Simular chamada assíncrona
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: [
            { id: 1, value: Math.random() * 100 },
            { id: 2, value: Math.random() * 100 },
            { id: 3, value: Math.random() * 100 }
          ],
          query,
          timestamp: Date.now()
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
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateActiveApp(event.urlAfterRedirects);
      });

    // Set initial active app
    this.updateActiveApp(this.router.url);
  }

  getFrameUrl(appName: string): string {
    const app = this.apps.find(a => a.name === appName);
    return app ? `${app.baseUrl}:${app.port}` : '';
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    console.log('[Shell] Theme toggled to:', this.currentTheme);
  }

  // Event handlers específicos de cada fragment

  onActionClicked(event: CustomEvent) {
    console.log('[Shell] Action clicked event from Angular:', event.detail);
  }

  onCounterChanged(event: CustomEvent) {
    console.log('[Shell] Counter changed event from Vue:', event.detail);
  }

  onDataLoaded(event: CustomEvent) {
    console.log('[Shell] Data loaded event from React:', event.detail);
  }

  onLargeData(event: CustomEvent) {
    const buffer = event.detail as ArrayBuffer;
    console.log('[Shell] Received large data from React:', buffer.byteLength, 'bytes');

    // Processar ArrayBuffer recebido
    const float32 = new Float32Array(buffer);
    const stats = {
      length: float32.length,
      min: Math.min(...Array.from(float32)),
      max: Math.max(...Array.from(float32)),
      avg: Array.from(float32).reduce((a, b) => a + b, 0) / float32.length
    };
    console.log('[Shell] Data stats:', stats);
  }

  onMessageSent(event: CustomEvent) {
    console.log('[Shell] Message sent event from Solid:', event.detail);

    // Adicionar mensagem à lista e atualizar prop (Solid receberá via attr:messages)
    this.chatMessages = [...this.chatMessages, event.detail];
    console.log('[Shell] Updated messages list, total:', this.chatMessages.length);
  }

  onFrameReady(event: Event) {
    const customEvent = event as CustomEvent;
    const { name } = customEvent.detail;

    console.log(`[Shell] Fragment ${name} is ready`);

    // Store reference to fragment-frame element
    const element = event.target as HTMLElement;
    this.frameElements.set(name, element);

    // Sync current route to the fragment-frame
    this.syncRouteToFrame(name);
  }

  onFrameNavigate(event: Event) {
    const customEvent = event as CustomEvent;
    const { name, path } = customEvent.detail;

    console.log(`[Shell] Navigation from ${name}: ${path}`);

    // Update browser URL when fragment-frame navigates
    const newUrl = `/${name}${path}`;

    // Only navigate if the URL is different
    if (this.router.url !== newUrl) {
      this.router.navigateByUrl(newUrl);
    }
  }

  onFrameError(event: Event) {
    const customEvent = event as CustomEvent;
    const { name, error } = customEvent.detail;

    console.error(`[Shell] Error from ${name}:`, error);
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
        this.syncRouteToFrame(app.name);
      }, 100);
    }
  }

  private syncRouteToFrame(appName: string) {
    const element = this.frameElements.get(appName);

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
