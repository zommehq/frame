# @zomme/frame-angular

Angular wrapper for [@zomme/frame](https://www.npmjs.com/package/@zomme/frame) micro-frontend framework.

## Installation

```bash
npm install @zomme/frame-angular @zomme/frame
```

## Quick Start (Child App)

### 1. Configure the provider

```typescript
// app.config.ts
import { provideFrameSDK } from "@zomme/frame-angular";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFrameSDK({ routerSync: true }), // One line setup!
  ],
};
```

### 2. Use props in components

```typescript
// tasks.component.ts
import { Component, inject } from "@angular/core";
import { FramePropsService, injectFrameProps } from "@zomme/frame-angular";

interface TasksProps {
  tasks?: Task[];
  filter?: "all" | "active" | "completed";
  addTask?: (task: Omit<Task, "id">) => Promise<Task>;
  deleteTask?: (taskId: number) => Promise<boolean>;
}

@Component({
  selector: "app-tasks",
  template: `
    <ul>
      @for (task of tasks(); track task.id) {
        <li>{{ task.title }}</li>
      }
    </ul>
    <button (click)="add()">Add Task</button>
  `,
})
export class TasksComponent {
  private frameProps = inject(FramePropsService);
  private props = injectFrameProps<TasksProps>();

  // Props are Signals - reactive and auto-updating
  protected tasks = this.props.tasks;
  protected filter = this.props.filter;

  async add() {
    try {
      // Functions are async RPC - transparent cross-iframe calls
      const newTask = await this.props.addTask({ title: "New Task", completed: false });
      console.log("Created:", newTask);

      // Emit custom event to parent shell
      this.frameProps.emit("task-created", { task: newTask });
    } catch (error) {
      // Emit error event to parent
      this.frameProps.emit("error", { message: "Failed to create task", error });
    }
  }
}
```

**Key concepts:**
- `injectFrameProps<T>()` returns a Proxy where each prop is a Signal
- Access values with `this.props.propName()` (reactive, auto-updates)
- Functions passed from parent are **always async** (RPC over PostMessage)
- Use `FramePropsService.emit()` to send custom events to parent

### Important: Callbacks are Always Async

All functions passed from parent to child are executed via **RPC (Remote Procedure Call)** over PostMessage. This means:

1. **Always use `await`** when calling parent functions
2. **Always define callbacks as `async`** in the parent
3. **Always return `Promise<T>`** in your type definitions
4. **Handle errors** with try/catch

```typescript
// In parent shell - define callbacks as async
handleAddTask = async (task: Omit<Task, "id">): Promise<Task> => {
  const newTask = { ...task, id: Date.now() };
  this.tasks.update((t) => [...t, newTask]);
  return newTask;  // Return value is sent back to child
};

// In child app - always await
async addTask() {
  try {
    const newTask = await this.props.addTask({ title: "New Task" });
    console.log("Created:", newTask);
  } catch (error) {
    console.error("RPC call failed:", error);
  }
}
```

### Event Naming Convention

The framework uses two event formats:

| Type | Format | Examples | Usage |
|------|--------|----------|-------|
| **Internal** | `ready`, `route-change` | Framework events |
| **Custom** | `kebab-case` | `task-created`, `user-updated` | Your app events |

**Internal events:**
- `error` - Error in child frame
- `navigate` - Child notifies navigation to parent
- `ready` - Child frame initialized
- `register` - Child registers callable functions
- `route-change` - Parent sends route to child
- `unregister` - Child unregisters functions

**Custom events:** Use `kebab-case` for your application events:
```typescript
this.frameProps.emit("task-created", { task: newTask });
this.frameProps.emit("user-updated", { userId: 123 });
```

### Registered Functions

Child frames can register functions that the parent can call directly:

```typescript
// Child registers functions
frameSDK.register('refreshData', async () => {
  await loadData();
  return { success: true };
});

frameSDK.register({
  getStats: () => ({ total: 10, active: 5 }),
  exportPdf: async (format) => generatePdf(format),
});

// Parent calls registered functions (via z-frame element)
const stats = await frame.getStats();
await frame.refreshData();
```

### Router Synchronization

When `routerSync: true` is enabled, the child app's Angular Router automatically syncs with the parent shell:

**Child → Parent:** When the user navigates inside the child app (e.g., clicks a link to `/details`), the child automatically emits a `navigate` event to the parent. The parent can then update the browser URL to reflect the full path (e.g., `/tasks/details`).

**Parent → Child:** When the parent shell navigates to a route that includes the child's base path (e.g., `/tasks/settings`), it can emit a `route-change` event. The child receives this and navigates its internal router to `/settings`.

```
Shell URL: /tasks/settings
                ↓
        route-change event
                ↓
Child Router: /settings
```

This keeps the browser URL in sync with the actual view, even though the child app runs in an isolated iframe.

## Quick Start (Parent Shell)

Use the native `<z-frame>` custom element directly with `CUSTOM_ELEMENTS_SCHEMA`:

```typescript
// shell.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from "@angular/core";
import { Router } from "@angular/router";

// Type helper for z-frame with registered actions
type ZFrame<TActions = Record<string, never>> = HTMLElement & {
  [K in keyof TActions]: TActions[K];
};

// Define actions registered by child
interface TasksFrameActions {
  getStats(): Promise<{ currentRoute: string; timestamp: number }>;
  refreshData(): Promise<{ success: boolean }>;
}

@Component({
  selector: "app-shell",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <z-frame
      name="tasks-app"
      base="/tasks"
      src="http://localhost:4200/"
      [tasks]="tasks()"
      [filter]="currentFilter"
      [addTask]="handleAddTask"
      [deleteTask]="handleDeleteTask"
      (ready)="onReady($event)"
      (navigate)="onNavigate($event)"
      (task-created)="onTaskCreated($event)"
    />
    <button (click)="testChildAction()">Call Child Action</button>
  `,
})
export class ShellComponent {
  private router = inject(Router);
  private tasksFrame: ZFrame<TasksFrameActions> | null = null;

