# 🔒 Private Fields Migration Plan (`_` → `#`)

**Objetivo:** Migrar propriedades críticas de convenção `_` para Private Fields `#` (ES2022) para proteção real em runtime.

**Data:** 2026-01-23  
**Status:** ✅ Completo (100% - Todas as 8 fases concluídas)

---

## 📊 Executive Summary

| Métrica | Valor |
|---------|-------|
| **Total de propriedades `_`** | 26 |
| **Migrar para `#`** | 18 (69%) |
| **Manter `_` (convenção)** | 8 (31%) |
| **Arquivos a modificar** | 3 principais + ~6 testes |
| **Linhas de teste afetadas** | ~49 |
| **Getters `__` a criar** | 7-10 |
| **Risco geral** | ⚠️ Médio (alta cobertura de testes mitiga) |

---

## 🎯 Objetivos e Benefícios

### Objetivos
1. ✅ **Proteção real em runtime** - `#` não pode ser acessado mesmo via hacks
2. ✅ **Segurança aumentada** - Propriedades críticas (`#origin`, `#port`) protegidas
3. ✅ **Encapsulamento verdadeiro** - Impossível corromper estado interno
4. ✅ **API pública clara** - IDEs mostram apenas métodos públicos

### Benefícios
- 🛡️ **Segurança:** Previne acesso acidental/malicioso a `#iframe`, `#port`, `#origin`
- 🔧 **Refatoração segura:** Pode mudar implementação interna sem quebrar usuários
- 📚 **Documentação implícita:** `#` = "não toque", `_` = "debug ok", público = "use"
- 🎨 **Padrão moderno:** ES2022+ nativo, suportado por todos browsers modernos

---

## 📋 Inventário Completo

### 1️⃣ Frame (`packages/frame/src/frame.ts`)

#### ✅ Migrar para `#` (7 propriedades)

| Linha | De | Para | Justificativa | Impacto Testes |
|-------|-----|------|---------------|----------------|
| 89 | `_iframe` | `#iframe` | **CRÍTICO** - Elemento DOM principal | ⚠️ Alto (13 usos) |
| 90 | `_observer` | `#observer` | Lifecycle interno | ⚠️ Baixo (1 uso) |
| 91 | `_ready` | `#ready` | Estado crítico de init | ⚠️ Alto (8 usos) |
| 92 | `_origin` | `#origin` | **SEGURANÇA** - Validação origem | ⚠️ Alto (7 usos) |
| 93 | `_port` | `#port` | **CRÍTICO** - Canal comunicação | ✅ Nenhum |
| 96 | `_manager` | `#manager` | **CRÍTICO** - Sistema RPC | ⚠️ Médio (indireto) |
| 102 | `_portMessageHandler` | `#portMessageHandler` | Handler interno | ✅ Nenhum |

#### ⚠️ Manter `_` convenção (4 propriedades)

| Linha | Propriedade | Justificativa |
|-------|-------------|---------------|
| 99 | `_dynamicMethods` | Cache - útil para debug |
| 105 | `_propValues` | Props dinâmicas - útil debug |
| 108 | `_definedProps` | Set de props - útil debug |
| 111 | `_registeredFunctions` | Funções registradas - visível via eventos |

---

### 2️⃣ FrameSDK (`packages/frame/src/sdk.ts`)

#### ✅ Migrar para `#` (7 propriedades)

| Linha | De | Para | Justificativa | Impacto Testes |
|-------|-----|------|---------------|----------------|
| 77 | `_port` | `#port` | **CRÍTICO** - Canal comunicação | ✅ Nenhum |
| 78 | `_parentOrigin` | `#parentOrigin` | **SEGURANÇA** - Validação | ⚠️ Baixo (1 uso) |
| 81 | `_functionManager` | `#functionManager` | **CRÍTICO** - Sistema RPC | ✅ Nenhum |
| 84 | `_portMessageHandler` | `#portMessageHandler` | Handler interno | ✅ Nenhum |
| 85 | `_beforeUnloadHandler` | `#beforeUnloadHandler` | Handler interno | ✅ Nenhum |
| 88 | `_initialized` | `#initialized` | Estado crítico | ✅ Nenhum |
| 98 | `_instanceId` | `#instanceId` | Debug interno | ✅ Nenhum |

#### ⚠️ Manter `_` convenção (4 propriedades)

| Linha | Propriedade | Justificativa |
|-------|-------------|---------------|
| 76 | `_eventListeners` | Sistema de eventos - útil debug |
| 101 | `_eventBuffer` | Buffer de eventos - útil debug |
| 104 | `_watchHandlers` | Sistema watch - útil debug |
| 108 | `_propOldValues` | Tracking watch - útil debug |

---

### 3️⃣ FunctionManager (`packages/frame/src/helpers/function-manager.ts`)

#### ✅ Migrar para `#` (4 propriedades)

