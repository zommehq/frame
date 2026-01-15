# React 18 Micro App

A React 18 micro-frontend application built with Vite, React Router, and the Micro App SDK.

## Features

- **React 18** with modern hooks and features
- **React Router v6** for client-side routing
- **Micro App SDK** integration for parent-child communication
- **TypeScript** for type safety
- **Vite** for fast development and optimized builds
- **Code splitting** with manual chunks for vendor libraries

## Development

```bash
# Install dependencies
bun install

# Start development server (runs on port 4203)
bun run dev
```

## Build

```bash
# Build for production
bun run build

# Preview production build
bun run preview
```

## Project Structure

```
app-react/
├── src/
│   ├── pages/          # Page components
│   │   ├── Home.tsx
│   │   ├── Products.tsx
│   │   └── Services.tsx
│   ├── App.tsx         # Main app component with routing
│   ├── main.tsx        # Entry point with SDK initialization
│   └── router.tsx      # Route definitions
├── index.html          # HTML template
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Configuration

- **Base path**: `/react/`
- **Output directory**: `dist/app-react`
- **Dev server port**: `4203`
- **Code splitting**: Vendor bundle includes `react`, `react-dom`, and `react-router-dom`

## SDK Integration

The app uses the Micro App SDK to:
- Initialize and receive configuration from the parent shell
- Listen to route change events from the parent
- Notify the parent about internal route changes
- Emit custom events to the parent
- Report errors to the parent

## Routes

- `/` - Home page with configuration display and event emission
- `/products` - Products catalog page
- `/services` - Services listing page
