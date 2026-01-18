// IMPORTANT: Import and register the z-frame Web Component BEFORE Angular imports
import "@zomme/frame";

import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { appConfig } from "./app/app.config";

bootstrapApplication(AppComponent, appConfig).catch(console.error);