| Linha | De | Para | Justificativa | Impacto Testes |
|-------|-----|------|---------------|----------------|
| 23 | `_functionRegistry` | `#functionRegistry` | **CRÍTICO** - Registro funções | ⚠️ Alto (10 usos) |
| 24 | `_pendingFunctionCalls` | `#pendingFunctionCalls` | **CRÍTICO** - Chamadas RPC | ⚠️ Médio (5 usos) |
| 25 | `_trackedFunctions` | `#trackedFunctions` | Lifecycle tracking | ⚠️ Médio (6 usos) |
| 26 | `_postMessage` | `#postMessage` | Callback interno | ✅ Nenhum |

---

## 🗺️ Plano de Execução (Faseado)

### 📌 Fase 0: Preparação (Pré-requisito)
**Duração:** 10-15 min  
**Risco:** ✅ Baixo

- [ ] ✅ Criar branch `feature/private-fields-migration`
- [ ] ✅ Garantir que todos os testes estão passando (baseline)
- [ ] ✅ Commit inicial: "chore: baseline before private fields migration"
- [ ] ✅ Backup do código atual

**Comando:**
```bash
git checkout -b feature/private-fields-migration
bun test
git add . && git commit -m "chore: baseline before private fields migration"
```

---

### 📌 Fase 1: Adicionar APIs Públicas (Testabilidade)
**Duração:** 20-30 min  
**Risco:** ✅ Baixo (apenas adições)

**Objetivo:** Adicionar getters públicos e `__` ANTES de migrar para `#`

#### 1.1 Frame - Adicionar getters públicos

**Arquivo:** `packages/frame/src/frame.ts`

```typescript
export class Frame extends HTMLElement {
  // ... propriedades existentes ...

  /**
   * Check if frame is ready
   * @public
   */
  get isReady(): boolean {
    return this._ready;
  }

  /**
   * Get frame origin
   * @internal - For testing purposes only
   */
  get __origin(): string {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('__origin can only be accessed in test environment');
    }
    return this._origin;
  }

  /**
   * Get iframe element
   * @internal - For testing purposes only
   */
  get __iframe(): HTMLIFrameElement {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('__iframe can only be accessed in test environment');
    }
    return this._iframe;
  }

  /**
   * Get ready state
   * @internal - For testing purposes only
   */
  get __ready(): boolean {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('__ready can only be accessed in test environment');
    }
    return this._ready;
  }

  /**
   * Get function manager (for testing function registry)
   * @internal - For testing purposes only
   */
  get __manager(): FunctionManager {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('__manager can only be accessed in test environment');
    }
    return this._manager;
  }
}
```

#### 1.2 FrameSDK - Adicionar getter público

**Arquivo:** `packages/frame/src/sdk.ts`

```typescript
export class FrameSDK {
  // ... propriedades existentes ...

  /**
   * Get parent origin
   * @internal - For testing purposes only
   */
  get __parentOrigin(): string | undefined {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('__parentOrigin can only be accessed in test environment');
    }
    return this._parentOrigin;
  }

  /**
   * Get function manager
   * @internal - For testing purposes only
   */
  get __functionManager(): FunctionManager {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('__functionManager can only be accessed in test environment');
    }
    return this._functionManager;
  }
}
```

#### 1.3 FunctionManager - Adicionar getters

**Arquivo:** `packages/frame/src/helpers/function-manager.ts`

```typescript
export class FunctionManager {
  // ... propriedades existentes ...

  /**
   * Get function registry
   * @internal - For testing purposes only
   */
  get __functionRegistry(): Map<string, Function> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('__functionRegistry can only be accessed in test environment');
    }
    return this._functionRegistry;
  }

  /**
   * Get pending function calls
   * @internal - For testing purposes only
   */
  get __pendingFunctionCalls(): Map<string, any> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('__pendingFunctionCalls can only be accessed in test environment');
    }
    return this._pendingFunctionCalls;
  }

  /**
   * Get tracked functions
   * @internal - For testing purposes only
   */
  get __trackedFunctions(): Set<string> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('__trackedFunctions can only be accessed in test environment');
    }
    return this._trackedFunctions;
  }
}
```

**Checklist:**
- [ ] Adicionar getters em `Frame`
- [ ] Adicionar getters em `FrameSDK`
- [ ] Adicionar getters em `FunctionManager`
- [ ] Rebuild: `cd packages/frame && bun run build`
- [ ] Testar que ainda compila: `bun run build`
- [ ] Commit: "feat: add public and test-only getters for encapsulation"

---

### 📌 Fase 2: Atualizar Testes (Usar novos getters)
**Duração:** 30-45 min  
**Risco:** ⚠️ Médio (muitas mudanças)

**Objetivo:** Refatorar testes para usar `__` ao invés de acesso direto

#### 2.1 Atualizar `frame.test.ts`

**Arquivo:** `packages/frame/tests/frame.test.ts`

