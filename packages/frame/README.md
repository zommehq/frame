# @zomme/frame

Web Component for embedding micro-frontends in isolated iframes with bidirectional PostMessage communication.

## Installation

```bash
npm install @zomme/frame
# or
bun add @zomme/frame
```

## Usage

### Parent (Shell)

```html
<z-frame
  name="my-app"
  src="https://my-app.example.com"
  base="/my-app"
></z-frame>
```

```typescript
import '@zomme/frame';

const frame = document.querySelector('z-frame');

// Set props (automatically synced to iframe)
frame.theme = 'dark';
frame.user = { id: 1, name: 'John' };
frame.onSave = async (data) => { /* callback */ };

// Listen to events from iframe
frame.addEventListener('navigate', (e) => {
  console.log('Navigate to:', e.detail.path);
});

// Emit events to iframe
frame.emit('theme-change', { theme: 'dark' });
```

### Child (Frame App)

```typescript
import { frameSDK } from '@zomme/frame/sdk';

// Initialize
await frameSDK.initialize();

// Access props
console.log(frameSDK.props.theme);
console.log(frameSDK.props.user);

// Call parent functions
await frameSDK.props.onSave({ id: 123 });

// Emit events to parent
frameSDK.emit('navigate', { path: '/users' });

// Listen to events from parent
frameSDK.on('theme-change', (data) => {
  console.log('Theme changed:', data.theme);
});

// Watch prop changes
frameSDK.watch(['theme', 'user'], (changes) => {
  if ('theme' in changes) {
    const [newTheme, oldTheme] = changes.theme;
    console.log(`Theme: ${oldTheme} -> ${newTheme}`);
  }
});
```

## Features

- Automatic props/attributes synchronization
- RPC function serialization (functions become callable cross-iframe)
- Bidirectional event system
- Watch API for reactive prop changes
- TypeScript support

## Framework Wrappers

- [@zomme/frame-angular](https://www.npmjs.com/package/@zomme/frame-angular) - Angular wrapper
- [@zomme/frame-react](https://www.npmjs.com/package/@zomme/frame-react) - React wrapper
- [@zomme/frame-vue](https://www.npmjs.com/package/@zomme/frame-vue) - Vue wrapper

## License

MIT
