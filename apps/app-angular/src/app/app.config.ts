import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { NavigationInterceptor } from './navigation.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      useFactory: (navigationInterceptor: NavigationInterceptor) => () => {
        navigationInterceptor.initialize();
      },
      deps: [NavigationInterceptor],
      multi: true,
    },
  ],
};
