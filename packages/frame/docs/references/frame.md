# `<z-frame>` API

Custom element for embedding micro-frontend frames.

## Attributes

### Required Attributes

#### `name`

Frame identifier. Used as default base path if `base` not provided.

```html
<z-frame name="my-app"></z-frame>
```

#### `src`

Frame URL. Must be a complete URL including protocol.

```html
<z-frame src="http://localhost:3000"></z-frame>
```

### Optional Attributes

#### `base`

Base path for frame router. Defaults to `/${name}`.

```html
<z-frame base="/custom-path"></z-frame>
```

#### `sandbox`

iframe sandbox permissions. Defaults to:
`allow-scripts allow-same-origin allow-forms allow-popups allow-modals`

```html
<z-frame sandbox="allow-scripts allow-same-origin"></z-frame>
```

#### Dynamic Attributes

Any other attribute is passed to the frame:

```html
<z-frame
  api-url="https://api.com"
  theme="dark"
  user-id="123"
></z-frame>
```

## Properties

All attributes can be set as properties:

```typescript
const frame = document.querySelector('z-frame');

// Set via property (supports objects)
frame.userData = { name: 'John', role: 'admin' };
frame.apiUrl = 'https://api.com';
frame.theme = 'dark';
```

> [!NOTE]
> Properties support complex objects, while attributes are limited to strings.

## Methods

### `emit(eventName, data)`

Send event to the frame.

```typescript
frame.emit('theme-changed', { theme: 'dark' });
frame.emit('refresh-data');
```

**Parameters:**
* `eventName` (string) - Event name
* `data` (unknown, optional) - Event data

> [!NOTE]
> The frame receives this event via `frameSDK.on(eventName, handler)`. See the SDK documentation for more details.

### Dynamic Event Methods (CamelCase)

The `<z-frame>` element supports dynamic camelCase methods for emitting events. These are created automatically when accessed.

**Syntax:** Convert kebab-case event name to camelCase and call as a method.

```typescript
// These are all equivalent:
frame.emit('theme-changed', { theme: 'dark' });
frame.themeChanged({ theme: 'dark' });          // Auto-created method
frame.themeChanged({ theme: 'light' });         // Same function reference

// More examples:
frame.navigate({ path: '/settings' });          // emits 'navigate'
frame.userCreated({ id: 123, name: 'John' });  // emits 'user-created'
frame.stateChange({ user: currentUser });      // emits 'state-change'
```

**Benefits:**

* *Type-safe*: The same function reference is returned on each access
* *Convenient*: No need to remember to use kebab-case for event names
* *Consistent*: Follows JavaScript naming conventions

**Implementation:**

Methods are created lazily and cached:

```typescript
// First access creates and caches the method
const handler1 = frame.themeChanged;
const handler2 = frame.themeChanged;

// Same function reference
console.log(handler1 === handler2); // true
```

**Limitations:**

* Only works with valid camelCase identifiers (starts with lowercase letter)
* Property names must be accessible on the element (not conflicting with built-in properties)
* Non-matching patterns fall through to normal property access

## Events

The `<z-frame>` element emits custom events:

### `ready`

Fired when frame is initialized and ready.

```typescript
frame.addEventListener('ready', () => {
  console.log('Frame is ready');
});
```

### `navigate`

Fired when frame requests navigation.

```typescript
frame.addEventListener('navigate', (event) => {
  console.log(event.detail.path);     // "/app/settings"
  console.log(event.detail.replace);  // false
  console.log(event.detail.state);    // { from: 'home' }
});
```

### `error`

Fired when frame reports an error.

```typescript
frame.addEventListener('error', (event) => {
  console.log(event.detail.message);  // "Something went wrong"
  console.log(event.detail.stack);    // Stack trace
});
```

### `state-change`

Fired when frame notifies state change.

```typescript
frame.addEventListener('state-change', (event) => {
  console.log(event.detail);  // { user: {...}, theme: 'dark' }
});
```

### `custom-event`

Fired for custom events from frame.

```typescript
frame.addEventListener('custom-event', (event) => {
  console.log(event.detail.name);  // "user-action"
  console.log(event.detail.data);  // { type: 'click', id: 123 }
});
```

Or listen directly by event name:

```typescript
frame.addEventListener('user-action', (event) => {
  console.log(event.detail);  // { type: 'click', id: 123 }
});
```

## TypeScript

```typescript
import type { Frame } from '@zomme/frame';

const frame = document.querySelector('z-frame') as Frame;

// Type-safe function passing
interface UserData {
  name: string;
  email: string;
}

frame.getUserData = async (id: number): Promise<UserData> => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
};

// Frame can call this function via frameSDK.props.getUserData(123)
```

## Lifecycle

```
1. Element connected to DOM (connectedCallback)
2. Read fixed attributes (name, src, base, sandbox)
3. Create iframe with sandbox
4. Setup message listener
5. Wait for iframe load
6. Collect dynamic attributes
7. Send __INIT__ message to frame
8. Setup MutationObserver for attribute changes
9. Wait for __READY__ message from frame
10. Element ready, bidirectional communication enabled
```

## Cleanup

```
1. Element disconnected from DOM (disconnectedCallback)
2. Stop MutationObserver
3. Remove iframe from DOM
4. Reject pending function calls
5. Clear timeout timers
6. Release function references
```
