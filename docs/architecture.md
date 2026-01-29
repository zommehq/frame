# Micro-Frontend Architecture

## Estrutura do Projeto

```text
micro-fe/
├── packages/
│   └── frame/                  # Web Component + SDK compartilhado
│       ├── src/
│       │   ├── frame.ts                # <z-frame> Web Component
│       │   ├── sdk.ts                  # SDK para apps (frameSDK)
│       │   ├── types.ts                # TypeScript types
│       │   ├── constants.ts            # Message types
│       │   └── helpers/
│       │       ├── function-manager.ts # Function serialization/RPC
│       │       ├── serialization.ts    # Value serialization
│       │       └── string-utils.ts     # String helpers
│       ├── tests/                      # Test files
│       ├── docs/                       # Documentation
│       └── dist/                       # Build outputs
├── apps/
│   ├── app-shell/       # Angular Shell (orquestrador)
│   ├── app-angular/     # Micro-app Angular
│   ├── app-vue/         # Micro-app Vue 3
│   ├── app-react/       # Micro-app React 18
│   └── app-solid/       # Micro-app SolidJS
└── package.json         # Workspace root
```

## Conceitos Principais

### 1. Web Component como Proxy Puro

* `<z-frame>` encapsula iframe e comunicação
* Zero side-effects (sem history, fetch, localStorage)
* Interface declarativa: props/attributes → events
* *Serialização automática de funções* via UUID tokens

### 2. SDK para Abstrair Comunicação

* Apps não sabem que estão em iframe
* API simples: `frameSDK.props`, `emit()`, `on()`
* Transparente para qualquer framework
* *Funções podem ser passadas bidirecionalmente*

### 3. Shell como Orquestrador

* Única fonte de verdade para routing
* Gerencia todos os micro-apps
* Sincroniza navegação entre apps

## Fluxo de Comunicação

```text
App (Angular) → frameSDK → postMessage → <z-frame> → CustomEvent → Shell
```

*Exemplo de Navegação:*

1. User clica link em micro-app Angular (`/angular/users`)
2. Angular Router intercepta
3. SDK emite evento: `frameSDK.emit('navigate', { path: '/angular/users' })`
4. SDK envia postMessage para Web Component
5. Web Component emite DOM CustomEvent `navigate`
6. Shell escuta evento e executa `router.navigateByUrl('/angular/users')`
7. Browser URL atualiza

## Function Serialization (Zoid/post-robot approach)

Funções são serializadas automaticamente usando UUID tokens:

```typescript
// Parent passa função
frame.onSuccess = (data) => console.log('Success:', data);

// Child recebe proxy e pode chamar
frameSDK.props.onSuccess({ status: 'ok' }); // RPC call
```

### Como funciona

1. *Serialização*: Funções são substituídas por tokens `{ __fn: 'uuid-123' }`
2. *Registry*: Map mantém UUID → Function
3. *Proxy*: Função proxy cria RPC call via postMessage
4. *Execução*: Lado remoto executa função original
5. *Retorno*: Resultado serializado e enviado de volta
6. *Garbage Collection*: Cleanup automático no disconnect

### Características

* ✅ Suporta valores de retorno
* ✅ Suporta Promises (async/await)
* ✅ Suporta nested functions
* ✅ Timeout de 10s em calls
* ✅ Garbage collection automático
* ✅ Bidirecionall (parent ↔ child)

### Diagrama de Sequência

```text
Parent                  postMessage              Child
  │                                               │
  ├─ frame.onSuccess = fn ──────────────────────>│
  │  { __fn: 'uuid-123' }                        │
  │                                               │
  │<────────────────────── props.onSuccess() ────┤
  │  FUNCTION_CALL                                │
  │  { fnId: 'uuid-123', params: [...] }         │
  │                                               │
  ├─ Execute fn(params) ────────────────────────>│
  │  FUNCTION_RESPONSE                            │
  │  { success: true, result: ... }              │
  │                                               │
```

## Transferables Support

Para melhor performance, objetos transferíveis são automaticamente detectados e transferidos (ownership transfer) ao invés de clonados:

### Objetos Suportados

* `ArrayBuffer`
* `MessagePort`
* `ImageBitmap`
* `OffscreenCanvas`
* `ReadableStream`
* `WritableStream`
* `TransformStream`

### Vantagens

* ✅ Zero-copy transfer (não clona dados)
* ✅ Melhor performance para dados grandes
* ✅ Menor uso de memória
* ✅ Detecção automática

### Exemplo

```typescript
// Child envia ArrayBuffer (1MB)
const buffer = new ArrayBuffer(1024 * 1024);
frameSDK.emit('large-data', { buffer });
// buffer é transferido, não clonado

// Parent processa
frame.addEventListener('large-data', (e) => {
  const { buffer } = e.detail;
  processBuffer(buffer); // ownership transferido
});
```

