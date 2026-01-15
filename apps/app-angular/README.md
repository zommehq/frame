# Angular Micro-App

Angular 18 micro-frontend application integrated with the shared micro-app SDK.

## Features

- Angular 18 with standalone components
- Integrated with `@shared/core` SDK for micro-frontend communication
- Automatic navigation sync with parent app
- Theme and attribute change listeners
- Sample pages: Home, Users, Settings
- Lazy-loaded routes for optimal performance

## Project Structure

```
apps/app-angular/
├── src/
│   ├── app/
│   │   ├── pages/
│   │   │   ├── home/
│   │   │   │   └── home.component.ts
│   │   │   ├── users/
│   │   │   │   └── users.component.ts
│   │   │   └── settings/
│   │   │       └── settings.component.ts
│   │   ├── app.component.ts          # Root component with navigation
│   │   ├── app.config.ts             # Application configuration
│   │   ├── app.routes.ts             # Route definitions
│   │   └── navigation.interceptor.ts # Navigation sync with parent
│   ├── main.ts                       # Bootstrap with SDK integration
│   └── index.html                    # HTML template
├── angular.json                      # Angular CLI configuration
├── package.json
├── tsconfig.json
└── README.md
```

## SDK Integration

The app integrates with the micro-app SDK in `src/main.ts`:

1. **Initialize SDK** - Waits for parent app initialization
2. **Register Methods** - Exposes `refreshData` method to parent
3. **Listen to Attributes** - Responds to theme changes
4. **Listen to Events** - Handles route-change events
5. **Navigation Sync** - Notifies parent of route changes via `navigation.interceptor.ts`

## Scripts

```bash
# Development server (runs on port 4201)
npm run dev

# Production build
npm run build

# Run tests
npm run test

# Lint
npm run lint
```

## Development

The dev server runs on port 4201 with CORS enabled for micro-frontend integration.

```bash
npm install
npm run dev
```

Visit `http://localhost:4201` to view the app standalone.

## Routes

- `/` - Home page with SDK config display and event triggers
- `/users` - Users management table
- `/settings` - Settings form

## SDK Methods

### Exposed Methods
- `refreshData()` - Called by parent to refresh app data

### Navigation
- Automatically notifies parent on route changes
- Syncs with parent app base path

### Events
- Listens to `attribute:theme` for theme changes
- Listens to `route-change` for external navigation
- Emits custom events to parent app

## Configuration

### TypeScript
Extends from `../../tsconfig.base.json` with Angular-specific settings.

### Angular CLI
Configured in `angular.json` with:
- Output path: `dist/app-angular`
- Port: 4201
- Code splitting and optimization enabled
- CORS headers for micro-frontend support

## Dependencies

- Angular 18.2.x
- RxJS 7.8.x
- Zone.js 0.14.x
- @shared/core (workspace package)
