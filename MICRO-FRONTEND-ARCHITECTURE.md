# Arquitetura Micro Frontend: Web Components + postMessage + Import Maps

> Proposta de arquitetura para micro frontends com deploy independente, shared dependencies via Import Maps, isolamento via iframes, e comunicação através de Web Components como proxy puro.

---

## Índice

1. [Princípio Fundamental](#princípio-fundamental)
2. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
3. [Web Component (Proxy Puro)](#web-component-proxy-puro)
4. [SDK para Apps (Angular)](#sdk-para-apps-angular)
5. [Integração com Frameworks](#integração-com-frameworks)
6. [Interceptor de Navegação](#interceptor-de-navegação)
7. [Deploy Independente](#deploy-independente)
8. [Por Que Não MessageChannel?](#por-que-não-messagechannel)
9. [Vantagens vs Desvantagens](#vantagens-vs-desvantagens)

---

## Princípio Fundamental

### Tudo São Props, Attributes e Eventos

```
┌─────────────────────────────────────┐
│         Web Component                │
│                                      │
│   INPUT: Props/Attributes            │
│      ↓                               │
│   [Component Logic]                  │
│      ↓                               │
│   OUTPUT: Events                     │
│                                      │
└─────────────────────────────────────┘
```

**Web Component = Interface Declarativa**

```html
<!-- INPUT (attributes/properties) -->
<micro-app
  name="admin"
  src="https://cdn.example.com/admin/v2.3.0/"
  base-path="/admin"
  api-url="/api"
  theme="dark"
/>

<!-- OUTPUT (events) -->
@ready              // { }
@navigate           // { path, replace, state }
@error              // { message, stack }
@user:created       // { ... }
```

### O Web Component É Um Proxy Puro

**✅ Pode:**
- Emitir eventos DOM
- Gerenciar iframe (criar, destruir)
- Traduzir postMessage ↔ DOM Events
- Validar mensagens

**❌ Não pode (zero side-effects):**
- `history.pushState()` / `replaceState()`
- `fetch()` / `localStorage` / `sessionStorage`
- Manipular DOM do parent
- Atualizar estado global
- Fazer qualquer side-effect

**Quem decide tudo é o parent (Vue/React/Angular)**

---

## Visão Geral da Arquitetura

### Diagrama

```
┌─────────────────────────────────────────────────┐
│          Parent (Shell - Vue/React/Angular)     │
│                                                 │
│  // Parent NÃO sabe que existe iframe           │
│  <micro-app                                     │
│    name="admin"                                 │
│    src="cdn.com/admin/v2.3.0"                   │
│    base-path="/admin"                           │
│    api-url="/api"                               │
│    theme="dark"                                 │
│    @navigate="handleNavigate"                   │
│    @error="handleError"                         │
│  />                                             │
│                                                 │
│  // Parent decide o que fazer com eventos       │
│  handleNavigate(event) {                        │
│    router.push(event.detail.path) ← PARENT FAZ  │
│  }                                              │
└──────────────────┬──────────────────────────────┘
                   │ DOM Events
                   │ (navigate, error, etc)
                   ▼
┌─────────────────────────────────────────────────┐
│   <micro-app> Web Component (PROXY PURO)        │
│                                                 │
│   ┌──────────────────────────────────────┐      │
│   │  Recebe DOM event/attribute change   │      │
│   │    ↓                                 │      │
│   │  Traduz para postMessage             │      │
│   │    ↓                                 │      │
│   │  Envia para iframe                   │      │
│   └──────────────────────────────────────┘      │
│                                                 │
│   ┌──────────────────────────────────────┐      │
│   │  Recebe postMessage do iframe        │      │
│   │    ↓                                 │      │
│   │  Traduz para DOM event               │      │
│   │    ↓                                 │      │
│   │  Dispara evento no parent            │      │
│   └──────────────────────────────────────┘      │
│                                                 │
│   ┌────────────────────────────────────┐        │
│   │     iframe (PRIVADO)               │        │
│   │     src="cdn.com/admin/"           │        │
│   │                                    │        │
│   │     (Parent nunca acessa)          │        │
│   └────────────────────────────────────┘        │
└──────────────────┬──────────────────────────────┘
                   │ postMessage
                   ▼
            ┌──────────────────┐
            │   App + SDK      │
            │  (transparente)  │
            └──────────────────┘
```

### Fluxo de Dados

```
Parent (Vue/React/Angular)
  ↓ attributes/props (theme, api-url, etc)
Web Component (proxy)
  ↓ postMessage
iframe App
  ↓ SDK
Angular App
  ↓ router.navigate() → SDK.navigate()
SDK
  ↓ postMessage
Web Component (proxy)
  ↓ CustomEvent('navigate')
Parent (Vue/React/Angular)
  ↓ handler → router.push()
Router do Parent
```

---

## Web Component (Proxy Puro)

### Implementação Completa

```typescript
// shared/micro-app-element.ts

export class MicroAppElement extends HTMLElement {
  private iframe!: HTMLIFrameElement;
  private targetOrigin!: string;
  private ready = false;
  private pendingCalls = new Map<string, {
    resolve: Function;
    reject: Function;
    timeout: number;
  }>();

  // ============================================
  // INPUT: Observed Attributes (props reativas)
  // ============================================
  static get observedAttributes() {
    return ['name', 'src', 'base-path', 'api-url', 'theme'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    // Attribute mudou → repassar para iframe
    switch (name) {
      case 'theme':
      case 'api-url':
        if (this.ready) {
          this.sendToIframe({
            type: 'ATTRIBUTE_CHANGE',
            attribute: name,
            value: newValue
          });
        }
        break;
    }
  }

  connectedCallback() {
    const name = this.getAttribute('name')!;
    const src = this.getAttribute('src')!;
    const basePath = this.getAttribute('base-path') || `/${name}`;

    this.targetOrigin = new URL(src).origin;
    this.initializeApp(name, src, basePath);
  }

  private async initializeApp(name: string, src: string, basePath: string) {
    // 1. Create iframe (PRIVADO - parent não acessa)
    this.iframe = document.createElement('iframe');
    this.iframe.src = src;
    this.iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    `;

    this.iframe.setAttribute('sandbox',
      'allow-scripts allow-same-origin allow-forms allow-popups allow-modals'
    );

    // 2. Setup listener para postMessage DO IFRAME
    window.addEventListener('message', (event) => {
      // Validar: só aceita do nosso iframe
      if (event.origin !== this.targetOrigin) return;
      if (event.source !== this.iframe.contentWindow) return;

      this.handleMessageFromIframe(event.data);
    });

    // 3. Append iframe
    this.appendChild(this.iframe);
    await new Promise(resolve => this.iframe.onload = resolve);

    // 4. Initialize app - passar TODOS os attributes como props
    this.sendToIframe({
      type: '__INIT__',
      payload: {
        name,
        basePath,
        apiUrl: this.getAttribute('api-url'),
        theme: this.getAttribute('theme')
        // ... todos os attributes
      }
    });
  }

  // ============================================
  // IFRAME → WEB COMPONENT → PARENT
  // Apenas emite eventos DOM, sem side-effects!
  // ============================================
  private handleMessageFromIframe(message: any) {
    const { type, payload, requestId } = message;

    switch (type) {
      case '__READY__':
        this.ready = true;
        // Apenas emitir evento
        this.emit('ready');
        break;

      case 'NAVIGATE':
        // NÃO faz history.pushState!
        // Apenas emite evento para parent decidir
        this.emit('navigate', {
          path: payload.path,
          replace: payload.replace || false,
          state: payload.state
        });
        break;

      case 'ERROR':
        this.emit('error', payload);
        break;

      case 'STATE_CHANGE':
        this.emit('state-change', payload);
        break;

      case 'CUSTOM_EVENT':
        // Evento customizado do app (ex: user:created)
        this.emit(payload.name, payload.data);
        break;

      case 'CALL_RESPONSE':
        // Resposta de chamada de método
        this.handleCallResponse(requestId, payload);
        break;

      default:
        console.warn(`[micro-app] Unknown message type: ${type}`);
    }
  }

  // ============================================
  // Helper: Emit event (sempre composed + bubbles)
  // ============================================
  private emit(eventName: string, detail?: any) {
    this.dispatchEvent(new CustomEvent(eventName, {
      bubbles: true,
      composed: true,
      detail
    }));
  }

  // ============================================
  // PARENT → WEB COMPONENT → IFRAME
  // ============================================

  // Public API: Chamar método no app (imperativo se necessário)
  async call(method: string, params?: any): Promise<any> {
    if (!this.ready) {
      throw new Error('App not ready yet');
    }

    const requestId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingCalls.delete(requestId);
        reject(new Error(`Call timeout: ${method}`));
      }, 10000);

      this.pendingCalls.set(requestId, { resolve, reject, timeout });

      this.sendToIframe({
        type: 'CALL',
        requestId,
        method,
        params
      });
    });
  }

  // Public API: Emitir evento para o app
  emit(eventName: string, data?: any) {
    this.sendToIframe({
      type: 'EVENT',
      name: eventName,
      data
    });
  }

  private handleCallResponse(requestId: string, payload: any) {
    const pending = this.pendingCalls.get(requestId);
    if (!pending) return;

    clearTimeout(pending.timeout);
    this.pendingCalls.delete(requestId);

    if (payload.success) {
      pending.resolve(payload.result);
    } else {
      pending.reject(new Error(payload.error));
    }
  }

  private sendToIframe(message: any) {
    if (!this.iframe?.contentWindow) {
      console.error('[micro-app] Iframe not ready');
      return;
    }

    this.iframe.contentWindow.postMessage(message, this.targetOrigin);
  }

  disconnectedCallback() {
    this.iframe?.remove();

    // Limpar pending calls
    for (const [_, pending] of this.pendingCalls) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Web Component disconnected'));
    }
    this.pendingCalls.clear();
  }
}

// Register custom element
customElements.define('micro-app', MicroAppElement);
```

---

## SDK para Apps (Angular)

### Implementação do SDK

```typescript
// shared/sdk/micro-app-sdk.ts

export interface MicroAppSDKConfig {
  name: string;
  basePath: string;
  apiUrl?: string;
  theme?: string;
}

export class MicroAppSDK {
  private config!: MicroAppSDKConfig;
  private parentOrigin!: string;
  private methodHandlers = new Map<string, Function>();
  private eventListeners = new Map<string, Set<Function>>();

  async initialize(): Promise<void> {
    return new Promise((resolve) => {
      window.addEventListener('message', (event) => {
        if (event.data.type === '__INIT__') {
          this.config = event.data.payload;
          this.parentOrigin = event.origin;

          // Setup listener para mensagens do parent (Web Component)
          window.addEventListener('message', this.handleMessage.bind(this));

          // Send ready signal
          this.sendToParent({ type: '__READY__' });

          resolve();
        }
      }, { once: true });
    });
  }

  private handleMessage(event: MessageEvent) {
    // Só aceita do parent (Web Component)
    if (event.origin !== this.parentOrigin) return;

    const { type, method, params, requestId, name, data, attribute, value } = event.data;

    switch (type) {
      case 'CALL':
        // Parent chamando método
        this.handleMethodCall(method, params, requestId);
        break;

      case 'EVENT':
        // Parent emitindo evento
        this.emitLocalEvent(name, data);
        break;

      case 'ATTRIBUTE_CHANGE':
        // Attribute mudou (ex: theme="dark")
        this.handleAttributeChange(attribute, value);
        break;
    }
  }

  private async handleMethodCall(method: string, params: any, requestId: string) {
    try {
      const handler = this.methodHandlers.get(method);
      if (!handler) {
        throw new Error(`Method not found: ${method}`);
      }

      const result = await handler(params);

      this.sendToParent({
        type: 'CALL_RESPONSE',
        requestId,
        payload: { success: true, result }
      });
    } catch (error: any) {
      this.sendToParent({
        type: 'CALL_RESPONSE',
        requestId,
        payload: { success: false, error: error.message }
      });
    }
  }

  private handleAttributeChange(attribute: string, value: any) {
    // Attribute mudou → emitir evento local
    this.emitLocalEvent(`attribute:${attribute}`, value);

    // Atualizar config
    if (attribute === 'theme') {
      this.config.theme = value;
    } else if (attribute === 'api-url') {
      this.config.apiUrl = value;
    }
  }

  // ============================================
  // Public API: APP → PARENT
  // ============================================

  // Navegar (parent executa no router root)
  navigate(path: string, replace = false, state?: any) {
    this.sendToParent({
      type: 'NAVIGATE',
      payload: { path, replace, state }
    });
  }

  // Emitir evento customizado para parent
  emit(eventName: string, data?: any) {
    this.sendToParent({
      type: 'CUSTOM_EVENT',
      payload: { name: eventName, data }
    });
  }

  // Reportar erro
  reportError(error: Error) {
    this.sendToParent({
      type: 'ERROR',
      payload: {
        message: error.message,
        stack: error.stack
      }
    });
  }

  // Notificar mudança de estado
  notifyStateChange(state: any) {
    this.sendToParent({
      type: 'STATE_CHANGE',
      payload: state
    });
  }

  // ============================================
  // Public API: Registrar métodos (chamados pelo parent)
  // ============================================

  registerMethod(method: string, handler: Function) {
    this.methodHandlers.set(method, handler);
  }

  // ============================================
  // Public API: Escutar eventos locais
  // ============================================

  on(eventName: string, handler: Function) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set());
    }
    this.eventListeners.get(eventName)!.add(handler);
  }

  off(eventName: string, handler: Function) {
    this.eventListeners.get(eventName)?.delete(handler);
  }

  private emitLocalEvent(eventName: string, data: any) {
    const handlers = this.eventListeners.get(eventName);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  // ============================================
  // Private
  // ============================================

  private sendToParent(message: any) {
    window.parent.postMessage(message, this.parentOrigin);
  }

  getConfig(): MicroAppSDKConfig {
    return this.config;
  }
}

