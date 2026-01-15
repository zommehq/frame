import { bootstrapApplication } from '@angular/platform-browser';
import { microAppSDK } from '@shared/sdk';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

async function bootstrap() {
  try {
    // Initialize the fragment-frame SDK
    await microAppSDK.initialize();

    // Register methods that can be called from the parent app
    microAppSDK.registerMethod('refreshData', async () => {
      console.log('Angular app: refreshData called');
      // Implement data refresh logic here
      return { success: true };
    });

    // Listen to attribute changes
    microAppSDK.on('attribute:theme', (theme) => {
      console.log('Angular app: theme changed to', theme);
      // Apply theme changes to the app
      document.documentElement.setAttribute('data-theme', String(theme));
    });

    // Listen to custom events from parent
    microAppSDK.on('route-change', (data) => {
      console.log('Angular app: route-change event received', data);
      // Handle route changes if needed
    });

    // Bootstrap Angular application after SDK initialization
    const appRef = await bootstrapApplication(AppComponent, appConfig);

    console.log('Angular fragment-frame initialized successfully');

    // Report any uncaught errors to parent
    window.addEventListener('error', (event) => {
      microAppSDK.reportError(event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      microAppSDK.reportError(new Error(event.reason));
    });
  } catch (error) {
    console.error('Failed to bootstrap Angular app:', error);
    if (error instanceof Error) {
      microAppSDK.reportError(error);
    }
  }
}

bootstrap();