  tasks = signal<Task[]>([]);
  currentFilter = "all";

  handleAddTask = async (task: Omit<Task, "id">): Promise<Task> => {
    const newTask = { ...task, id: Date.now() };
    this.tasks.update((t) => [...t, newTask]);
    return newTask;
  };

  handleDeleteTask = async (taskId: number): Promise<boolean> => {
    this.tasks.update((t) => t.filter((task) => task.id !== taskId));
    return true;
  };

  onReady(event: Event) {
    const { name } = (event as CustomEvent).detail;
    if (name === "tasks-app") {
      this.tasksFrame = event.target as ZFrame<TasksFrameActions>;
    }
  }

  onNavigate(event: Event) {
    const { path } = (event as CustomEvent).detail;
    this.router.navigateByUrl(`/tasks${path}`);
  }

  onTaskCreated(event: Event) {
    console.log("Task created:", (event as CustomEvent).detail.task);
  }

  // Call registered functions in child frame
  async testChildAction() {
    const stats = await this.tasksFrame?.getStats();
    console.log("Stats from child:", stats);

    const result = await this.tasksFrame?.refreshData();
    console.log("Refresh result:", result);
  }
}
```

## API Reference

### `provideFrameSDK(config)`

Provider function to configure the Frame SDK.

```typescript
provideFrameSDK({
  routerSync: true,                          // Enable automatic router synchronization (default: true)
  timeout: 10000,                            // SDK initialization timeout in ms (default: 10000)
  expectedOrigin: 'https://shell.example.com', // Security: only accept connections from this origin
  onStandalone: () => {},                    // Called when running without parent shell
  onReady: () => {},                         // Called when SDK initializes successfully
})
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `routerSync` | `boolean` | `true` | Enable bidirectional router synchronization |
| `timeout` | `number` | `10000` | Timeout for SDK initialization (ms) |
| `expectedOrigin` | `string` | - | Security validation for parent origin |
| `onStandalone` | `() => void` | - | Callback when running without parent shell |
| `onReady` | `() => void` | - | Callback when SDK initializes successfully |

### `injectFrameProps<T>()`

Injection function that returns a `PropsProxy<T>`. Each property is accessible as a Signal.

```typescript
const props = injectFrameProps<MyProps>();

// Access reactive values (Signals)
const theme = props.theme();      // Returns current value
const user = props.user();        // Auto-updates when parent changes

// Call parent functions (async RPC)
await props.saveData({ ... });    // Returns Promise
```

### `<z-frame>` Custom Element