// Singleton instance
export const microAppSDK = new MicroAppSDK();
```

---

## Integração com Frameworks

### Vue 3

```ts
<!-- apps/shell/src/App.vue -->
<template>
  <div id="app">
    <nav>
      <router-link to="/admin">Admin</router-link>
      <router-link to="/risk">Risk</router-link>
    </nav>

    <div class="app-container">
      <!-- Declarativo: props + eventos -->
      <micro-app
        v-if="currentApp === 'admin'"
        ref="adminApp"
        name="admin"
        src="https://cdn.example.com/admin/v2.3.0/"
        base-path="/admin"
        :api-url="apiUrl"
        :theme="theme"
        @ready="onAdminReady"
        @navigate="onNavigate"
        @error="onError"
        @user:created="onUserCreated"
      />

      <micro-app
        v-if="currentApp === 'risk'"
        ref="riskApp"
        name="risk"
        src="https://cdn.example.com/risk/v1.5.0/"
        base-path="/risk"
        :api-url="apiUrl"
        :theme="theme"
        @ready="onRiskReady"
        @navigate="onNavigate"
        @error="onError"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import '@shared/micro-app-element';

const router = useRouter();
const route = useRoute();

const adminApp = ref<any>(null);
const riskApp = ref<any>(null);
const apiUrl = ref('/api');
const theme = ref('light');