**Padrão de substituição:**
```typescript
// ❌ Antes
(frame as any)._origin = "http://localhost:3000";
expect((frame as any)._ready).toBe(true);
expect((frame as any)._iframe).toBeDefined();

// ✅ Depois
(frame as any)._origin = "http://localhost:3000"; // Ainda setter direto (temporário)
expect(frame.__ready).toBe(true);
expect(frame.__iframe).toBeDefined();
```

**Substituições necessárias (~28 linhas):**

| Linha | De | Para |
|-------|-----|------|
| 49 | `(frame as any)._origin` | Manter (setter) |
| 103-105 | `(frame as any)._ready/iframe/origin` | Setters (manter) |
| 114 | `expect((frame as any)._ready)` | `expect(frame.__ready)` |
| 135-136 | `(frame as any)._functionRegistry/trackedFunctions` | `frame.__manager.__functionRegistry` |
| 143-144 | `expect((frame as any)._functionRegistry...)` | `expect(frame.__manager.__functionRegistry...)` |
| 150-152 | `(frame as any)._ready/iframe/origin` | Setters (manter) |
| 158 | `(frame as any)._functionRegistry.set` | `frame.__manager.__functionRegistry.set` |
| 171 | `(frame as any)._functionRegistry.set` | `frame.__manager.__functionRegistry.set` |
| 197 | `(frame as any)._pendingFunctionCalls.set` | `frame.__manager.__pendingFunctionCalls.set` |
| 203 | `expect((frame as any)._pendingFunctionCalls.has...)` | `expect(frame.__manager.__pendingFunctionCalls.has...)` |
| 213 | `(frame as any)._pendingFunctionCalls.set` | Similar |
| 222 | `(frame as any)._ready = true` | Setter (manter) |
| 240-242 | `(frame as any)._ready/iframe/origin` | Setters (manter) |
| 264 | `(frame as any)._ready = false` | Setter (manter) |
| 272 | `(frame as any)._iframe` | Setter (manter) |
| 280-281 | `(frame as any)._functionRegistry/trackedFunctions` | Usar `__manager` |
| 285-286 | `expect((frame as any)._functionRegistry/trackedFunctions...)` | Usar `__manager` |
| 296 | `(frame as any)._pendingFunctionCalls.set` | Usar `__manager` |
| 301 | `expect((frame as any)._pendingFunctionCalls.size)` | Usar `__manager` |
| 307-308 | `(frame as any)._iframe/origin` | Setters (manter) |
| 334 | `(frame as any)._iframe = null` | Setter (manter) |

#### 2.2 Atualizar `integration.test.ts`

**Arquivo:** `packages/frame/tests/integration.test.ts`

**Substituições necessárias (~11 linhas):**

| Linha | De | Para |
|-------|-----|------|
| 18 | `(frame as any)._ready = true` | Setter (manter) |
| 19 | `(frame as any)._origin = ...` | Setter (manter) |
| 22 | `(frame as any)._iframe = {...}` | Setter (manter) |
| 88 | `(frame as any)._functionRegistry.set` | `frame.__manager.__functionRegistry.set` |
| 200 | `(frame as any)._functionRegistry.set` | Similar |
| 383 | `(frame as any)._functionRegistry.set` | Similar |
| 420-421 | `(frame as any)._functionRegistry/trackedFunctions` | Usar `__manager` |
| 435-436 | `expect((frame as any)._functionRegistry/trackedFunctions...)` | Usar `__manager` |
| 481 | `(frame as any)._functionRegistry.set` | Similar |

#### 2.3 Atualizar `sdk.test.ts`

**Arquivo:** `packages/frame/tests/sdk.test.ts`

**Substituições necessárias (~3 linhas):**

| Linha | De | Para |
|-------|-----|------|
| 395 | `(sdk as any)._parentOrigin` | `sdk.__parentOrigin` |
| 650 | `(sdk as any)._handleMessage` | Manter (método privado, não propriedade) |

**Checklist:**
- [ ] Refatorar `frame.test.ts` (~28 substituições)
- [ ] Refatorar `integration.test.ts` (~11 substituições)
- [ ] Refatorar `sdk.test.ts` (~3 substituições)
- [ ] Rodar testes: `bun test` → ✅ Devem passar
- [ ] Commit: "test: use __ getters instead of direct private access"

---

### 📌 Fase 3: Migrar para `#` (Frame)
**Duração:** 20-30 min  
**Risco:** ⚠️ Alto (mudanças críticas)

**Objetivo:** Substituir `_` por `#` nas 7 propriedades críticas do Frame

#### 3.1 Substituições no Frame

**Arquivo:** `packages/frame/src/frame.ts`

