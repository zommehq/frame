# Angular Fragment App

Angular 18 micro-frontend application integrated with the Fragment Elements SDK.

## Features

- Angular 18 with standalone components
- Integrated with `@zomme/fragment-elements/sdk` for micro-frontend communication
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

The app integrates with the Fragment Elements SDK in `src/main.ts`:

1. **Initialize SDK** - Waits for parent app initialization via `frameSDK.initialize()`
2. **Access Props** - Receives props from parent via `frameSDK.props`
3. **Watch Properties** - Responds to property changes via `frameSDK.watch(['theme'], ...)`
4. **Listen to Events** - Handles route-change events
5. **Navigation Sync** - Notifies parent of route changes via `navigation.interceptor.ts` using `frameSDK.emit('navigate', { path })`

## Scripts

```bash
# Development server (runs on port 4200)
npm run dev

# Production build
npm run build

# Run tests
npm run test

# Lint
npm run lint
```

## Development

The dev server runs on port 4200 with CORS enabled for micro-frontend integration.

```bash
npm install
npm run dev
```

Visit `http://localhost:4200` to view the app standalone.

## Routes

- `/` - Home page with SDK config display and event triggers
- `/users` - Users management table
- `/settings` - Settings form

## SDK Usage

### Props Access

- Access parent props via `frameSDK.props`
- Receive callbacks and data from parent

### Navigation

- Automatically notifies parent on route changes via `frameSDK.emit('navigate', { path })`
- Syncs with parent app base path

### Events

- Watches `theme` property for changes via `frameSDK.watch(['theme'], ...)`
- Listens to `route-change` for external navigation
- Emits custom events to parent app via `frameSDK.emit()`

## Configuration

### TypeScript

Extends from `../../tsconfig.base.json` with Angular-specific settings.

### Angular CLI

Configured in `angular.json` with:

- Output path: `dist/`
- Port: 4200
- Code splitting and optimization enabled
- CORS headers for micro-frontend support

## Dependencies

- Angular 18.2.x
- RxJS 7.8.x
- Zone.js 0.14.x
- @zomme/fragment-elements (workspace package)
