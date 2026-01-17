// IMPORTANT: Import and register the fragment-frame Web Component BEFORE Angular imports
import "@zomme/fragment-frame";

import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { appConfig } from "./app/app.config";

bootstrapApplication(AppComponent, appConfig).catch(console.error);