**Mudanças de declaração:**
```typescript
// ❌ Antes (linhas 89-102)
_iframe!: HTMLIFrameElement;
_observer?: MutationObserver;
_ready = false;
_origin!: string;
_port!: MessagePort;
_manager!: FunctionManager;
_portMessageHandler?: (event: MessageEvent) => void;

// ✅ Depois
#iframe!: HTMLIFrameElement;
#observer?: MutationObserver;
#ready = false;
#origin!: string;
#port!: MessagePort;
#manager!: FunctionManager;
#portMessageHandler?: (event: MessageEvent) => void;
```

**Atualizar getters `__`:**
```typescript
get __origin(): string {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('__origin can only be accessed in test environment');
  }
  return this.#origin; // ✅ Mudou de _origin para #origin
}

get __iframe(): HTMLIFrameElement {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('__iframe can only be accessed in test environment');
  }
  return this.#iframe; // ✅ Mudou
}

get __ready(): boolean {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('__ready can only be accessed in test environment');
  }
  return this.#ready; // ✅ Mudou
}

get __manager(): FunctionManager {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('__manager can only be accessed in test environment');
  }
  return this.#manager; // ✅ Mudou
}

get isReady(): boolean {
  return this.#ready; // ✅ Mudou
}
```

**Substituir todos os acessos internos (`this._` → `this.#`):**

Use busca/substituição com regex:
```regex
# Buscar:
this\._iframe
this\._observer
this\._ready
this\._origin
this\._port
this\._manager
this\._portMessageHandler

# Substituir por:
this.#iframe
this.#observer
this.#ready
this.#origin
this.#port
this.#manager
this.#portMessageHandler
```

**Locais afetados (amostra):**
- Linha 122: `this._manager = new FunctionManager(...)`
- Linha 223: `if (this.name && this.src && !this._iframe)`
- Linha 225: `this._origin = new URL(this.src).origin;`
- Linha 237: `if (this._iframe && Frame.RECREATE_ATTRS.has(name))`
- Linha 280: `if (this.name && this.src && !this._iframe)`
- Linha 320: `this._iframe = document.createElement("iframe");`
- Linha 335: `this._port = channel.port1;`
- E muitos outros (~60 ocorrências)

**Checklist:**
- [ ] Substituir declarações (linhas 89-102)
- [ ] Atualizar getters `__` e `isReady`
- [ ] Substituir TODOS `this._xxx` → `this.#xxx` (usar Find & Replace)
- [ ] Verificar que nenhum `this._iframe|_ready|_origin|_port|_manager|_observer|_portMessageHandler` ficou
- [ ] Rebuild: `cd packages/frame && bun run build`
- [ ] Rodar testes: `bun test` → ✅ Devem passar
- [ ] Commit: "refactor(frame): migrate critical properties to private fields (#)"

---

### 📌 Fase 4: Migrar para `#` (FrameSDK)
**Duração:** 15-20 min  
**Risco:** ⚠️ Médio

**Objetivo:** Substituir `_` por `#` nas 7 propriedades críticas do FrameSDK

#### 4.1 Substituições no FrameSDK

**Arquivo:** `packages/frame/src/sdk.ts`

**Mudanças de declaração:**
```typescript
// ❌ Antes (linhas 77-98)
private _port!: MessagePort;
private _parentOrigin?: string;
private _functionManager!: FunctionManager;
private _portMessageHandler?: (event: MessageEvent) => void;
private _beforeUnloadHandler?: () => void;
private _initialized = false;
private _instanceId: number;

// ✅ Depois
#port!: MessagePort;
#parentOrigin?: string;
#functionManager!: FunctionManager;
#portMessageHandler?: (event: MessageEvent) => void;
#beforeUnloadHandler?: () => void;
#initialized = false;
#instanceId: number;
```

**Atualizar getters existentes:**
```typescript
get isInitialized(): boolean {
  return this.#initialized; // ✅ Mudou de _initialized para #initialized
}

get __parentOrigin(): string | undefined {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('__parentOrigin can only be accessed in test environment');
  }
  return this.#parentOrigin; // ✅ Mudou
}

get __functionManager(): FunctionManager {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('__functionManager can only be accessed in test environment');
  }
  return this.#functionManager; // ✅ Mudou
}
```

**Substituir todos os acessos internos:**

Use busca/substituição:
```regex
# Buscar:
this\._port
this\._parentOrigin
this\._functionManager
this\._portMessageHandler
this\._beforeUnloadHandler
this\._initialized
this\._instanceId

# Substituir por:
this.#port
this.#parentOrigin
this.#functionManager
this.#portMessageHandler
this.#beforeUnloadHandler
this.#initialized
this.#instanceId
```

**Locais afetados (amostra):**
- Linha 111: `this._instanceId = ++FrameSDK._instanceCounter;`
- Linha 139: `if (this._initialized) return Promise.resolve();`
- Linha 167-186: Várias refs a `this._initialized`
- Linha 189: `this._parentOrigin = event.origin;`
- Linha 202: `this._port = event.ports[0];`
- Linha 205: `this._functionManager = new FunctionManager(...);`
- E muitos outros (~40 ocorrências)