const currentApp = computed(() => {
  if (route.path.startsWith('/admin')) return 'admin';
  if (route.path.startsWith('/risk')) return 'risk';
  return null;
});

// ============================================
// Event Handlers - Parent decide!
// ============================================

function onAdminReady() {
  console.log('Admin app ready');

  // Sincronizar rota inicial
  const path = route.path.replace('/admin', '');
  if (path) {
    adminApp.value?.emit('initial-route', { path });
  }
}

function onRiskReady() {
  console.log('Risk app ready');

  const path = route.path.replace('/risk', '');
  if (path) {
    riskApp.value?.emit('initial-route', { path });
  }
}

function onNavigate(event: CustomEvent) {
  const { path, replace, state } = event.detail;

  // PARENT executa navegação no router root
  if (replace) {
    router.replace({ path, state });
  } else {
    router.push({ path, state });
  }
}

function onError(event: CustomEvent) {
  console.error('App error:', event.detail);
  // Parent trata (notificação, log, etc)
}

function onUserCreated(event: CustomEvent) {
  console.log('User created:', event.detail);

  // Parent notifica outros apps
  if (riskApp.value) {
    riskApp.value.emit('user:created', event.detail);
  }
}

// ============================================
// Watch route changes (parent → apps)
// ============================================

watch(() => route.path, (newPath) => {
  if (newPath.startsWith('/admin')) {
    const appPath = newPath.replace('/admin', '');
    adminApp.value?.emit('route-change', { path: appPath });
  } else if (newPath.startsWith('/risk')) {
    const appPath = newPath.replace('/risk', '');
    riskApp.value?.emit('route-change', { path: appPath });
  }
});

// ============================================
// Ações do parent
// ============================================

async function refreshData() {
  const result = await adminApp.value?.call('refreshData');
  console.log('Refreshed:', result);
}

function changeTheme(newTheme: string) {
  theme.value = newTheme; // Reactive → Web Component → iframe
}
</script>
```

### Angular

```typescript
// apps/shell/src/app/app.component.ts
import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import '@shared/micro-app-element';

@Component({
  selector: 'app-root',
  template: `
    <nav>
      <a routerLink="/admin">Admin</a>
      <a routerLink="/risk">Risk</a>
    </nav>

    <div class="app-container">
      <micro-app
        *ngIf="currentApp === 'admin'"
        #adminApp
        name="admin"
        src="https://cdn.example.com/admin/v2.3.0/"
        base-path="/admin"
        [attr.api-url]="apiUrl"
        [attr.theme]="theme"
        (ready)="onAdminReady()"
        (navigate)="onNavigate($event)"
        (error)="onError($event)"
        (user:created)="onUserCreated($event)"
      ></micro-app>

      <micro-app
        *ngIf="currentApp === 'risk'"
        #riskApp
        name="risk"
        src="https://cdn.example.com/risk/v1.5.0/"
        base-path="/risk"
        [attr.api-url]="apiUrl"
        [attr.theme]="theme"
        (ready)="onRiskReady()"
        (navigate)="onNavigate($event)"
        (error)="onError($event)"
      ></micro-app>
    </div>
  `
})
export class AppComponent {
  @ViewChild('adminApp') adminApp?: ElementRef;
  @ViewChild('riskApp') riskApp?: ElementRef;

  currentApp: string | null = null;
  apiUrl = '/api';
  theme = 'light';

