# Micro-Frontend Framework

Monorepo for micro-frontends using **Bun workspaces** with iframe communication via PostMessage.

## Structure

```
micro-fe/
├── packages/           # Shared libraries
│   ├── frame/          # Core: <z-frame> Web Component + frameSDK
│   ├── frame-angular/  # Angular wrapper
│   ├── frame-react/    # React wrapper
│   └── frame-vue/      # Vue wrapper
└── apps/               # Applications
    ├── shell-angular/  # Main shell (Angular)
    ├── shell-vue/      # Alternative shell (Vue)
    ├── app-angular/    # Angular frame app
    ├── app-react/      # React frame app
    └── app-vue/        # Vue frame app
```

## Packages

### @zomme/frame (Core)
Web Component `<z-frame>` for embedding micro-frontends in isolated iframes.

**Exports:**
- `Frame` - Custom element `<z-frame>` for the shell
- `frameSDK` - SDK for frames to communicate with parent
- `./constants` - PostMessage constants
- `./types` - TypeScript types (FrameProps, Message, etc.)

**Features:**
- Automatic props/attributes synchronization
- RPC function serialization (functions become callable cross-iframe)
- Bidirectional event system
- Watch API for reactive prop changes

### @zomme/frame-angular
Angular wrapper with components and services for integration.

**Exports:**
- `FrameComponent` - Angular component for `<z-frame>`
- `FramePropsService` - Service to access props reactively
- `injectFrameProps()` - Injection function with PropsProxy
- `provideFrameSDK()` - Provider to configure SDK
- `setupRouterSync()` - Angular Router sync with parent

### @zomme/frame-react
React wrapper with component and hook.

**Exports:**
- `Frame` - React component for `<z-frame>`
- `useFrameSDK()` - Hook to access frameSDK

### @zomme/frame-vue
Vue 3 wrapper with component and composable.

**Exports:**
- `Frame` - Vue component for `<z-frame>`
- `useFrameSDK()` - Composable to access frameSDK

## Apps

| App | Port | Framework | Type | Description |
|-----|------|-----------|------|-------------|
| shell-angular | 4000 | Angular 21 | Shell | Main host that orchestrates frames |
| shell-vue | 4001 | Vue 3.5 | Shell | Alternative host with Pinia |
| app-angular | 4200 | Angular 21 | Frame | Angular micro-frontend |
| app-react | 4201 | React 18 | Frame | React micro-frontend |
| app-vue | 4202 | Vue 3.4 | Frame | Vue micro-frontend |

## Scripts

```bash
bun run dev              # Start all dev servers (with watch mode)
bun run build            # Build packages + apps (for production)
bun run reinstall        # Clean and reinstall everything
```

**Note:** When `bun run dev` is running, all packages and apps are in **watch mode**. Changes are automatically rebuilt - **no need to run build commands manually** during development.

## Communication Architecture

```
Shell (Parent)                          Frame (Child/Iframe)
     │                                        │
     │  ┌─────────────────────────────────┐   │
     │  │     <z-frame src="...">         │   │
     │  │  ┌───────────────────────────┐  │   │
     ├──┼──│ Props (theme, user, etc)  │──┼───┤
     │  │  │ Functions (callbacks)     │  │   │
     │  │  └───────────────────────────┘  │   │
     │  │  ┌───────────────────────────┐  │   │
     ├──┼──│ Events (navigate, error)  │◄─┼───┤
     │  │  │ Registered functions      │  │   │
     │  │  └───────────────────────────┘  │   │
     │  └─────────────────────────────────┘   │
     │                                        │
     │        MessagePort (PostMessage)       │
     └────────────────────────────────────────┘
```

**Flow:**
1. Shell creates `<z-frame>` with props (including functions)
2. Frame receives props via `frameSDK.props`
3. Frame calls parent functions via transparent RPC
4. Frame emits events via `frameSDK.emit()`
5. Shell listens to events via `frame.addEventListener()`

## Important Notes

- **Dev mode**: `bun run dev` runs with watch mode - changes auto-rebuild, **no manual build needed**
- **Arrow functions**: Use arrow functions in services to preserve `this`
- **Hard refresh**: Ctrl+Shift+R to clear browser cache if changes don't appear
- **Workspace deps**: Declare all deps with `workspace:*`
- **Build command**: Only use `bun run build` for production builds, not during development
- **Git commits**: **NEVER** create commits without explicit user permission - always ask first