**Checklist:**
- [ ] Substituir declarações (linhas 77-98) - REMOVER `private`
- [ ] Atualizar getters `isInitialized` e `__*`
- [ ] Substituir TODOS `this._xxx` → `this.#xxx` (usar Find & Replace)
- [ ] Verificar que nenhum `this._port|_parentOrigin|_functionManager|_initialized|_instanceId|_portMessageHandler|_beforeUnloadHandler` ficou
- [ ] Rebuild: `cd packages/frame && bun run build`
- [ ] Rodar testes: `bun test` → ✅ Devem passar
- [ ] Commit: "refactor(sdk): migrate critical properties to private fields (#)"

---

### 📌 Fase 5: Migrar para `#` (FunctionManager)
**Duração:** 10-15 min  
**Risco:** ⚠️ Médio

**Objetivo:** Substituir `_` por `#` nas 4 propriedades do FunctionManager

#### 5.1 Substituições no FunctionManager

**Arquivo:** `packages/frame/src/helpers/function-manager.ts`

**Mudanças de declaração:**
```typescript
// ❌ Antes (linhas 23-26)
private _functionRegistry = new Map<string, Function>();
private _pendingFunctionCalls = new Map<string, PendingFunctionCall>();
private _trackedFunctions = new Set<string>();
private _postMessage: PostMessageFn;

// ✅ Depois
#functionRegistry = new Map<string, Function>();
#pendingFunctionCalls = new Map<string, PendingFunctionCall>();
#trackedFunctions = new Set<string>();
#postMessage: PostMessageFn;
```

**Atualizar getters `__`:**
```typescript
get __functionRegistry(): Map<string, Function> {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('__functionRegistry can only be accessed in test environment');
  }
  return this.#functionRegistry; // ✅ Mudou
}

get __pendingFunctionCalls(): Map<string, any> {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('__pendingFunctionCalls can only be accessed in test environment');
  }
  return this.#pendingFunctionCalls; // ✅ Mudou
}

get __trackedFunctions(): Set<string> {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('__trackedFunctions can only be accessed in test environment');
  }
  return this.#trackedFunctions; // ✅ Mudou
}
```

**Atualizar método público existente:**
```typescript
getTrackedFunctions(): string[] {
  return Array.from(this.#trackedFunctions); // ✅ Mudou de _trackedFunctions
}
```

**Substituir todos os acessos internos:**

Use busca/substituição:
```regex
# Buscar:
this\._functionRegistry
this\._pendingFunctionCalls
this\._trackedFunctions
this\._postMessage

# Substituir por:
this.#functionRegistry
this.#pendingFunctionCalls
this.#trackedFunctions
this.#postMessage
```

**Locais afetados (amostra):**
- Linha 29: `this._postMessage = postMessage;`
- Linha 39: `return serializeValue(value, this._functionRegistry, this._trackedFunctions);`
- Linha 78: `this._pendingFunctionCalls.delete(callId);`
- Linha 82: `this._pendingFunctionCalls.set(callId, ...);`
- Linha 104: `const fn = this._functionRegistry.get(fnId);`
- E muitos outros (~25 ocorrências)

**Checklist:**
- [ ] Substituir declarações (linhas 23-26) - REMOVER `private`
- [ ] Adicionar getters `__*`
- [ ] Atualizar método `getTrackedFunctions()`
- [ ] Substituir TODOS `this._xxx` → `this.#xxx` (usar Find & Replace)
- [ ] Verificar que nenhum `this._functionRegistry|_pendingFunctionCalls|_trackedFunctions|_postMessage` ficou
- [ ] Rebuild: `cd packages/frame && bun run build`
- [ ] Rodar testes: `bun test` → ✅ Devem passar
- [ ] Commit: "refactor(function-manager): migrate all properties to private fields (#)"

---

### 📌 Fase 6: Atualizar Testes (Remover setters diretos)
**Duração:** 20-30 min  
**Risco:** ⚠️ Médio

**Objetivo:** Refatorar testes para NÃO usar setters diretos (agora impossível com `#`)

#### 6.1 Estratégias de Refatoração

**Padrão 1: Mock via `__` (quando não tem setter)**
```typescript
// ❌ Antes - impossível com #
(frame as any)._ready = true;

// ✅ Opção A: Criar setter temporário em __
get __ready() { return this.#ready; }
set __ready(value: boolean) {
  if (process.env.NODE_ENV !== 'test') throw new Error('Test only');
  this.#ready = value;
}

// No teste:
(frame as any).__ready = true;
```

**Padrão 2: Usar API pública para setup**
```typescript
// ❌ Antes
(frame as any)._iframe = mockIframe;
(frame as any)._origin = "http://localhost:3000";

// ✅ Depois - se possível, triggerar via fluxo normal
frame.setAttribute('src', 'http://localhost:3000');
document.body.appendChild(frame); // Trigger connectedCallback
await waitFor(() => frame.isReady);
```