  constructor(private router: Router) {
    // Watch router changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.handleRouteChange(event.url);
      });

    this.handleRouteChange(this.router.url);
  }

  private handleRouteChange(url: string) {
    if (url.startsWith('/admin')) {
      this.currentApp = 'admin';
      const appPath = url.replace('/admin', '');

      setTimeout(() => {
        this.adminApp?.nativeElement.emit('route-change', { path: appPath });
      });
    } else if (url.startsWith('/risk')) {
      this.currentApp = 'risk';
      const appPath = url.replace('/risk', '');

      setTimeout(() => {
        this.riskApp?.nativeElement.emit('route-change', { path: appPath });
      });
    }
  }

  onAdminReady() {
    const path = this.router.url.replace('/admin', '');
    if (path) {
      this.adminApp?.nativeElement.emit('initial-route', { path });
    }
  }

  onRiskReady() {
    const path = this.router.url.replace('/risk', '');
    if (path) {
      this.riskApp?.nativeElement.emit('initial-route', { path });
    }
  }

  onNavigate(event: CustomEvent) {
    const { path, replace, state } = event.detail;

    // PARENT executa navegação
    if (replace) {
      this.router.navigateByUrl(path, { replaceUrl: true, state });
    } else {
      this.router.navigateByUrl(path, { state });
    }
  }

  onError(event: CustomEvent) {
    console.error('App error:', event.detail);
  }

  onUserCreated(event: CustomEvent) {
    console.log('User created:', event.detail);
    this.riskApp?.nativeElement.emit('user:created', event.detail);
  }

  async refreshData() {
    const result = await this.adminApp?.nativeElement.call('refreshData');
    console.log('Refreshed:', result);
  }

  changeTheme(theme: string) {
    this.theme = theme; // Reactive → Web Component → iframe
  }
}
```

### React

```tsx
// apps/shell/src/App.tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '@shared/micro-app-element';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const adminAppRef = useRef<any>(null);
  const riskAppRef = useRef<any>(null);

  const [apiUrl] = useState('/api');
  const [theme, setTheme] = useState('light');

  const currentApp = location.pathname.startsWith('/admin') ? 'admin'
    : location.pathname.startsWith('/risk') ? 'risk'
    : null;

  // ============================================
  // Setup event listeners
  // ============================================

  useEffect(() => {
    const adminApp = adminAppRef.current;
    const riskApp = riskAppRef.current;

    const handleNavigate = (event: CustomEvent) => {
      const { path, replace, state } = event.detail;
      navigate(path, { replace, state });
    };

    const handleError = (event: CustomEvent) => {
      console.error('App error:', event.detail);
    };

    const handleUserCreated = (event: CustomEvent) => {
      console.log('User created:', event.detail);
      riskApp?.emit('user:created', event.detail);
    };

    adminApp?.addEventListener('navigate', handleNavigate);
    adminApp?.addEventListener('error', handleError);
    adminApp?.addEventListener('user:created', handleUserCreated);

    riskApp?.addEventListener('navigate', handleNavigate);
    riskApp?.addEventListener('error', handleError);

    return () => {
      adminApp?.removeEventListener('navigate', handleNavigate);
      adminApp?.removeEventListener('error', handleError);
      adminApp?.removeEventListener('user:created', handleUserCreated);

      riskApp?.removeEventListener('navigate', handleNavigate);
      riskApp?.removeEventListener('error', handleError);
    };
  }, [navigate]);

  // ============================================
  // Sync route changes to apps
  // ============================================

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      const appPath = location.pathname.replace('/admin', '');
      adminAppRef.current?.emit('route-change', { path: appPath });
    } else if (location.pathname.startsWith('/risk')) {
      const appPath = location.pathname.replace('/risk', '');
      riskAppRef.current?.emit('route-change', { path: appPath });
    }
  }, [location.pathname]);

  return (
    <div id="app">
      <nav>
        <a href="/admin">Admin</a>
        <a href="/risk">Risk</a>
      </nav>

      <div className="app-container">
        {currentApp === 'admin' && (
          <micro-app
            ref={adminAppRef}
            name="admin"
            src="https://cdn.example.com/admin/v2.3.0/"
            base-path="/admin"
            api-url={apiUrl}
            theme={theme}
          />
        )}

        {currentApp === 'risk' && (
          <micro-app
            ref={riskAppRef}
            name="risk"
            src="https://cdn.example.com/risk/v1.5.0/"
            base-path="/risk"
            api-url={apiUrl}
            theme={theme}
          />
        )}
      </div>
    </div>
  );
}
```

---

## Interceptor de Navegação

### Angular Router Interceptor

```typescript
// apps/admin/src/app/navigation.interceptor.ts
import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { microAppSDK } from '@shared/sdk';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class NavigationInterceptor {
  constructor(private router: Router) {
    // Interceptar navegações internas do Angular Router
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Notificar parent (Web Component)
        // Web Component emite evento DOM para parent
        // Parent executa no router root
        microAppSDK.navigate(event.url);
      });
  }
}

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      useFactory: (interceptor: NavigationInterceptor) => () => {},
      deps: [NavigationInterceptor],
      multi: true
    }
  ]
};
```

### Uso no App

```typescript
// apps/admin/src/main.ts
import { microAppSDK } from '@shared/sdk';

microAppSDK.initialize().then(async () => {
  const config = microAppSDK.getConfig();
  console.log('Admin initialized:', config);

  // Registrar métodos que parent pode chamar
  microAppSDK.registerMethod('refreshData', async () => {
    // Lógica de refresh
    return { success: true };
  });

  // Escutar mudanças de attributes
  microAppSDK.on('attribute:theme', (theme) => {
    console.log('Theme changed:', theme);
    applyTheme(theme);
  });

  // Escutar eventos do parent
  microAppSDK.on('route-change', (data) => {
    router.navigateByUrl(data.path);
  });

  // Bootstrap Angular
  const { bootstrapApplication } = await import('@angular/platform-browser');
  const { AppComponent } = await import('./app/app.component');
  const { appConfig } = await import('./app/app.config');

  bootstrapApplication(AppComponent, appConfig)
    .catch(err => console.error(err));
});
```

```typescript
// apps/admin/src/app/services/events.service.ts
import { Injectable } from '@angular/core';
import { microAppSDK } from '@shared/sdk';

