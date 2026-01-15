# SolidJS Micro App

A SolidJS-based micro-frontend application that integrates with the parent application using the Micro App SDK.

## Features

- Built with SolidJS and TypeScript
- Client-side routing with @solidjs/router
- SDK integration for parent-child communication
- Theme and configuration support
- Custom event emission and handling
- Method registration for parent calls

## Project Structure

```
app-solid/
├── src/
│   ├── pages/
│   │   ├── Home.tsx          # Home page with SDK demo
│   │   ├── Dashboard.tsx     # Dashboard with real-time stats
│   │   └── Profile.tsx       # User profile with edit mode
│   ├── App.tsx               # Main app component with navigation
│   ├── index.tsx             # Entry point with SDK initialization
│   └── router.tsx            # Route definitions
├── index.html                # HTML template
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Development

```bash
# Install dependencies
bun install

# Run development server
bun dev

# Build for production
bun build

# Preview production build
bun preview
```

The app runs on port 4204 and is served at `/solid/` base path.

## SDK Integration

### Initialization

The app initializes the Micro App SDK on startup:

```typescript
await microAppSDK.initialize();
const config = microAppSDK.getConfig();
```

### Route Synchronization

Routes are synchronized with the parent application:

```typescript
createEffect(() => {
  const currentPath = location.pathname;
  microAppSDK.navigate(currentPath);
});

microAppSDK.on('route-change', (data) => {
  const { path } = data as { path: string };
  navigate(path);
});
```

### Event Emission

Custom events can be emitted to the parent:

```typescript
microAppSDK.emit('user-action', {
  action: 'button-clicked',
  page: 'home',
  timestamp: new Date().toISOString(),
});
```

### State Changes

Notify parent about state changes:

```typescript
microAppSDK.notifyStateChange({ page: 'dashboard', stats: updated });
```

### Method Registration

Register methods that can be called by the parent:

```typescript
microAppSDK.registerMethod('updateProfile', async (params) => {
  const newProfile = params as Partial<UserProfile>;
  setProfile({ ...profile(), ...newProfile });
  return { success: true };
});
```

## Pages

### Home
- Welcome page with app information
- SDK integration demo with event emission

### Dashboard
- Real-time statistics display
- Data refresh functionality
- State change notifications

### Profile
- User profile management
- Edit mode with form inputs
- Demonstrates method registration

## Configuration

The app receives configuration from the parent application including:

- `appId`: Unique identifier
- `apiUrl`: API endpoint URL
- `theme`: Theme configuration
- `basePath`: Application base path

## Build Output

Production build outputs to `dist/app-solid/` with:

- Code splitting for vendor dependencies (solid-js, @solidjs/router)
- Optimized chunks for better loading performance
- CORS-enabled for cross-origin requests