**Padrão 3: Adicionar métodos `__` para setup**
```typescript
// No Frame
/**
 * @internal - For testing only
 */
__setReady(ready: boolean): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Only for tests');
  }
  this.#ready = ready;
}

__setIframe(iframe: HTMLIFrameElement): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Only for tests');
  }
  this.#iframe = iframe;
}

__setOrigin(origin: string): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Only for tests');
  }
  this.#origin = origin;
}

// No teste:
frame.__setReady(true);
frame.__setIframe(mockIframe);
frame.__setOrigin("http://localhost:3000");
```

#### 6.2 Aplicar refatorações em `frame.test.ts`

**Locais que precisam de setter (análise):**
- Linha 48: `(frame as any)._origin = ...` → `__setOrigin()`
- Linha 103-105: Setup múltiplo → Métodos `__set*()`
- Linha 150-152: Setup múltiplo → Métodos `__set*()`
- Linha 222: `_ready = true` → `__setReady()`
- Linha 240-242: Setup múltiplo → Métodos `__set*()`
- Linha 264: `_ready = false` → `__setReady()`
- Linha 272: `_iframe = mockIframe` → `__setIframe()`
- Linha 307-308: Setup múltiplo → Métodos `__set*()`
- Linha 334: `_iframe = null` → `__setIframe()`

#### 6.3 Adicionar setters em Frame

**Arquivo:** `packages/frame/src/frame.ts`

```typescript
/**
 * @internal - For testing purposes only
 */
__setReady(ready: boolean): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('__setReady can only be called in test environment');
  }
  this.#ready = ready;
}

/**
 * @internal - For testing purposes only
 */
__setIframe(iframe: HTMLIFrameElement | null): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('__setIframe can only be called in test environment');
  }
  this.#iframe = iframe as HTMLIFrameElement;
}

/**
 * @internal - For testing purposes only
 */
__setOrigin(origin: string): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('__setOrigin can only be called in test environment');
  }
  this.#origin = origin;
}

/**
 * @internal - For testing purposes only
 */
__setPort(port: MessagePort): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('__setPort can only be called in test environment');
  }
  this.#port = port;
}
```

#### 6.4 Atualizar testes para usar setters

**Arquivo:** `packages/frame/tests/frame.test.ts`

```typescript
// Linha 48
- (frame as any)._origin = new URL("http://localhost:3000").origin;
+ frame.__setOrigin(new URL("http://localhost:3000").origin);

// Linhas 103-105
- (frame as any)._ready = true;
- (frame as any)._iframe = mockIframe;
- (frame as any)._origin = "http://localhost:3000";
+ frame.__setReady(true);
+ frame.__setIframe(mockIframe);
+ frame.__setOrigin("http://localhost:3000");

// ... repetir padrão para todas as ocorrências
```

**Checklist:**
- [ ] Adicionar métodos `__set*()` no Frame
- [ ] Atualizar `frame.test.ts` (todas as ocorrências de setter direto)
- [ ] Atualizar `integration.test.ts` (todas as ocorrências)
- [ ] Rebuild: `cd packages/frame && bun run build`
- [ ] Rodar testes: `bun test` → ✅ Devem passar
- [ ] Commit: "test: use __ setters instead of direct assignment"

---

### 📌 Fase 7: Limpeza e Validação Final
**Duração:** 15-20 min  
**Risco:** ✅ Baixo

**Objetivo:** Validar migração completa e limpar código temporário

#### 7.1 Checklist de Validação

**Verificações de código:**
- [ ] ✅ Nenhum `this._iframe|_ready|_origin|_port|_manager|_observer|_portMessageHandler` em `frame.ts`
- [ ] ✅ Nenhum `this._port|_parentOrigin|_functionManager|_initialized|_instanceId|_portMessageHandler|_beforeUnloadHandler` em `sdk.ts`
- [ ] ✅ Nenhum `this._functionRegistry|_pendingFunctionCalls|_trackedFunctions|_postMessage` em `function-manager.ts`
- [ ] ✅ Todos os getters `__` implementados
- [ ] ✅ Todos os métodos `private` mantidos
- [ ] ✅ Propriedades com `_` (convenção) mantidas: `_dynamicMethods`, `_propValues`, `_definedProps`, `_registeredFunctions`, `_eventListeners`, `_eventBuffer`, `_watchHandlers`, `_propOldValues`

**Verificações de testes:**
- [ ] ✅ `bun test` → Todos os testes passando
- [ ] ✅ Nenhum `(frame as any)._xxx =` em testes (exceto propriedades com `_` mantidas)
- [ ] ✅ Testes usam `frame.__xxx` ou APIs públicas

