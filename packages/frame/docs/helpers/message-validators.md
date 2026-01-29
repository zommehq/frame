# Message Validators

The message-validators module provides low-level message structure validation utilities used by both SDK and Frame.

## Overview

This module provides shared validation logic to reduce code duplication and ensure consistent validation across components.

## Import

```typescript
import {
  isValidMessageStructure,
  hasStringType,
  isWhitelistedMessageType,
  validateMessage,
} from '@zomme/frame';
```

## Functions

### `isValidMessageStructure(message)`

Check if message has valid structure (is object with type property).

**Parameters:**
* `message` (unknown) - Value to check

**Returns:** `message is { type: unknown }` - true if message has type property

**Example:**

```typescript
import { isValidMessageStructure } from '@zomme/frame';

if (isValidMessageStructure(data)) {
  // data.type is available (typed as unknown)
  console.log('Message type:', data.type);
}
```

---

### `hasStringType(message)`

Check if message type property is a string.

**Parameters:**
* `message` ({ type: unknown }) - Message with type property

**Returns:** `message is { type: string }` - true if type is string

**Example:**

```typescript
import { hasStringType } from '@zomme/frame';

if (hasStringType(data)) {
  // data.type is now typed as string
  console.log('Message type:', data.type);
}
```

---

### `isWhitelistedMessageType(type)`

Check if message type is in the whitelist of valid types.

**Parameters:**
* `type` (string) - Message type to check

**Returns:** `boolean` - true if type is valid

**Example:**

```typescript
import { isWhitelistedMessageType, VALID_MESSAGE_TYPES } from '@zomme/frame';

if (isWhitelistedMessageType(data.type)) {
  console.log('Valid message type');
} else {
  console.warn('Unknown message type:', data.type);
}
```

---

### `validateMessage(data, logPrefix)`

Complete message validation pipeline.

**Parameters:**
* `data` (unknown) - Data to validate
* `logPrefix` (string) - Prefix for log messages

**Returns:** `Message | null` - Validated message or null if invalid

**Example:**

```typescript
import { validateMessage } from '@zomme/frame';

const message = validateMessage(event.data, '[z-frame]');
if (message) {
  // message is typed as Message
  switch (message.type) {
    case '__INIT__':
      // Handle init
      break;
    case '__READY__':
      // Handle ready
      break;
  }
}
```

---

## Usage in Components

### Frame

```typescript
import { validateMessage } from '../helpers/message-validators';

private _handleMessage(event: MessageEvent) {
  const message = validateMessage(event.data, '[z-frame]');
  if (!message) {
    return;
  }

  switch (message.type) {
    case MessageEvent.READY:
      this._ready = true;
      break;
  }
}
```

### FrameSDK

```typescript
import { validateMessage } from '../helpers/message-validators';

private _handleMessage(event: MessageEvent) {
  const message = validateMessage(event.data, '[frameSDK]');
  if (!message) {
    return;
  }

  switch (message.type) {
    case MessageEvent.EVENT:
      this._emitLocalEvent(message.name, message.data);
      break;
  }
}
```

---

## Related

* **Type Guards**: See [Type Guards](./type-guards.md) for runtime type checking
* **Source Code**: `src/helpers/message-validators.ts`
