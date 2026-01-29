# Frame

## Overview

Frame provides Web Components and SDK for building micro-frontend architectures using iframe isolation with type-safe communication.

### Key Features

* **Web Components** - Custom `<z-frame>` element for embedding micro-frontends
* **Framework Agnostic** - Works with React, Vue, Angular, or vanilla JS
* **Type-Safe Communication** - MessageChannel-based protocol with TypeScript types
* **High Performance** - Dedicated MessageChannel for fast, isolated communication
* **Dynamic Attributes** - Pass data via attributes or properties (supports objects)
* **Bidirectional API** - Parent can call frame methods, frames can emit events
* **Secure Isolation** - Configurable iframe sandbox with origin validation
* **Hot Reload Support** - Attribute changes propagate to running frames

## Installation

```bash
bun add @zomme/frame
```

## Quick Start

### Parent Application (Shell)

```typescript
// Import and register the Web Component
import '@zomme/frame';

// Use in HTML
<z-frame
  name="my-app"
  src="http://localhost:3000"
  base="/my-app"
  api-url="https://api.example.com"
  theme="dark"
></z-frame>
```

### Frame Application

```typescript
import { frameSDK } from '@zomme/frame/sdk';

// Initialize SDK
await frameSDK.initialize();

// Access configuration
const config = frameSDK.props;
console.log(config.base);    // "/my-app"
console.log(config.apiUrl);  // "https://api.example.com"
console.log(config.theme);   // "dark"

// Emit custom events
frameSDK.emit('user-action', { type: 'click', id: 123 });

// Listen to attribute changes
// Watch for property changes
const unwatch = frameSDK.watch(['apiUrl'], (changes) => {
  if ('apiUrl' in changes && changes.apiUrl) {
    const [newUrl, oldUrl] = changes.apiUrl;
    console.log(`API URL changed from ${oldUrl} to ${newUrl}`);
  }
});

// Later: cleanup
unwatch();

// Call parent functions (passed via props)
const result = await frameSDK.props.onSave({ name: 'John' });
console.log(result); // { success: true }
```

## Core Concepts

See [Architecture](./docs/concepts/architecture.md)

See [Communication](./docs/concepts/communication.md)

See [Attributes](./docs/concepts/attributes.md)

See [Lifecycle](./docs/concepts/lifecycle.md)

## API Reference

See [Frame Component](./docs/references/frame.md)

See [SDK](./docs/references/sdk.md)

See [Types](./docs/references/types.md)

## Framework Integration

See [React](./docs/frameworks/react.md)

See [Vue](./docs/frameworks/vue.md)

See [Angular](./docs/frameworks/angular.md)

## Advanced Usage

See [Function Serialization](./docs/advanced/function-serialization.md)

See [Event System](./docs/advanced/event-system.md)

See [Security](./docs/advanced/security.md)

## Tech Stack

TypeScript, Web Components API, MessageChannel API

## Project Structure

```
packages/frame/
├── src/
│   ├── constants.ts              # Message type constants
│   ├── frame.ts                  # Web Component implementation
│   ├── sdk.ts                    # SDK for frames
│   ├── types.ts                  # TypeScript types
│   └── helpers/                  # Helper utilities
│       ├── function-manager.ts   # Function serialization manager
│       ├── logger.ts             # Logging utilities
│       ├── message-validators.ts # Message validation
│       ├── serialization.ts      # Data serialization
│       ├── string-utils.ts       # String utilities
│       └── type-guards.ts        # Type guard functions
├── tests/                        # Test files
├── docs/                         # Documentation
├── package.json
└── README.md                     # This file
```

## Message Flow

```
Parent Application <--> <z-frame> <--> iframe <--> Frame App
                          Web Component    MessageChannel    SDK
                                           (dedicated port)
```

### Initialization Flow

```
1. Parent creates <z-frame> element
2. Element creates iframe and MessageChannel
3. Element loads frame in iframe
4. Element sends __INIT__ message via window.postMessage with:
   - Configuration and props
   - MessagePort (transferred to frame)
5. Frame SDK receives __INIT__:
   - Validates parent origin (one-time check)
   - Extracts MessagePort from event.ports[0]
   - Sets up message handler on port
6. Frame sends __READY__ message via MessagePort
7. Element marks frame as ready
8. Bidirectional communication enabled via dedicated MessageChannel
```

### Attribute Change Flow

```
// Via setAttribute (MutationObserver)
element.setAttribute('theme', 'dark')
  -> MutationObserver detects change
  -> Sends __ATTRIBUTE_CHANGE__ message
   -> Frame SDK receives and emits event

// Via property (Proxy)
element.theme = 'dark'
   -> Proxy intercepts assignment
   -> Sends __ATTRIBUTE_CHANGE__ message
   -> Frame SDK receives and emits event
```

## Design Principles

1. **Secure by default** - iframe sandbox, origin validation, CORS-safe
2. **Framework agnostic** - Works with any frontend framework
3. **Type-safe** - Full TypeScript support with strict types
4. **Developer friendly** - Simple API, clear error messages
5. **Hot reload ready** - Dynamic attribute updates without page reload
6. **Minimal overhead** - Lightweight Web Component, no heavy dependencies

## Browser Support

* Chrome/Edge 89+
* Firefox 88+
* Safari 15+

Requires support for:
* Web Components (Custom Elements v1)
* Proxy
* MutationObserver
* MessageChannel API

## License

MIT
