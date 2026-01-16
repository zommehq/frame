# @zomme/fragment-frame-angular

Angular utilities for building micro-frontend applications with `@zomme/fragment-frame`.

## Installation

```bash
bun add @zomme/fragment-frame-angular
```

## Features

- 🔄 **Automatic Router Sync**: One-line setup for bidirectional routing between parent shell and child app
- 📡 **FrameSDKService**: Injectable service with RxJS observables for reactive programming
- 🎯 **Type-safe**: Full TypeScript support with generics for props
- 🧩 **FragmentFrameComponent**: Angular component for embedding child apps in shells

## Quick Start

### For Child Apps (Apps inside the shell)

The simplest way to setup routing synchronization:

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { frameSDK, setupRouterSync } from '@zomme/fragment-frame-angular';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

async function bootstrap() {
  const appRef = await bootstrapApplication(AppComponent, appConfig);
  const router = appRef.injector.get(Router);

  try {
    await frameSDK.initialize();
    const base = (frameSDK.props.base as string) || '/my-app/';

    // ✨ One line to sync routes with parent shell
    setupRouterSync(router, base);

    console.log('App initialized successfully');
  } catch (error) {
    console.warn('Running in standalone mode:', error);
  }
}

bootstrap();
```

That's it! Your app now:
- ✅ Receives route changes from the parent shell
- ✅ Notifies parent when user navigates internally
- ✅ Keeps browser URL in sync with the current view

### For Parent Shells (Host applications)

Use the `FragmentFrameComponent` to embed child apps:

```typescript
import { Component } from '@angular/core';
import { FragmentFrameComponent } from '@zomme/fragment-frame-angular';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [FragmentFrameComponent],
  template: `
    <fragment-frame
      name="child-app"
      [src]="'http://localhost:4200/child-app/'"
      [user]="currentUser"
      [theme]="theme"
      (ready)="onAppReady($event)"
      (navigate)="onAppNavigate($event)"
      (error)="onAppError($event)"
    />
  `
})
export class ShellComponent {
  currentUser = { id: 1, name: 'John Doe' };
  theme: 'light' | 'dark' = 'light';

  onAppReady(event: CustomEvent) {
    console.log('App ready:', event.detail);
  }

  onAppNavigate(event: CustomEvent) {
    const { path } = event.detail;
    // Update shell router based on child navigation
  }

  onAppError(event: CustomEvent) {
    console.error('App error:', event.detail);
  }
}
```

## API Reference

### `setupRouterSync(router, base)`

Standalone function for automatic router synchronization.

**Parameters:**
- `router: Router` - Angular Router instance
- `base: string` - Base path for the app (e.g., '/my-app/')

**Returns:** `() => void` - Cleanup function

**Example:**
```typescript
const cleanup = setupRouterSync(router, '/my-app/');

// Later, when unmounting:
cleanup();
```

### `FrameSDKService<T>`

Injectable service for using the Fragment Frame SDK with Angular's dependency injection.

**Use this when:** You need reactive props or event handling in components (not for router sync).

**Methods:**

#### `initialize(): Promise<void>`
Initialize the SDK and connect with parent shell.

#### `emit(event: string, data?: unknown): void`
Emit custom event to parent shell.

#### `on(event: string, handler: Function): () => void`
Listen to events from parent shell. Returns cleanup function.

#### `onAttr<K>(attrName: K, handler: Function): () => void`
Listen to attribute changes from parent. Updates `props$` observable automatically.

#### `cleanup(): void`
Cleanup SDK resources.

**Properties:**
- `props$: Observable<T>` - Stream of props from parent
- `isReady$: Observable<boolean>` - Stream of SDK ready state
- `sdkAvailable$: Observable<boolean>` - Stream of SDK availability
- `props: T` - Current props (synchronous)
- `isReady: boolean` - Current ready state (synchronous)
- `sdkAvailable: boolean` - Current SDK availability (synchronous)

**Example:**
```typescript
import { Component, OnInit, inject } from '@angular/core';
import { FrameSDKService } from '@zomme/fragment-frame-angular';

interface Props {
  user: { name: string };
  theme: 'light' | 'dark';
}

@Component({
  selector: 'app-root',
  template: `
    <div>
      <p>User: {{ (sdk.props$ | async)?.user?.name }}</p>
      <p>Theme: {{ (sdk.props$ | async)?.theme }}</p>
    </div>
  `
})
export class AppComponent implements OnInit {
  sdk = inject(FrameSDKService<Props>);

  async ngOnInit() {
    await this.sdk.initialize();

    // Listen to custom events
    this.sdk.on('custom-event', (data) => {
      console.log('Received:', data);
    });

    // Listen to attribute changes
    this.sdk.onAttr('theme', (theme) => {
      console.log('Theme changed:', theme);
    });
  }

  ngOnDestroy() {
    this.sdk.cleanup();
  }
}
```

**Note:** For router synchronization, use the standalone `setupRouterSync()` function in your bootstrap (see above).

### `FragmentFrameComponent`

Angular component for embedding micro-frontend apps in parent shells.

**Inputs:**
- `name: string` - Unique identifier for the frame
- `src: string` - URL of the child app
- `[attr.*]: any` - Any attribute passed as prop to child app

**Outputs:**
- `(ready)` - Emitted when child app is ready
- `(navigate)` - Emitted when child navigates internally
- `(error)` - Emitted when child encounters an error
- `(*)` - Any custom event emitted by child app

**Example:**
```typescript
<fragment-frame
  name="analytics"
  [src]="'http://localhost:4201/analytics/'"
  [user]="currentUser"
  [permissions]="userPermissions"
  [onDataFetch]="fetchDataCallback"
  (ready)="onReady($event)"
  (navigate)="onNavigate($event)"
  (data-loaded)="onDataLoaded($event)"
