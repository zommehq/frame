# Vue 3 Fragment App

A Vue 3 micro-frontend application that integrates with the micro-frontend architecture using the Fragment Elements SDK.

## Features

- Built with Vue 3 Composition API
- Vue Router for client-side routing
- TypeScript support
- Vite for fast development and optimized builds
- Integration with micro-frontend SDK for host communication

## Development

```bash
# Install dependencies
bun install

# Start development server (port 4202)
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Type checking
bun run type-check
```

## Architecture

This application uses the Fragment Elements SDK to communicate with the host application:

- **Initialization**: The app waits for initialization from the parent via `frameSDK.initialize()`
- **Navigation**: Route changes are synchronized with the parent using `frameSDK.emit('navigate', { path })`
- **Events**: The app can emit custom events to the parent and listen for events from the parent
- **Props**: Receives props (theme, user data, callbacks, etc.) from the parent via `frameSDK.props`

## Routes

- `/` - Home page with feature overview
- `/about` - About page with application information
- `/contact` - Contact form demonstrating event emission

## Integration

The app is designed to be loaded within an iframe by the host application. The base path is configurable via the SDK configuration (default: `/vue/`).
