import { bootstrapApplication } from '@angular/platform-browser';
import { frameSDK } from '@micro-fe/fragment-elements/sdk';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

async function bootstrap() {
  try {
    // Initialize the fragment-frame SDK
    await frameSDK.initialize();

    // Listen to attribute changes
    frameSDK.on('attr:theme', (theme) => {
      console.log('Angular app: theme changed to', theme);
      // Apply theme changes to the app
      document.documentElement.setAttribute('data-theme', String(theme));
    });

    // Listen to custom events from parent
    frameSDK.on('route-change', (data) => {
      console.log('Angular app: route-change event received', data);
      // Handle route changes if needed
    });

    // Bootstrap Angular application after SDK initialization
    const appRef = await bootstrapApplication(AppComponent, appConfig);

    console.log('Angular fragment-frame initialized successfully');

    // Report any uncaught errors to parent
    window.addEventListener('error', (event) => {
      frameSDK.emit('error', {
        error: event.error?.message || String(event.error),
        source: 'window.error'
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      frameSDK.emit('error', {
        error: event.reason instanceof Error ? event.reason.message : String(event.reason),
        source: 'unhandledrejection'
      });
    });
  } catch (error) {
    console.error('Failed to bootstrap Angular app:', error);
    if (error instanceof Error) {
      frameSDK.emit('error', {
        error: error.message,
        source: 'bootstrap'
      });
    }
  }
}

bootstrap();