/>
```

## How Router Sync Works

The `setupRouterSync` function establishes bidirectional communication:

### Parent → Child (Route Changes)
1. Parent shell navigates to `/my-app/settings`
2. Shell extracts child path: `/settings`
3. Shell emits `route-change` event with `{ path: '/settings' }`
4. Child app receives event and navigates Angular router to `/settings`

### Child → Parent (User Navigation)
1. User clicks link in child app to `/settings`
2. Angular Router navigates to `/settings`
3. `setupRouterSync` detects `NavigationEnd` event
4. Child emits `navigate` event with `{ path: '/settings' }`
5. Parent shell updates browser URL to `/my-app/settings`

### Initial Navigation
The first `NavigationEnd` event is automatically skipped to prevent loops during initial load.

## Complete Example: Child App

```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { frameSDK, setupRouterSync } from '@zomme/fragment-frame-angular';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

async function bootstrap() {
  const appRef = await bootstrapApplication(AppComponent, appConfig);
  const router = appRef.injector.get(Router);

  let base = '/analytics/';

  try {
    await frameSDK.initialize();
    base = (frameSDK.props.base as string) || '/analytics/';

    // Setup router sync
    setupRouterSync(router, base);

    // Listen to custom events
    frameSDK.on('refresh-data', () => {
      console.log('Parent requested data refresh');
    });

    // Report errors to parent
    window.addEventListener('error', (event) => {
      frameSDK.emit('error', {
        error: event.error?.message || String(event.error),
        source: 'window.error',
      });
    });

    console.log('Analytics app initialized');
  } catch (error) {
    console.warn('Running standalone:', error);
  }
}

bootstrap();
```

```typescript
// app/app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />'
})
export class AppComponent {}
```

```typescript
// app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home').then(m => m.HomeComponent) },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard').then(m => m.DashboardComponent) },
  { path: 'reports', loadComponent: () => import('./pages/reports').then(m => m.ReportsComponent) },
];
```

## Complete Example: Parent Shell

```typescript
// app/app.component.ts
import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { FragmentFrameComponent } from '@zomme/fragment-frame-angular';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, FragmentFrameComponent],
  template: `
    <nav>
      <a routerLink="/analytics">Analytics</a>
      <a routerLink="/users">Users</a>
    </nav>

    <main>
      <router-outlet />
    </main>
  `
})
export class ShellComponent {
  constructor(private router: Router) {
    // Listen to router navigation
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateActiveApp(event.url);
      }
    });
  }

  private updateActiveApp(url: string) {
    // Extract first segment to determine active app
    const segments = url.split('/').filter(Boolean);
    const appName = segments[0] || 'analytics';

    // Update UI, load appropriate fragment-frame, etc.
  }
}
```

```typescript
// app/pages/analytics.component.ts
import { Component } from '@angular/core';
import { FragmentFrameComponent } from '@zomme/fragment-frame-angular';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [FragmentFrameComponent],
  template: `
    <fragment-frame
      name="analytics"
      [src]="'http://localhost:4201/analytics/'"
      [user]="currentUser"
      [theme]="theme"
      (ready)="onReady($event)"
      (navigate)="onNavigate($event)"
    />
  `
})
export class AnalyticsComponent {
  currentUser = { id: 1, name: 'John Doe' };
  theme: 'light' | 'dark' = 'light';

  onReady(event: CustomEvent) {
    console.log('Analytics app ready');

    // Sync initial route
    const frame = event.target as any;
    const currentPath = this.extractPath(window.location.pathname);
    frame.emit('route-change', { path: currentPath });
  }

  onNavigate(event: CustomEvent) {
    const { path } = event.detail;
    // Update shell router
    this.router.navigateByUrl(`/analytics${path}`);
  }

  private extractPath(fullPath: string): string {
    return fullPath.replace('/analytics', '') || '/';
  }
}
```

## TypeScript Configuration

Make sure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "types": ["@angular/core", "@angular/router"]
  }
}
```

## Best Practices

1. **Always use `setupRouterSync`** - Don't manually implement router synchronization
2. **Handle standalone mode** - Wrap SDK initialization in try-catch for standalone testing
3. **Cleanup on unmount** - Store and call cleanup functions when components unmount
4. **Type your props** - Use generics: `FrameSDKService<MyProps>`
5. **Use observables** - Leverage `props$` and `isReady$` for reactive UIs

## Troubleshooting

### Router sync not working
- Ensure `setupRouterSync` is called AFTER `frameSDK.initialize()`
- Check that the `base` path matches your app's route configuration
- Verify fragment-frame element is emitting events in parent shell

### Props not updating
- Use `props$` observable instead of `props` getter for reactive updates
- Make sure parent is setting attributes on the fragment-frame element

### TypeScript errors
- Install peer dependencies: `@angular/core`, `@angular/router`, `rxjs`
- Check `tsconfig.json` has correct `types` configuration

## Related Packages

- [`@zomme/fragment-frame`](../fragment-frame) - Core framework-agnostic package
- [`@zomme/fragment-frame-react`](../fragment-frame-react) - React utilities
- [`@zomme/fragment-frame-vue`](../fragment-frame-vue) - Vue utilities

## License

MIT
