# Logger Utility

The logger utility provides consistent log prefixes across the codebase for improved readability and debuggability.

## Overview

The logger provides structured logging methods with standardized prefixes to:

* Improve log readability and searchability
* Distinguish between different components (z-frame vs SDK)
* Maintain consistency in error messages

## Import

```typescript
import { createLogger, Logger } from '@zomme/frame';
```

## Interface

### Logger

```typescript
interface Logger {
  error: (...args: unknown[]) => void;
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
}
```

## Functions

### `createLogger(prefix)`

Create a logger instance with a specific prefix.

**Parameters:**

* `prefix` (string) - The component prefix (e.g., 'z-frame', 'frameSDK', 'serialization')

**Returns:** `Logger` - Logger instance with error, warn, and log methods

**Example:**

```typescript
import { createLogger } from '@zomme/frame';

const logger = createLogger('z-frame');

logger.error('Failed to send message:', error);
logger.warn('Invalid message format:', message);
logger.log('Initialization complete');

// Output:
// [z-frame] Failed to send message: Error: ...
// [z-frame] Invalid message format: { ... }
// [z-frame] Initialization complete
```

**Usage in Components:**

The logger is used internally in Frame and FrameSDK for consistent logging:

```typescript
// Example usage in your code
import { createLogger } from '@zomme/frame';

const logger = createLogger('my-component');

class MyComponent {
  connectedCallback() {
    logger.log('Component initialized');

    if (!this.validate()) {
      logger.error('Validation failed');
      return;
    }
  }

  private handleMessage(event: MessageEvent) {
    logger.warn('Invalid message format:', event.data);
  }
}
```

## Log Levels

### Error Level

Use for errors that prevent normal operation:

```typescript
logger.error('Failed to send message:', error);
logger.error('MessagePort not ready');
logger.error('Function registry limit exceeded');
```

### Warning Level

Use for non-critical issues that may need attention:

```typescript
logger.warn('Invalid message format:', message);
logger.warn('Unknown message type:', type);
logger.warn('Ignoring duplicate INIT message');
```

### Log Level

Use for general information during development:

```typescript
logger.log('Initialization complete');
logger.log('Ready message received');
logger.log('Function registered:', fnId);
```

## Best Practices

### Use Consistent Prefixes

Use component-specific prefixes for clear attribution:

```typescript
// Good: Specific component prefix
const logger = createLogger('z-frame');
const sdkLogger = createLogger('frameSDK');
const serializationLogger = createLogger('serialization');

// Bad: Generic prefix
const logger = createLogger('app');
```

### Include Context

Add contextual information to logs:

```typescript
// Good: Include relevant context
logger.error('Failed to send message to iframe:', error);
logger.warn('Unknown message type:', message.type);
logger.log('Attribute changed:', attribute, 'to:', value);

// Bad: Generic error without context
logger.error('Error');
logger.error('Failed');
```

### Use for Debugging

Logs are useful for debugging issues:

```typescript
// Enable detailed logging during development
const logger = createLogger('debug-mode');

// Trace message flow
logger.log('Sending message:', message.type);
logger.log('Received message:', event.data.type);

// Trace function calls
logger.log('Calling remote function:', fnId);
logger.log('Function result:', result);
```

## Related

* **Source Code**: `src/helpers/logger.ts`