@Injectable({ providedIn: 'root' })
export class EventsService {
  notifyUserCreated(user: User) {
    // App emite evento
    // SDK → postMessage → Web Component
    // Web Component → CustomEvent → parent escuta
    microAppSDK.emit('user:created', user);
  }

  reportError(error: Error) {
    microAppSDK.reportError(error);
  }
}
```

---

## Deploy Independente

### Estrutura

```
https://cdn.example.com/
├── shell/
│   ├── index.html
│   ├── main.js
│   └── micro-app-element.js
├── admin/
│   ├── v2.3.0/
│   │   ├── index.html
│   │   ├── main.js
│   │   └── assets/
│   └── v2.4.0/  ← Nova versão!
│       ├── index.html
│       ├── main.js
│       └── assets/
└── risk/
    ├── v1.5.0/
    └── v1.6.0/
```

### Processo

```bash
# 1. Deploy Admin v2.4.0
cd apps/admin
nx build admin
aws s3 sync dist/apps/admin/ s3://cdn.example.com/admin/v2.4.0/

# 2. Update shell
# apps/shell/src/App.vue (ou .tsx, .ts)
<micro-app
  name="admin"
  src="https://cdn.example.com/admin/v2.4.0/"  <!-- Atualizado! -->
/>

# 3. Deploy shell
nx build shell
aws s3 sync dist/apps/shell/ s3://cdn.example.com/shell/

# 4. CDN invalidation
aws cloudfront create-invalidation --distribution-id E123 --paths "/shell/*"
```

### Rollback

```html
<!-- Apenas mudar src para versão anterior -->
<micro-app
  name="admin"
  src="https://cdn.example.com/admin/v2.3.0/"  <!-- Rollback -->
/>
```

---

## Por Que Não MessageChannel?

### O Que Discutimos

**MessageChannel cria um canal dedicado ponto-a-ponto:**

```typescript
const channel = new MessageChannel();

// port1 no parent
channel.port1.onmessage = (e) => console.log(e.data);

// port2 transferido para iframe
iframe.contentWindow.postMessage({ type: 'INIT' }, '*', [channel.port2]);
```

### Por Que NÃO Precisamos

**1. É 1:1 (Web Component ↔ iframe)**
```
Um Web Component gerencia UM iframe
Não há confusão de "qual iframe enviou?"
```

**2. Web Component encapsula a complexidade**
```typescript
// Parent só vê:
<micro-app @navigate="..." />

// Não sabe de iframe
// Não sabe de postMessage
// Web Component abstrai tudo
```

**3. postMessage direto é suficiente**
```typescript
// Web Component valida e roteia
window.addEventListener('message', (event) => {
  if (event.origin !== this.targetOrigin) return;
  if (event.source !== this.iframe.contentWindow) return;

  // Processar...
});
```

**4. MessageChannel seria overhead desnecessário**
```typescript
// Não ganhamos nada porque:
// - Já temos 1:1
// - Já validamos origin/source
// - Web Component já isola
```

### Quando MessageChannel Seria Útil

- ✅ Múltiplos iframes sem Web Component
- ✅ Comunicação iframe ↔ iframe direta
- ✅ Transferir port entre contextos
- ✅ Arquitetura sem proxy/abstração

**Mas com Web Component, não precisamos!**

---

## Comunicação Avançada: RPC Pattern e MessagePort

### Visão Geral

Além da comunicação básica via postMessage, existem padrões mais sofisticados para casos onde precisamos:
- Chamar métodos remotos de forma bidirecional
- Passar "callbacks" entre contextos
- Manter canais dedicados de comunicação

### 1. RPC Pattern (Remote Procedure Call)

**Melhor para:** API estruturada com múltiplos métodos, chamadas bidirecionais frequentes, type-safety.

#### Implementação Completa no SDK

```typescript
// shared/sdk/micro-app-sdk.ts

