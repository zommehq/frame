# Vue Integration

Frame provides official Vue 3 support with dedicated packages for both parent and child applications.

## Parent Application (Vue 3)

### Installation

```bash
bun add @zomme/frame-vue
```

### Using the Frame Component

The `@zomme/frame-vue` package provides a ready-to-use Vue component wrapper:

```vue
<script setup lang="ts">
import { Frame } from '@zomme/frame-vue';

function handleReady(event: CustomEvent) {
  console.log('Frame ready:', event.detail);
}

function handleNavigate(event: CustomEvent) {
  console.log('Navigation:', event.detail);
}
</script>

<template>
  <Frame
    name="user-app"
    src="http://localhost:3001"
    base="/users"
    theme="dark"
    :api-url="apiUrl"
    @ready="handleReady"
    @navigate="handleNavigate"
  />
</template>
```

The `Frame` component:

* Automatically handles property updates and passes them to the custom element
* Provides TypeScript-safe event handling
* Manages lifecycle and cleanup
* Supports all standard HTML attributes and custom properties

### Using the Web Component Directly

You can also use the native web component directly:

```vue
<script setup lang="ts">
import '@zomme/frame';
</script>

<template>
  <z-frame
    name="user-app"
    src="http://localhost:3001"
    base="/users"
    theme="dark"
  />
</template>
```

### Type-Safe Wrapper (Custom)

For advanced use cases, you can create your own wrapper:

```vue
<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import type { Frame } from '@zomme/frame';

interface Props {
  apiUrl: string;
  name: string;
  src: string;
  theme: 'light' | 'dark';
}

const props = defineProps<Props>();
const frameRef = ref<Frame>();

watchEffect(() => {
  if (!frameRef.value) return;
  frameRef.value.apiUrl = props.apiUrl;
  frameRef.value.theme = props.theme;
});
</script>

<template>
  <z-frame ref="frameRef" :name="props.name" :src="props.src" />
</template>
```

## Frame Application (Vue 3)

### Installation

```bash
bun add @zomme/frame-vue
```

### Using the useFrameSDK Composable

The `useFrameSDK` composable provides a reactive way to interact with the parent frame:

```typescript
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
```

```vue
<script setup lang="ts">
import { useFrameSDK } from '@zomme/frame-vue';

interface Props {
  apiUrl: string;
  name: string;
  theme: 'light' | 'dark';
}

const { emit, isReady, on, onAttr, props, sdkAvailable } = useFrameSDK<Props>();

// Listen to events from parent
on('refresh', () => {
  console.log('Parent requested refresh');
});

// Listen to specific attribute changes
onAttr('theme', (newTheme) => {
  console.log('Theme changed:', newTheme);
});

// Emit events to parent
function notifyParent() {
  emit('user-action', { action: 'save', timestamp: Date.now() });
}
</script>

<template>
  <div v-if="isReady" :data-theme="props.theme">
    <h1>Frame: {{ props.name }}</h1>
    <p>API URL: {{ props.apiUrl }}</p>
    <p>SDK Available: {{ sdkAvailable }}</p>
    <button @click="notifyParent">Notify Parent</button>
  </div>
  <div v-else>
    Loading frame...
  </div>
</template>
```

### useFrameSDK API Reference

The `useFrameSDK` composable returns an object with the following properties and methods:

#### props

| Type | Description |
|------|-------------|
| `T` (generic type parameter) | Reactive object containing all props passed from the parent frame. Automatically updated when attributes change. |

```typescript
interface Props {
  theme: 'light' | 'dark';
  user: { name: string };
}

const { props } = useFrameSDK<Props>();
// props.theme and props.user are reactive
```

#### isReady

| Type | Description |
|------|-------------|
| `Ref<boolean>` | Reactive boolean indicating if the SDK has finished initialization. Use this to conditionally render content. |

```vue
<template>
  <div v-if="isReady">
    Content ready to display
  </div>
</template>
```

#### sdkAvailable

