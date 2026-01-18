# Vue 3 Task Dashboard

A comprehensive Vue 3 micro-frontend application demonstrating ALL capabilities of the Frame Elements SDK through a Task & Analytics Dashboard.

## Features

- **Vue 3 Composition API** - Modern reactive patterns with composables
- **Vue Router** - Client-side routing synchronized with parent
- **TypeScript** - Full type safety with interfaces
- **Vite** - Fast development and optimized builds
- **Frame Elements SDK** - Complete integration demonstrating:
  - Props access and reactivity
  - Event emission and listening
  - Attribute listeners for dynamic updates
  - Callback functions (sync and async)
  - Transferable Objects (ArrayBuffer)
  - Navigation synchronization
  - Error handling and cleanup

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

This application uses the Frame Elements SDK to communicate with the host application:

- **Initialization**: The app waits for initialization from the parent via `frameSDK.initialize()`
- **Navigation**: Route changes are synchronized with the parent using `frameSDK.emit('navigate', { path })`
- **Events**: The app can emit custom events to the parent and listen for events from the parent
- **Props**: Receives props (theme, user data, callbacks, etc.) from the parent via `frameSDK.props`

## Routes

### Main Dashboard Routes

- `/` - **Home** - Feature overview and props display
- `/tasks` - **Task Management** - Demonstrates Props + Events + Search
- `/analytics` - **Analytics Dashboard** - Demonstrates Transferable Objects (ArrayBuffer)
- `/settings` - **Settings** - Demonstrates Async Callbacks + Attribute Listeners

### Additional Routes

- `/about` - About page with application information
- `/contact` - Contact form demonstrating event emission

## SDK Features Demonstrated

### 1. Props + Events (Task Management)

**Location:** `/tasks`

- Receives tasks array from parent via props
- Emits events on task actions (add, toggle, delete)
- Real-time search with result events
- Filter functionality with state sync

**Events emitted:**
- `task-added` - When a new task is created
- `task-toggled` - When task completion status changes
- `task-deleted` - When a task is removed
- `task-stats-changed` - When task statistics update
- `search-performed` - When search is executed

### 2. Transferable Objects (Analytics)

**Location:** `/analytics`

- Serializes metrics to ArrayBuffer using TextEncoder
- Transfers data using zero-copy transfer
- Deserializes received ArrayBuffer data
- Demonstrates performance benefits of transferables

**Technical details:**
- Metrics are JSON-encoded to UTF-8 bytes
- ArrayBuffer is transferred (not copied) via postMessage
- Improves performance for large datasets
- Proper error handling for serialization failures

### 3. Async Callbacks + Attribute Listeners (Settings)

**Location:** `/settings`

**Async Callbacks:**
- `saveCallback` - Returns Promise with save result
- Proper loading states during async operations
- Error handling for failed operations

**Attribute Listeners:**
- Listens for `theme` attribute changes
- Listens for `user` attribute updates
- Reactive updates when attributes change
- Bidirectional communication (can request changes)

### 4. Navigation Synchronization

- Route changes emit `navigate` events to parent
- Parent can trigger route changes via `route-change` events
- Deep linking support with state preservation
- Browser history integration

### 5. Error Handling

- Error events emitted to parent with context
- Component-level error boundaries
- Proper error propagation
- User-friendly error messages

### 6. Lifecycle & Cleanup

- SDK initialization on mount
- Proper cleanup on unmount
- Memory leak prevention
- Event listener cleanup

## Project Structure

```
src/
├── composables/
│   └── useFrameSDK.ts       # Composable for SDK integration
├── types.ts                  # TypeScript interfaces
├── utils/
│   └── metrics.ts            # ArrayBuffer serialization utilities
├── views/
│   ├── Home.vue              # Landing page with feature overview
│   ├── TaskList.vue          # Task management demo
│   ├── Analytics.vue         # Transferable objects demo
│   ├── Settings.vue          # Callbacks & attributes demo
│   ├── About.vue             # About page
│   └── Contact.vue           # Contact page
├── App.vue                   # Root component
├── main.ts                   # Entry point
└── router.ts                 # Route configuration
```

## Integration with Parent

The app is designed to be loaded within a `<z-frame>` element by the host application.

**Parent HTML:**
```html
<z-frame
  name="vue-app"
  src="http://localhost:4202"
  base="/vue/"
  theme="light"
  user='{"id":1,"name":"John Doe","email":"john@example.com","role":"Admin"}'
  actionCallback={handleAction}
  saveCallback={handleSave}
  successCallback={handleSuccess}
></z-frame>
```

**Props received:**
- `name` - Frame identifier
- `base` - Base path for routing
- `theme` - Current theme (light/dark)
- `user` - User object
- `actionCallback` - Sync callback function
- `saveCallback` - Async callback function (returns Promise)
- `successCallback` - Initialization callback

## Development Tips

1. **Testing with Parent**: Run the shell app alongside this frame to test full integration
2. **Theme Testing**: Use the Settings page to test theme attribute changes
3. **ArrayBuffer Testing**: Use Analytics page to test transferable object performance
4. **Error Testing**: Use the "Test Error" button in navigation to test error handling