export class MicroAppSDK {
  private methods = new Map<string, Function>();
  private pendingCalls = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }>();

  // ============================================
  // App registra métodos que parent pode chamar
  // ============================================

  registerMethod(name: string, fn: Function) {
    this.methods.set(name, fn);
  }

  // ============================================
  // App chama métodos no parent
  // ============================================

  async callParent<T>(methodName: string, ...args: any[]): Promise<T> {
    const callId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      this.pendingCalls.set(callId, { resolve, reject });

      this.sendToParent({
        type: 'RPC_CALL',
        payload: { callId, methodName, args }
      });

      // Timeout para não travar
      setTimeout(() => {
        if (this.pendingCalls.has(callId)) {
          this.pendingCalls.delete(callId);
          reject(new Error('RPC call timeout'));
        }
      }, 5000);
    });
  }

  private handleMessage(event: MessageEvent) {
    const { type, payload } = event.data;

    switch (type) {
      // Parent chamando método no app
      case 'RPC_CALL':
        this.handleRPCCall(payload);
        break;

      // Resposta de chamada que fizemos ao parent
      case 'RPC_RESPONSE':
        this.handleRPCResponse(payload);
        break;
    }
  }

  private async handleRPCCall(payload: any) {
    const { callId, methodName, args } = payload;
    const method = this.methods.get(methodName);

    if (!method) {
      this.sendToParent({
        type: 'RPC_RESPONSE',
        payload: {
          callId,
          error: `Method "${methodName}" not found`
        }
      });
      return;
    }

    try {
      const result = await method(...args);

      this.sendToParent({
        type: 'RPC_RESPONSE',
        payload: { callId, result }
      });
    } catch (error) {
      this.sendToParent({
        type: 'RPC_RESPONSE',
        payload: {
          callId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  private handleRPCResponse(payload: any) {
    const { callId, result, error } = payload;
    const pending = this.pendingCalls.get(callId);

    if (pending) {
      this.pendingCalls.delete(callId);

      if (error) {
        pending.reject(new Error(error));
      } else {
        pending.resolve(result);
      }
    }
  }
}
```

#### Uso no App (iframe)

```typescript
// App registra métodos que parent pode chamar
microAppSDK.registerMethod('getUser', async (userId: number) => {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
});

microAppSDK.registerMethod('updateTheme', (theme: string) => {
  document.body.classList.toggle('dark', theme === 'dark');
  return { success: true };
});

// App chama métodos no parent
async function handleLogout() {
  try {
    const result = await microAppSDK.callParent('logout');
    console.log('Logout successful:', result);
  } catch (error) {
    console.error('Logout failed:', error);
  }
}
```

#### Web Component como Meio de Campo

```typescript
export class MicroAppElement extends HTMLElement {
  private pendingCalls = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }>();

  // Parent chama método remoto no app
  async call<T>(methodName: string, ...args: any[]): Promise<T> {
    const callId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      this.pendingCalls.set(callId, { resolve, reject });

      this.sendToIframe({
        type: 'RPC_CALL',
        payload: { callId, methodName, args }
      });

      setTimeout(() => {
        if (this.pendingCalls.has(callId)) {
          this.pendingCalls.delete(callId);
          reject(new Error('RPC call timeout'));
        }
      }, 5000);
    });
  }

  private handleMessageFromIframe(message: any) {
    const { type, payload } = message;

    switch (type) {
      // App chamando método no parent
      case 'RPC_CALL':
        this.handleRPCFromApp(payload);
        break;

      // Resposta de método que chamamos no app
      case 'RPC_RESPONSE':
        const pending = this.pendingCalls.get(payload.callId);
        if (pending) {
          this.pendingCalls.delete(payload.callId);

          if (payload.error) {
            pending.reject(new Error(payload.error));
          } else {
            pending.resolve(payload.result);
          }
        }
        break;
    }
  }

  private async handleRPCFromApp(payload: any) {
    const { callId, methodName, args } = payload;

    // Emite evento para parent com callback
    const event = new CustomEvent('rpc-call', {
      bubbles: true,
      composed: true,
      detail: {
        methodName,
        args,
        respond: (result: any) => {
          this.sendToIframe({
            type: 'RPC_RESPONSE',
            payload: { callId, result }
          });
        },
        respondError: (error: string) => {
          this.sendToIframe({
            type: 'RPC_RESPONSE',
            payload: { callId, error }
          });
        }
      }
    });

    this.dispatchEvent(event);
  }
}
```

#### Uso no Parent (Vue)

```vue
<template>
  <micro-app
    ref="microAppRef"
    name="admin"
    @rpc-call="handleRPCCall"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';

const microAppRef = ref<MicroAppElement>();

// Parent chama métodos no app
async function refreshUserData() {
  try {
    const user = await microAppRef.value?.call('getUser', 123);
    console.log('User:', user);
  } catch (error) {
    console.error('Failed to get user:', error);
  }
}

// App chama métodos no parent
function handleRPCCall(event: CustomEvent) {
  const { methodName, args, respond, respondError } = event.detail;

  switch (methodName) {
    case 'logout':
      logout()
        .then(result => respond(result))
        .catch(err => respondError(err.message));
      break;

    case 'navigate':
      router.push(args[0]);
      respond({ success: true });
      break;

    default:
      respondError(`Method "${methodName}" not found`);
  }
}
</script>
```

### 2. MessagePort: One-time vs Long-lived

MessagePort **NÃO é necessariamente one-time**. Pode ser usado de três formas:

#### 2.1 One-time (criar, usar uma vez, fechar)

**Melhor para:** Callbacks pontuais, operações únicas.

```typescript
// PARENT → IFRAME: Callback via MessagePort
async function getDataFromApp(userId: number): Promise<any> {
  const channel = new MessageChannel();

  return new Promise((resolve, reject) => {
    // Escuta resposta no port1
    channel.port1.onmessage = (event) => {
      if (event.data.error) {
        reject(new Error(event.data.error));
      } else {
        resolve(event.data.result);
      }
      channel.port1.close();  // ← Fecha após usar
    };

    // Envia request com port2 como "callback"
    iframe.contentWindow.postMessage({
      type: 'GET_USER_DATA',
      userId
    }, '*', [channel.port2]);

    setTimeout(() => {
      reject(new Error('Timeout'));
      channel.port1.close();
    }, 5000);
  });
}

// IFRAME recebe e "chama callback"
window.addEventListener('message', async (event) => {
  if (event.data.type === 'GET_USER_DATA') {
    const callbackPort = event.ports[0];

    try {
      const user = await fetchUser(event.data.userId);
      callbackPort.postMessage({ result: user });
    } catch (error) {
      callbackPort.postMessage({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      callbackPort.close();  // ← Fecha após responder
    }
  }
});
```

#### 2.2 Long-lived (criar uma vez, usar muitas vezes)

**Melhor para:** Canal dedicado persistente, alto volume de mensagens.

```typescript
// WEB COMPONENT - cria canal persistente
export class MicroAppElement extends HTMLElement {
  private commandPort?: MessagePort;

  connectedCallback() {
    // Cria canal que dura toda a vida do componente
    const commandChannel = new MessageChannel();
    this.commandPort = commandChannel.port1;

    // Escuta respostas indefinidamente
    this.commandPort.onmessage = (event) => {
      this.handleCommandResponse(event.data);
    };

    // Envia port2 pro iframe
    this.iframe.contentWindow!.postMessage({
      type: '__INIT__',
      payload: this.config
    }, this.targetOrigin, [commandChannel.port2]);
  }

  // Reutiliza MESMO port para múltiplos comandos
  async updateTheme(theme: string) {
    this.commandPort?.postMessage({
      type: 'UPDATE_THEME',
      theme
    });
  }

  async updateUser(user: any) {
    this.commandPort?.postMessage({
      type: 'UPDATE_USER',
      user
    });
  }

  async refresh() {
    this.commandPort?.postMessage({
      type: 'REFRESH'
    });
  }

  disconnectedCallback() {
    // Limpa quando componente é destruído
    this.commandPort?.close();
  }
}

// SDK no iframe - recebe e mantém port
class MicroAppSDK {
  private commandPort?: MessagePort;

  initialize() {
    window.addEventListener('message', (event) => {
      if (event.data.type === '__INIT__') {
        // Recebe port e mantém vivo
        this.commandPort = event.ports[0];

        // Escuta comandos indefinidamente
        this.commandPort.onmessage = (e) => {
          this.handleCommand(e.data);
        };
      }
    }, { once: true });
  }

  private handleCommand(message: any) {
    switch (message.type) {
      case 'UPDATE_THEME':
        this.applyTheme(message.theme);
        // Responde pelo MESMO port
        this.commandPort?.postMessage({
          type: 'THEME_UPDATED',
          success: true
        });
        break;

      case 'UPDATE_USER':
        this.updateUser(message.user);
        this.commandPort?.postMessage({
          type: 'USER_UPDATED',
          success: true
        });
        break;
    }
  }
}
```

#### 2.3 Multiple Channels (vários ports para diferentes propósitos)

**Melhor para:** Separar concerns (commands vs events vs streams).

```typescript
// Criar múltiplos canais dedicados
const commandChannel = new MessageChannel();
const streamChannel = new MessageChannel();
const eventsChannel = new MessageChannel();

// Cada canal com propósito específico
commandChannel.port1.onmessage = (event) => {
  console.log('Command response:', event.data);
};

streamChannel.port1.onmessage = (event) => {
  console.log('Stream data:', event.data);
};

eventsChannel.port1.onmessage = (event) => {
  console.log('Event notification:', event.data);
};

// Envia TODOS os ports de uma vez
iframe.contentWindow.postMessage({
  type: 'INIT'
}, '*', [
  commandChannel.port2,
  streamChannel.port2,
  eventsChannel.port2
]);

// Usa cada canal para propósito diferente
commandChannel.port1.postMessage({ type: 'GET_USER', id: 123 });
streamChannel.port1.postMessage({ type: 'SUBSCRIBE_UPDATES' });
eventsChannel.port1.postMessage({ type: 'LISTEN_CLICKS' });
```

### 3. Comparação das Abordagens

| Abordagem | Melhor para | Vantagens | Desvantagens |
|-----------|-------------|-----------|--------------|
| **postMessage direto** | Comunicação simples, event-driven | Simples, nativo, sem overhead | Manual tracking de requests |
| **RPC Pattern** | API com múltiplos métodos, type-safe | Estruturado, Promise-based, timeout automático | Mais código |
| **MessagePort One-time** | Callbacks pontuais, operações únicas | Auto-cleanup, isolado | Criar port para cada call |
| **MessagePort Long-lived** | Canal dedicado, alto volume | Performance, zero overhead de criação | Precisa gerenciar lifecycle |
| **Multiple MessagePorts** | Separar concerns (commands/events/streams) | Organização, isolamento | Mais complexidade inicial |

### 4. Quando Usar Cada Um

```typescript
// ✅ postMessage direto: Arquitetura atual (Web Component proxy)
// Já temos validação de origin/source
// Web Component encapsula complexidade
microAppSDK.navigate('/users');

// ✅ RPC Pattern: Quando precisa chamar métodos remotos
// Type-safe, conveniente, timeout automático
await microAppRef.value?.call('refreshData');
await microAppSDK.callParent('logout');

// ✅ MessagePort One-time: Callbacks pontuais
// Auto-cleanup, ideal para operações únicas
const userData = await fetchFromApp(userId);

// ✅ MessagePort Long-lived: Canal persistente
// Zero overhead, reutiliza o mesmo port
commandPort.postMessage({ type: 'UPDATE_THEME', theme: 'dark' });
commandPort.postMessage({ type: 'REFRESH' });

// ✅ Multiple MessagePorts: Organização avançada
// Separar commands, events, e streams
commandPort.postMessage({ type: 'GET_USER' });
streamPort.postMessage({ type: 'SUBSCRIBE' });
```

### 5. Exemplo Completo: Web Component com MessagePort Long-lived

```typescript
export class MicroAppElement extends HTMLElement {
  private commandPort?: MessagePort;
  private eventPort?: MessagePort;

  async initializeApp(name: string, src: string, basePath: string) {
    // ... criar iframe ...

    // Criar canais dedicados
    const commandChannel = new MessageChannel();
    const eventChannel = new MessageChannel();

    this.commandPort = commandChannel.port1;
    this.eventPort = eventChannel.port1;

    // Commands: Parent → App
    this.commandPort.onmessage = (event) => {
      // Respostas de comandos
      this.handleCommandResponse(event.data);
    };

    // Events: App → Parent
    this.eventPort.onmessage = (event) => {
      // Eventos do app
      const { type, payload } = event.data;
      this.emit(type, payload);
    };

    // Envia AMBOS os ports para o app
    this.iframe.contentWindow!.postMessage({
      type: '__INIT__',
      payload: {
        name,
        basePath,
        apiUrl: this.getAttribute('api-url')
      }
    }, this.targetOrigin, [
      commandChannel.port2,  // App usa para receber comandos
      eventChannel.port2     // App usa para enviar eventos
    ]);
  }

  // Public API: Enviar comando
  async updateTheme(theme: string) {
    this.commandPort?.postMessage({
      type: 'UPDATE_THEME',
      theme
    });
  }

  disconnectedCallback() {
    this.commandPort?.close();
    this.eventPort?.close();
    this.iframe?.remove();
  }
}
```

### Conclusão: Qual Usar na Nossa Arquitetura?

**Nossa escolha atual:** **postMessage direto** com Web Component como proxy.

**Por quê?**
- ✅ Web Component encapsula toda complexidade
- ✅ Parent não precisa saber de postMessage
- ✅ Validação de origin/source suficiente para 1:1
- ✅ Interface declarativa (props + events)
- ✅ Simples e eficiente

**Quando adicionar RPC ou MessagePort:**
- 🟡 **RPC Pattern** - Se precisar chamar muitos métodos remotos imperatiamente
- 🟡 **MessagePort Long-lived** - Se performance de alto volume for crítica
- 🟡 **Multiple MessagePorts** - Se precisar separar canais (commands/events/streams)

**Para 99% dos casos, postMessage direto + Web Component proxy é suficiente.**

---

## Vantagens vs Desvantagens

### ✅ Vantagens

1. **Deploy Independente Real**
   - Cada app versionado (v2.3.0, v2.4.0)
   - Rollback trivial (mudar src)
   - Zero downtime

2. **Shared Dependencies via Import Maps**
   - Angular/PrimeNG carregados uma vez
   - Cache do browser eficiente
   - Menor tamanho total

3. **Isolamento Total**
   - Iframes com sandbox
   - CSS não vaza
   - JavaScript isolado

4. **Interface Declarativa**
   - Props/Attributes + Events
   - Familiar para qualquer framework
   - Reativo (attributes mudam → iframe recebe)

5. **Web Component = Proxy Puro**
   - Zero side-effects
   - Parent decide tudo
   - Testável isoladamente

6. **Framework Agnostic**
   - Funciona em Vue, React, Angular, Svelte
   - Mesma API em todos

7. **Zero Vendor Lock-in**
   - Padrões web puros
   - Não depende de Webpack/Cloudflare
   - Migração fácil

### ❌ Desvantagens

1. **Browser Support**
   - Import Maps: Chrome 89+, Safari 16.4+, Firefox 108+
   - Precisa polyfill para browsers antigos

2. **Complexidade Inicial**
   - Web Component precisa manutenção
   - SDK precisa documentação
   - Curva de aprendizado

3. **Debugging Cross-Context**
   - DevTools mostram iframes separados
   - Logs fragmentados
   - Stack traces atravessam boundaries

4. **Network Overhead**
   - Múltiplos requests iniciais
   - HTTP/2 minimiza mas não elimina

5. **SEO Limitado**
   - Conteúdo em iframes não indexado
   - Não ideal para landing pages públicas

6. **Sincronização de Estado**
   - Requires mensagens explícitas
   - Sem shared memory

---

## Comparação com Outras Abordagens

| Aspecto | Esta Arquitetura | Module Federation | @buntime/piercing | Nx Monorepo |
|---------|-----------------|-------------------|-------------------|-------------|
| **Deploy Independente** | ✅ Total | ✅ Sim | ✅ Sim | ❌ Não |
| **Shared Deps** | ✅ Import Maps | ⚠️ Runtime | ✅ Import Maps | ✅ Build-time |
| **Isolamento** | ✅ Iframe | ❌ Nenhum | ✅ Shadow DOM | ❌ Nenhum |
| **Interface** | ✅ Props + Events | ❌ Runtime imports | ⚠️ MessageBus | ✅ TypeScript |
| **Side-effects** | ✅ Zero (proxy) | ⚠️ Compartilhado | ⚠️ SSR | ✅ Controlado |
| **Framework Agnostic** | ✅ Total | ⚠️ Parcial | ⚠️ Parcial | ❌ Não |
| **Complexidade** | 🟡 Média | 🔴 Alta | 🔴 Alta | 🟢 Baixa |
| **Type Safety** | ⚠️ SDK | ❌ Runtime | ⚠️ Parcial | ✅ Total |
| **Performance** | ⚡⚡ Boa | 🐌 Waterfalls | ⚡⚡ SSR | ⚡⚡⚡ Ótima |
| **Vendor Lock-in** | 🟢 Zero | 🟡 Webpack | 🟢 Zero | 🟢 Zero |
| **DX** | 🟡 Médio | 🔴 Ruim | 🟡 Médio | 🟢 Excelente |

---

## Quando Usar Esta Arquitetura

### ✅ Use quando:

1. **Deploy independente é crítico**
   - Times autônomos com ciclos diferentes
   - Precisa rollback granular
   - Hotfix em produção sem rebuild total

2. **Isolamento é importante**
   - Apps de terceiros ou não confiáveis
   - Segurança crítica
   - CSS conflicts problemáticos

3. **Framework flexibility**
   - Parent em Vue, apps em Angular
   - Ou vice-versa
   - Quer trocar frameworks gradualmente

4. **Múltiplos apps grandes**
   - 3+ aplicações independentes
   - Cada uma com complexidade própria
   - Precisam comunicar entre si

5. **Browsers modernos OK**
   - Backoffice/interno
   - Pode exigir browsers atualizados
   - Import Maps suportado

### ❌ Não use quando:

1. **Time único pequeno**
   - Use Nx Monorepo
   - Deploy conjunto OK
   - Type safety total mais importante

2. **SEO crítico**
   - Landing pages públicas
   - E-commerce customer-facing
   - Conteúdo precisa ser indexado

3. **Browsers antigos obrigatórios**
   - IE11, Safari < 16
   - Polyfills complexos ou impossíveis

4. **Performance extrema**
   - Cada millisecond conta
   - Zero overhead aceitável
   - Use monolito otimizado

---

## Resumo dos Princípios

### 1. Web Component = Interface Declarativa

```html
<!-- INPUT: attributes/props -->
<micro-app
  name="admin"
  src="..."
  api-url="/api"
  theme="dark"
/>

<!-- OUTPUT: eventos -->
@ready
@navigate
@error
@user:created
```

### 2. Web Component = Proxy Puro (Zero Side-Effects)

✅ **Pode:**
- Emitir eventos DOM
- Gerenciar iframe
- Traduzir postMessage ↔ Events

❌ **Não pode:**
- `history.pushState()`
- `fetch()` / `localStorage`
- Qualquer side-effect

### 3. Parent Decide Tudo

```typescript
// Parent captura evento
onNavigate(event) {
  // PARENT executa no router root
  router.push(event.detail.path);
}
```

### 4. App Usa SDK (Transparente)

```typescript
// App não sabe de postMessage
microAppSDK.navigate('/users');
microAppSDK.emit('user:created', user);
```

### 5. Fluxo Completo

```
App (Angular)
  ↓ router.navigate()
Interceptor
  ↓ SDK.navigate()
SDK
  ↓ postMessage
Web Component
  ↓ CustomEvent('navigate')
Parent (Vue/React/Angular)
  ↓ handler
Router do Parent
  ↓ router.push()
Browser URL atualizada
```

---

## Conclusão

Esta arquitetura segue o princípio mais fundamental de componentes:

> **Input (props/attributes) → Logic → Output (events)**

- ✅ **Declarativa** - Tudo via template
- ✅ **Reativa** - Attributes mudam → iframe recebe
- ✅ **Sem side-effects** - Web Component é puro
- ✅ **Framework agnostic** - Funciona em qualquer lugar
- ✅ **Testável** - Mock events, set attributes
- ✅ **Familiar** - Mesma API de qualquer componente

**Ideal para:** Backoffices, plataformas extensíveis, SaaS multi-tenant com múltiplos times autônomos que precisam deploy independente.

**Não ideal para:** Sites públicos com SEO, landing pages, times únicos pequenos (use Nx Monorepo).
