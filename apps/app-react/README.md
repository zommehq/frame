# React 18 Task & Analytics Dashboard

A comprehensive React 18 micro-frontend application demonstrating all Frame SDK capabilities including task management, analytics, and settings with full parent-child communication.

## Features

- **React 18** with modern hooks and Composition API patterns
- **React Router v6** for client-side routing
- **Frame SDK** full feature demonstration
- **TypeScript** for complete type safety
- **Vite** for fast development and optimized builds
- **Comprehensive CSS** with light/dark theme support

## SDK Capabilities Demonstrated

### 1. Props + Events Communication

- Task management with add, toggle, and delete operations
- Real-time progress tracking
- Event emission to parent app on task changes

### 2. Transferable Objects (ArrayBuffer)

- Efficient binary data transfer for metrics
- Zero-copy performance metrics visualization
- DataView encoding/decoding demonstration

### 3. Async Callbacks

- Search functionality calling parent app async functions
- Promise-based communication pattern
- Error handling and loading states

### 4. Attribute Listeners

- Theme toggle synchronized with parent app
- Reactive prop updates
- Two-way theme communication

### 5. Navigation Integration

- Route synchronization between frame and parent
- Browser history integration
- Deep linking support

### 6. Error Handling

- Comprehensive error reporting to parent
- User-friendly error messages
- Console logging for debugging

### 7. User Data Props

- User information from parent app
- Props-based data flow
- Display of user profile in settings

## Development

```bash
# Install dependencies
bun install

# Start development server (runs on port 4201)
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
│   ├── components/           # Reusable components
│   │   ├── TaskList.tsx     # Task management UI
│   │   ├── MetricsDisplay.tsx # ArrayBuffer metrics
│   │   ├── SearchBar.tsx    # Async callback demo
│   │   └── ThemeToggle.tsx  # Attribute listener demo
│   ├── pages/               # Route pages
│   │   ├── Tasks.tsx        # Task management page
│   │   ├── Analytics.tsx    # Metrics dashboard
│   │   └── Settings.tsx     # User preferences
│   ├── hooks/               # Custom React hooks
│   │   └── useFrameSDK.ts   # SDK integration hook
│   ├── types.ts             # TypeScript interfaces
│   ├── App.tsx              # Main app with routing
│   ├── App.css              # Complete styling
│   └── main.tsx             # Entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Configuration

- **Base path**: `/react/`
- **Output directory**: `dist/`
- **Dev server port**: `4201`
- **Theme**: Light/Dark mode with CSS variables

## Routes

- `/tasks` (default) - Task management with search
- `/analytics` - Performance metrics dashboard
- `/settings` - User preferences and theme toggle

## Parent App Integration

The React frame expects the following props from parent:

```typescript
interface Props {
  // User data
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };

  // Theme attribute
  theme?: "light" | "dark";

  // Metrics data (ArrayBuffer)
  metricsData?: ArrayBuffer;

  // Async search callback
  searchCallback?: (params: SearchParams) => Promise<SearchResult[]>;
}
```

The frame emits the following events:

```typescript
// Navigation changes
emit("navigate", { path: string });

// Theme changes
emit("theme-changed", { theme: "light" | "dark" });

// Error reporting
emit("error", { error: any, message: string });
```

## Example Parent Configuration

```html
<z-frame
  name="react"
  src="http://localhost:4201/react/"
  base="/react"
  :user="currentUser"
  :theme="currentTheme"
  :metricsData="metricsArrayBuffer"
  :searchCallback="handleSearch"
  @navigate="onNavigate"
  @theme-changed="onThemeChanged"
  @error="onError"
/>
```