Use the native `<z-frame>` custom element directly. No Angular wrapper needed.

**Required attributes:**
- `name` - Unique identifier for the frame
- `src` - URL of the child app

**Optional attributes:**
- `base` - Base path for routing (defaults to `/{name}`)

**Events:**
- `ready` - Frame initialized
- `navigate` - Child navigated
- `error` - Frame error
- `register` - Child registered functions
- `unregister` - Child unregistered functions

**Calling child functions:**

Child frames can register functions via `frameSDK.register()`. Parent can call them directly:

```typescript
// Store typed reference on ready
onReady(event: Event) {
  this.childFrame = event.target as ZFrame<ChildActions>;
}

// Call registered functions directly
const stats = await this.childFrame.getStats();
await this.childFrame.refreshData();
```

**Example:**

```html
<z-frame
  name="tasks-app"
  base="/tasks"
  src="http://localhost:4200/"
  [tasks]="tasks()"
  [addTask]="handleAddTask"
  (ready)="onReady($event)"
  (navigate)="onNavigate($event)"
/>
```

The `base` prop is automatically passed to the child app and is used for router synchronization.

### `FramePropsService`

Injectable service for accessing props and emitting events.

```typescript
@Component({ ... })
export class MyComponent {
  private frameProps = inject(FramePropsService);

  emitError() {
    this.frameProps.emit("error", { message: "Something went wrong" });
  }
}
```

### `isStandaloneMode()`

Utility function to check if the app is running without a parent shell.

```typescript
import { isStandaloneMode } from "@zomme/frame-angular";

@Component({
  template: `
    @if (!isStandalone) {
      <p>Connected to shell</p>
    } @else {
      <p>Running standalone</p>
    }
  `,
})
export class MyComponent {
  isStandalone = isStandaloneMode();
}
```

## Complete Example

Based on a real tasks app:

```typescript
// app.config.ts
import { provideFrameSDK } from "@zomme/frame-angular";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFrameSDK({
      routerSync: true,
      onStandalone: () => console.warn("Running in standalone mode"),
    }),
  ],
};

// tasks.component.ts
import { Component, signal } from "@angular/core";
import { injectFrameProps } from "@zomme/frame-angular";

interface TasksProps {
  filteredTasks?: Task[];
  filter?: "all" | "active" | "completed";
  taskStats?: { total: number; active: number; completed: number };
  setFilter?: (filter: string) => Promise<void>;
  toggleTask?: (id: number) => Promise<Task>;
  addRandomTask?: () => Promise<Task>;
  deleteTask?: (id: number) => Promise<boolean>;
}

@Component({
  selector: "app-tasks",
  template: `
    <div class="stats">
      Total: {{ taskStats()?.total }} | Active: {{ taskStats()?.active }}
    </div>

    <div class="filters">
      <button (click)="setFilter('all')">All</button>
      <button (click)="setFilter('active')">Active</button>
      <button (click)="setFilter('completed')">Completed</button>
    </div>

    <ul>
      @for (task of filteredTasks(); track task.id) {
        <li [class.completed]="task.completed">
          <input type="checkbox" [checked]="task.completed" (change)="toggle(task.id)" />
          {{ task.title }}
          <button (click)="delete(task.id)">Delete</button>
        </li>
      }
    </ul>

    <button (click)="addRandom()">Add Random Task</button>
  `,
})
export class TasksComponent {
  private props = injectFrameProps<TasksProps>();

  // Reactive props as Signals
  protected filteredTasks = this.props.filteredTasks;
  protected filter = this.props.filter;
  protected taskStats = this.props.taskStats;

  async setFilter(filter: "all" | "active" | "completed") {
    await this.props.setFilter(filter);
  }

  async toggle(taskId: number) {
    await this.props.toggleTask(taskId);
  }

  async delete(taskId: number) {
    await this.props.deleteTask(taskId);
  }

  async addRandom() {
    const task = await this.props.addRandomTask();
    console.log("Added:", task);
  }
}
```

## Related Packages

- [@zomme/frame](https://www.npmjs.com/package/@zomme/frame) - Core framework
- [@zomme/frame-react](https://www.npmjs.com/package/@zomme/frame-react) - React wrapper
- [@zomme/frame-vue](https://www.npmjs.com/package/@zomme/frame-vue) - Vue wrapper

## License

MIT