## Ciclo de Vida

### 1. Inicialização

```text
┌─────────────────┐                    ┌──────────────┐
│    z-frame      │                    │   iframe     │
└────────┬────────┘                    └──────┬───────┘
         │                                    │
         ├─ connectedCallback()               │
         ├─ Create iframe                     │
         ├─ Setup message listener            │
         ├─ Append iframe to DOM              │
         │                                    │
         ├─ __INIT__ ────────────────────────>│
         │  { name, base, props }             │
         │                                    │
         │<─────────────────────── __READY__ ─┤
         │                                    │
         ├─ Dispatch 'ready' event            │
         │                                    │
```

### 2. Property Updates

```text
┌─────────────────┐                    ┌──────────────┐
│    z-frame      │                    │   iframe     │
└────────┬────────┘                    └──────┬───────┘
         │                                    │
         ├─ frame.theme = 'dark'              │
         │  (via Proxy set trap)              │
         │                                    │
         ├─ __ATTRIBUTE_CHANGE__ ────────────>│
         │  { attribute: 'theme',             │
         │    value: 'dark' }                 │
         │                                    │
         │                                    ├─ props.theme = 'dark'
         │                                    ├─ Trigger watch handlers
         │                                    │
```

### 3. Events

```text
┌─────────────────┐                    ┌──────────────┐
│    z-frame      │                    │   iframe     │
└────────┬────────┘                    └──────┬───────┘
         │                                    │
         │                                    ├─ frameSDK.emit('action', data)
         │                                    │
         │<─────────────── __CUSTOM_EVENT__ ──┤
         │  { name: 'action', data: ... }    │
         │                                    │
         ├─ dispatchEvent(CustomEvent)        │
         │                                    │
```

### 4. Cleanup

```text
┌─────────────────┐                    ┌──────────────┐
│    z-frame      │                    │   iframe     │
└────────┬────────┘                    └──────┬───────┘
         │                                    │
         ├─ disconnectedCallback()            │
         │                                    │
         ├─ __FUNCTION_RELEASE__ ────────────>│
         │  { fnId: 'uuid-123' }              │
         │  { fnId: 'uuid-456' }              │
         │  ...                               │
         │                                    │
         │                                    ├─ Delete functions from registry
         │                                    │
         ├─ Cleanup function manager          │
         ├─ Remove iframe                     │
         │                                    │
```

## Message Protocol

### Message Types

| Type | Descrição |
|------|-----------|
| `__INIT__` | Parent → Child. Configuração inicial com props |
| `__READY__` | Child → Parent. Sinaliza que está pronto |
| `__ATTRIBUTE_CHANGE__` | Parent → Child. Mudança de prop/attribute |
| `__EVENT__` | Parent → Child. Evento enviado via `frame.emit()` |
| `__CUSTOM_EVENT__` | Child → Parent. Evento enviado via `frameSDK.emit()` |
| `__FUNCTION_CALL__` | Bidirectional. Chamada de função remota |
| `__FUNCTION_RESPONSE__` | Bidirectional. Resposta de função remota |
| `__FUNCTION_RELEASE__` | Bidirectional. Liberar função do registry |

### Estrutura das Mensagens

```typescript
// INIT
{
  type: '__INIT__',
  payload: {
    name: string,
    base: string,
    [key: string]: unknown  // custom props
  }
}

// ATTRIBUTE_CHANGE
{
  type: '__ATTRIBUTE_CHANGE__',
  attribute: string,
  value: unknown  // serialized value
}

// FUNCTION_CALL
{
  type: '__FUNCTION_CALL__',
  callId: string,        // UUID para matching response
  fnId: string,          // UUID da função
  params: unknown[]      // serialized parameters
}

// FUNCTION_RESPONSE
{
  type: '__FUNCTION_RESPONSE__',
  callId: string,
  success: boolean,
  result?: unknown,      // se success=true
  error?: string         // se success=false
}
```

## Security

### Origin Validation

Todas as mensagens validam origin:

```typescript
window.addEventListener('message', (event) => {
  if (event.origin !== this.parentOrigin) return;  // ✅ Valida origin
  // Process message
});
```

### Sandbox Attributes

O iframe usa sandbox para isolamento:

```html
<iframe sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals">
```

### Function Timeout

Chamadas de função têm timeout de 10s para prevenir locks:

```typescript
const timeout = setTimeout(() => {
  reject(new Error(`Function call timeout: ${fnId}`));
}, 10000);
```

## Referências

* [Frame Documentation](../packages/frame/README.md)
* [Detailed Architecture](../packages/frame/docs/concepts/architecture.md)
* [Function Serialization](../packages/frame/docs/advanced/function-serialization.md)