| Type | Description |
|------|-------------|
| `Ref<boolean>` | Reactive boolean indicating if the frame SDK is available. Returns `false` when running in standalone mode (outside of a parent frame). |

```typescript
const { sdkAvailable } = useFrameSDK();

if (!sdkAvailable.value) {
  console.log('Running in standalone mode');
}
```

#### emit(event: string, data?: unknown)

| Parameters | Returns | Description |
|------------|---------|-------------|
| `event`: Event name, `data`: Optional event payload | `void` | Sends a custom event to the parent frame. When running in standalone mode, logs the event to console instead. |

```typescript
const { emit } = useFrameSDK();

emit('save-completed', { id: 123 });
emit('navigation-requested', { path: '/users' });
```

#### on(event: string, handler: (data: unknown) => void)

| Parameters | Returns | Description |
|------------|---------|-------------|
| `event`: Event name, `handler`: Callback function | `() => void` (cleanup function) | Listens to custom events from the parent frame. Returns a function to remove the listener. |

```typescript
const { on } = useFrameSDK();

const unsubscribe = on('refresh', (data) => {
  console.log('Refresh requested:', data);
});

// Clean up when needed
onUnmounted(() => {
  unsubscribe();
});
```

#### onAttr(attrName: string, handler: (value: unknown) => void)

| Parameters | Returns | Description |
|------------|---------|-------------|
| `attrName`: Attribute name, `handler`: Callback function | `() => void` (cleanup function) | Listens to changes in a specific attribute from the parent frame. Automatically updates the `props` object and calls the handler. |

```typescript
const { onAttr } = useFrameSDK();

onAttr('theme', (newTheme) => {
  console.log('Theme changed to:', newTheme);
  // props.theme is already updated
});
```

### Using the SDK Directly

For projects not using the Vue package, you can use the SDK directly:

```typescript
import { createApp } from 'vue';
import App from './App.vue';
import { frameSDK } from '@zomme/frame/sdk';

frameSDK.initialize().then(() => {
  createApp(App).mount('#app');
});
```

```vue
<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { frameSDK } from '@zomme/frame/sdk';

const config = ref(frameSDK.props);

const unwatch = frameSDK.watch(['theme'], (changes) => {
  if ('theme' in changes && changes.theme) {
    const [newTheme] = changes.theme;
    config.value.theme = newTheme;
  }
});

onUnmounted(() => {
  unwatch();
});
</script>

<template>
  <div :data-theme="config.theme">
    <h1>Frame: {{ config.name }}</h1>
  </div>
</template>
```

### Complete Example

Parent application:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Frame } from '@zomme/frame-vue';

const theme = ref<'light' | 'dark'>('light');
const userCount = ref(0);

function handleUserAction(event: CustomEvent) {
  console.log('User action:', event.detail);
  userCount.value++;
}
</script>

<template>
  <div>
    <button @click="theme = theme === 'light' ? 'dark' : 'light'">
      Toggle Theme
    </button>

    <Frame
      name="user-app"
      src="http://localhost:3001"
      :theme="theme"
      :api-url="'https://api.example.com'"
      @user-action="handleUserAction"
    />

    <p>User actions: {{ userCount }}</p>
  </div>
</template>
```

Frame application:

```vue
<script setup lang="ts">
import { useFrameSDK } from '@zomme/frame-vue';

interface Props {
  apiUrl: string;
  name: string;
  theme: 'light' | 'dark';
}

const { emit, isReady, props, sdkAvailable } = useFrameSDK<Props>();

function saveUser() {
  emit('user-action', { action: 'save', timestamp: Date.now() });
}
</script>

<template>
  <div v-if="isReady" :data-theme="props.theme">
    <h1>{{ props.name }}</h1>
    <p>API: {{ props.apiUrl }}</p>
    <p>Mode: {{ sdkAvailable ? 'Embedded' : 'Standalone' }}</p>
    <button @click="saveUser">Save User</button>
  </div>
</template>
```
