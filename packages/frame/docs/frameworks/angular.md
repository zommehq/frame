# Angular Integration

Frame works with Angular applications.

## Parent Application (Angular)

### Enable Custom Elements

```typescript
// app.config.ts
import { ApplicationConfig, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
  ],
};

// app.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-root',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `...`,
})
export class AppComponent {}
```

### Basic Usage

```typescript
import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@zomme/frame';

@Component({
  selector: 'app-root',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <z-frame
      name="user-app"
      src="http://localhost:3001"
      base="/users"
      [attr.theme]="theme"
    ></z-frame>
  `,
})
export class AppComponent {
  theme = 'dark';
}
```

### Using the Angular Package

The `@zomme/frame-angular` package provides Angular-specific components and services for easier integration.

#### Installation

```bash
npm install @zomme/frame-angular
```

#### FrameComponent

A standalone component that wraps the `z-frame` custom element with Angular bindings.

```typescript
import { Component } from '@angular/core';
import { FrameComponent } from '@zomme/frame-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FrameComponent],
  template: `
    <z-frame
      name="user-app"
      src="http://localhost:3001"
      base="/users"
      [props]="{ theme: 'dark', apiUrl: '/api' }"
    ></z-frame>
  `,
})
export class AppComponent {
  // Component logic
}
```

#### Component Wrapper

```typescript
import { Component, Input, ViewChild, ElementRef, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import type { Frame } from '@zomme/frame';

@Component({
  selector: 'app-frame',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: '<z-frame #frame [attr.name]="name" [attr.src]="src"></z-frame>',
})
export class FrameWrapperComponent implements AfterViewInit {
  @Input() name!: string;
  @Input() src!: string;
  @Input() apiUrl?: string;
  @Input() theme?: string;

  @ViewChild('frame') frameRef!: ElementRef<Frame>;

  ngAfterViewInit() {
    const frame = this.frameRef.nativeElement;
    if (this.apiUrl) frame.apiUrl = this.apiUrl;
    if (this.theme) frame.theme = this.theme;
  }
}
```

## Frame Application (Angular)

### Using FrameSDKService

The `@zomme/frame-angular` package provides `FrameSDKService` for reactive integration with the Frame SDK.

#### Service Features

```typescript
import { Component, OnInit } from '@angular/core';
import { FrameSDKService } from '@zomme/frame-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <div [attr.data-theme]="theme">
      @if (frameSDK.isReady$ | async) {
        <h1>Frame: {{ (frameSDK.props$ | async)?.name }}</h1>
        <p>Theme: {{ theme }}</p>
      }
    </div>
  `,
})
export class AppComponent implements OnInit {
  theme = 'light';

  constructor(public frameSDK: FrameSDKService) {}

  ngOnInit() {
    // Subscribe to props changes
    this.frameSDK.props$.subscribe(props => {
      console.log('Props updated:', props);
    });

    // Listen to specific attribute changes
    this.frameSDK.onAttr('theme', (newTheme) => {
      this.theme = newTheme;
    });

    // Listen to custom events
    this.frameSDK.on('user:login', (data) => {
      console.log('User logged in:', data);
    });

    // Emit events to parent
    this.frameSDK.emit('frame:ready', { version: '1.0.0' });
  }
}
```

#### Available Observables

- `props$`: Observable of all frame properties
- `isReady$`: Observable indicating SDK initialization status
- `sdkAvailable$`: Observable indicating if SDK is available

#### Available Methods

- `initialize()`: Initialize the SDK (called automatically)
- `emit(event, data)`: Emit events to parent application
- `on(event, handler)`: Listen to events from parent
- `onAttr(attribute, handler)`: Listen to specific attribute changes
- `cleanup()`: Clean up subscriptions (called automatically on destroy)

### Router Synchronization

The `setupRouterSync` utility provides bidirectional route synchronization between the parent and frame applications.

```typescript
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FrameSDKService, setupRouterSync } from '@zomme/frame-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  template: '<router-outlet></router-outlet>',
})
export class AppComponent {
  constructor(
    private router: Router,
    private frameSDK: FrameSDKService
  ) {}

  ngOnInit() {
    // Wait for SDK to initialize
    this.frameSDK.initialize().then(() => {
      // Setup bidirectional route sync
      setupRouterSync(this.router);
    });
  }
}
```

The `setupRouterSync` function:
- Syncs parent route changes to frame router
- Syncs frame route changes to parent router
- Handles cleanup automatically
- Preserves query parameters and frames

### Bootstrap with Standalone API

Modern Angular applications should use the standalone API with `bootstrapApplication`:

```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { FrameSDKService } from '@zomme/frame-angular';

async function bootstrap() {
  const frameSDK = new FrameSDKService();
  await frameSDK.initialize();

  bootstrapApplication(AppComponent, {
    providers: [
      provideRouter(routes),
      { provide: FrameSDKService, useValue: frameSDK },
    ],
  }).catch((err) => console.error(err));
}

bootstrap();
```

### Basic Setup (Module-based - Legacy)

For applications still using NgModules:

```typescript
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { frameSDK } from '@zomme/frame/sdk';

frameSDK.initialize().then(() => {
  platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch((err) => console.error(err));
});
```

```typescript
import { Component, OnInit } from '@angular/core';
import { frameSDK } from '@zomme/frame/sdk';

@Component({
  selector: 'app-root',
  template: `
    <div [attr.data-theme]="config.theme">
      <h1>Frame: {{ config.name }}</h1>
    </div>
  `,
})
export class AppComponent implements OnInit {
  config = frameSDK.props;
  private unwatch?: () => void;

  ngOnInit() {
    this.unwatch = frameSDK.watch(['theme'], (changes) => {
      if ('theme' in changes && changes.theme) {
        this.config = { ...frameSDK.props };
      }
    });
  }

  ngOnDestroy() {
    this.unwatch?.();
  }
}
```
