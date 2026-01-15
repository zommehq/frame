import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Import and register the MicroApp Web Component from @micro-fe/fragment-elements
import '@micro-fe/fragment-elements';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