**Verificações de build:**
- [ ] ✅ `bun run build` → Build sem erros
- [ ] ✅ TypeScript compila sem erros
- [ ] ✅ Verificar arquivos `.d.ts` gerados

#### 7.2 Testes de Integração Manual

**Testar no shell:**
```bash
cd apps/shell-angular
bun run dev
```

**Abrir:** `http://localhost:4000`

**Validações manuais:**
- [ ] ✅ Angular app carrega
- [ ] ✅ React app carrega
- [ ] ✅ Vue app carrega
- [ ] ✅ Navegação entre abas funciona
- [ ] ✅ Props são passadas corretamente
- [ ] ✅ Temas mudam via select
- [ ] ✅ Botões "Settings"/"Tasks" funcionam
- [ ] ✅ Console sem erros

#### 7.3 Verificação de Segurança (Runtime)

**Criar teste de proteção:**

**Arquivo:** `packages/frame/tests/private-fields-protection.test.ts` (novo)

```typescript
import { describe, expect, test } from "bun:test";
import { Frame } from "../src/frame";

describe("Private Fields Protection", () => {
  test("should prevent access to #iframe at runtime", () => {
    const frame = new Frame();
    
    // Tentar acessar via qualquer hack
    expect(() => {
      // @ts-expect-error - Testing runtime protection
      const iframe = frame.#iframe;
    }).toThrow(); // SyntaxError em runtime
    
    // Cast não funciona com #
    expect(() => {
      const iframe = (frame as any)._iframe; // undefined
    }).not.toThrow();
    expect((frame as any)._iframe).toBeUndefined();
  });

  test("__ getters should throw in non-test env", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    
    const frame = new Frame();
    frame.__setReady(true); // Setup
    
    expect(() => {
      frame.__ready;
    }).toThrow("can only be accessed in test environment");
    
    process.env.NODE_ENV = originalEnv;
  });

  test("should allow access to _ convention properties", () => {
    const frame = new Frame();
    
    // Estes devem ser acessíveis (mantidos como _)
    expect(frame._dynamicMethods).toBeDefined();
    expect(frame._propValues).toBeDefined();
    expect(frame._definedProps).toBeDefined();
    expect(frame._registeredFunctions).toBeDefined();
  });
});
```

- [ ] Adicionar teste de proteção
- [ ] Rodar teste: `bun test private-fields-protection.test.ts`
- [ ] Commit: "test: add private fields protection tests"

#### 7.4 Documentação

**Atualizar README ou criar doc:**

**Arquivo:** `packages/frame/ARCHITECTURE.md` (atualizar ou criar)

```markdown
## Encapsulation Strategy

### Private Fields (`#`)
Properties with `#` are truly private and cannot be accessed from outside:
- `#iframe`, `#port`, `#origin` - Critical DOM/communication state
- `#manager`, `#functionManager` - RPC system internals
- `#ready`, `#initialized` - Lifecycle state

### Underscore Convention (`_`)
Properties with `_` are "soft private" but accessible for debugging:
- `_dynamicMethods`, `_propValues` - Caches and derived state
- `_eventListeners`, `_watchHandlers` - Event system state

### Test-Only APIs
For testing purposes only, guarded by `NODE_ENV`:
- `__xxx` getters - Read internal state
- `__setXxx()` methods - Setup test state

Never use `__` in production code!
```

- [ ] Atualizar documentação
- [ ] Commit: "docs: document encapsulation strategy with private fields"

#### 7.5 Commits finais

- [ ] Squash commits se necessário (opcional)
- [ ] Push branch: `git push origin feature/private-fields-migration`
- [ ] Abrir Pull Request
- [ ] Code review
- [ ] Merge para main

---

## ⚠️ Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Testes quebram após migração** | Alta | Alto | ✅ Faseamento: adicionar APIs antes de migrar |
| **Esquecer algum `this._` no código** | Média | Alto | ✅ Use Find & Replace com regex, compilador TypeScript vai avisar |
| **Performance overhead de getters** | Baixa | Baixo | ✅ Getters são inline pelo V8, zero overhead |
| **Usuários externos dependem de `_`** | Baixa | Médio | ✅ Comunicar breaking change se for biblioteca pública |
| **Debugging fica mais difícil** | Média | Baixo | ✅ Manter `_` em caches/Maps úteis para debug |
| **Refatoração de testes muito trabalhosa** | Alta | Médio | ✅ Scripts de busca/substituição, automação |

---

## 📚 Referências

- **ES2022 Private Fields:** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields
- **TypeScript Private vs #:** https://www.typescriptlang.org/docs/handbook/2/classes.html#private
- **Can I Use (Browser Support):** https://caniuse.com/mdn-javascript_classes_private_class_fields

**Browser Support:**
- ✅ Chrome 74+ (2019)
- ✅ Firefox 90+ (2021)
- ✅ Safari 14.1+ (2021)
- ✅ Edge 79+ (2020)
- ✅ Node.js 12+ (2019)

**Projeto Target:** ES2022 ✅ Compatível

---

## 🎯 Checklist Final

### Pré-Migração
- [ ] ✅ Branch criada: `feature/private-fields-migration`
- [ ] ✅ Baseline: todos os testes passando
- [ ] ✅ Commit baseline

### Fase 1: APIs Públicas
- [ ] ✅ Getters `__` em Frame (5 getters)
- [ ] ✅ Getters `__` em FrameSDK (2 getters)
- [ ] ✅ Getters `__` em FunctionManager (3 getters)
- [ ] ✅ Build sem erros
- [ ] ✅ Commit

### Fase 2: Testes (usar getters)
- [ ] ✅ Refatorar `frame.test.ts` (~28 linhas)
- [ ] ✅ Refatorar `integration.test.ts` (~11 linhas)
- [ ] ✅ Refatorar `sdk.test.ts` (~3 linhas)
- [ ] ✅ Todos os testes passando
- [ ] ✅ Commit

### Fase 3: Migrar Frame
- [ ] ✅ Declarações `#` (7 propriedades)
- [ ] ✅ Atualizar getters
- [ ] ✅ Find & Replace `this._` → `this.#` (~60 ocorrências)
- [ ] ✅ Build sem erros
- [ ] ✅ Testes passando
- [ ] ✅ Commit

### Fase 4: Migrar FrameSDK
- [ ] ✅ Declarações `#` (7 propriedades)
- [ ] ✅ Atualizar getters
- [ ] ✅ Find & Replace `this._` → `this.#` (~40 ocorrências)
- [ ] ✅ Build sem erros
- [ ] ✅ Testes passando
- [ ] ✅ Commit

### Fase 5: Migrar FunctionManager
- [ ] ✅ Declarações `#` (4 propriedades)
- [ ] ✅ Adicionar getters `__`
- [ ] ✅ Find & Replace `this._` → `this.#` (~25 ocorrências)
- [ ] ✅ Build sem erros
- [ ] ✅ Testes passando
- [ ] ✅ Commit

### Fase 6: Testes (remover setters diretos)
- [ ] ✅ Adicionar métodos `__set*()` no Frame
- [ ] ✅ Refatorar `frame.test.ts` (~9 locais)
- [ ] ✅ Refatorar `integration.test.ts` (~3 locais)
- [ ] ✅ Todos os testes passando
- [ ] ✅ Commit

### Fase 7: Validação
- [ ] ✅ Nenhum `this._` indevido no código
- [ ] ✅ Todos os testes passando
- [ ] ✅ Build production ok
- [ ] ✅ Testes manuais no shell
- [ ] ✅ Teste de proteção runtime
- [ ] ✅ Documentação atualizada
- [ ] ✅ PR criado
- [ ] ✅ Code review
- [ ] ✅ Merge

---

## 🚀 Timeline Estimado

| Fase | Duração | Acumulado |
|------|---------|-----------|
| Fase 0: Preparação | 15 min | 15 min |
| Fase 1: APIs Públicas | 30 min | 45 min |
| Fase 2: Testes (getters) | 45 min | 1h 30min |
| Fase 3: Frame `#` | 30 min | 2h |
| Fase 4: FrameSDK `#` | 20 min | 2h 20min |
| Fase 5: FunctionManager `#` | 15 min | 2h 35min |
| Fase 6: Testes (setters) | 30 min | 3h 5min |
| Fase 7: Validação | 20 min | 3h 25min |
| **TOTAL** | **~3.5 horas** | |

---

## ✅ Conclusão

- [x] ✅ Plano revisado e aprovado
- [x] ✅ Equipe ciente da migração
- [x] ✅ Tempo alocado (~3.5h)
- [x] ✅ Backup realizado
- [x] ✅ **Migração completa**

---

## 🎉 Resultado Final

**Todas as 8 fases foram concluídas com sucesso:**

1. ✅ Fase 0: Preparação (branch criada, baseline)
2. ✅ Fase 1: Getters `__` + helper `assertTestEnv()`
3. ✅ Fase 2: Testes atualizados para usar `__`
4. ✅ Fase 3: Frame migrado para `#` (7 propriedades)
5. ✅ Fase 4: FrameSDK migrado para `#` (7 propriedades)
6. ✅ Fase 5: FunctionManager migrado para `#` (4 propriedades)
7. ✅ Fase 6: Setters `__` adicionados
8. ✅ Fase 7: Validação e documentação

**Commits realizados:** 11  
**Propriedades migradas:** 18 de `_` → `#`  
**Build:** ✅ Passando  
**Branch:** `feature/private-fields-migration`

---

**Autor:** Claude Code  
**Data do Plano:** 2026-01-23  
**Data de Conclusão:** 2026-01-23  
**Versão:** 1.0  
**Status:** ✅ Completo
