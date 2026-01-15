# Micro-Frontend Architecture with Bun Monorepo

Arquitetura de micro-frontend usando Web Components, iframes, postMessage e SDK para comunicação entre apps.

## Estrutura do Projeto

```
micro-fe/
├── packages/
│   └── shared/          # Web Component + SDK compartilhado
│       ├── src/
│       │   ├── web-component/   # <micro-app> Web Component (proxy puro)
│       │   ├── sdk/             # SDK para apps (postMessage wrapper)
│       │   └── types/           # TypeScript types compartilhados
│       └── dist/        # Build outputs
├── apps/
│   ├── app-shell/       # Angular Shell (orquestrador)
│   ├── app-angular/     # Micro-app Angular
│   ├── app-vue/         # Micro-app Vue 3
│   ├── app-react/       # Micro-app React 18
│   └── app-solid/       # Micro-app SolidJS
└── package.json         # Workspace root
```

## Arquitetura

### Conceitos Principais

1. **Web Component como Proxy Puro**
   - `<micro-app>` encapsula iframe e comunicação
   - Zero side-effects (sem history, fetch, localStorage)
   - Interface declarativa: props/attributes → events

2. **SDK para Abstrair Comunicação**
   - Apps não sabem que estão em iframe
   - API simples: `navigate()`, `emit()`, `on()`
   - Transparente para qualquer framework

3. **Shell como Orquestrador**
   - Única fonte de verdade para routing
   - Gerencia todos os micro-apps
   - Sincroniza navegação entre apps

### Fluxo de Comunicação

```
App (Angular) → SDK → postMessage → Web Component → CustomEvent → Shell (parent)
```

**Exemplo de Navegação:**
1. User clica link em micro-app Angular (`/angular/users`)
2. Angular Router intercepta (NavigationInterceptor)
3. Chama SDK: `microAppSDK.navigate('/angular/users')`
4. SDK envia postMessage para Web Component
5. Web Component emite DOM CustomEvent `@navigate`
6. Shell escuta evento e executa `router.navigateByUrl('/angular/users')`
7. Browser URL atualiza
8. Shell notifica micro-app via Web Component

## Instalação

```bash
# Instalar dependências
bun install

# Build de todos os apps (shared + todos os apps em paralelo)
bun build
```

## Desenvolvimento Local

### Opção 1: Todos os servidores em paralelo (Recomendado)

```bash
# Inicia todos os 5 apps em paralelo
bun dev
```

Isso executa `bun --filter './apps/*' run dev` internamente, iniciando todos os servidores de desenvolvimento em paralelo. Aguarde todos iniciarem e acesse: http://localhost:4200

### Opção 2: Build + Serve Static

```bash
# Build de todos os apps (shared + apps em paralelo)
bun build

# Servir arquivos estáticos do shell
bunx serve dist/app-shell
```

## Configuração do Shell

No `app-shell`, configure os micro-apps apontando para localhost em dev:

```html
<micro-app
  name="angular"
  src="http://localhost:4201"
  base-path="/angular"
  api-url="/api"
  theme="light"
  (ready)="onAngularReady()"
  (navigate)="onNavigate($event)"
  (error)="onError($event)"
></micro-app>
```

Em produção, aponte para URLs CDN:

```html
<micro-app
  name="angular"
  src="https://cdn.example.com/angular/v1.0.0/"
  base-path="/angular"
></micro-app>
```

## API do Web Component

### Attributes (Input)

```html
<micro-app
  name="admin"              <!-- Nome do app -->
  src="https://..."         <!-- URL do app (iframe src) -->
  base-path="/admin"        <!-- Base path para routing -->
  api-url="/api"            <!-- API URL (opcional) -->
  theme="dark"              <!-- Theme (opcional) -->
></micro-app>
```

### Events (Output)

```typescript
// App ready
<micro-app @ready="onReady()"></micro-app>

// Navegação
<micro-app @navigate="onNavigate($event)"></micro-app>
// event.detail = { path, replace, state }

// Erro
<micro-app @error="onError($event)"></micro-app>
// event.detail = { message, stack }

// Eventos customizados
<micro-app @user:created="onUserCreated($event)"></micro-app>
```

### Methods (Imperativo)

```typescript
// Chamar método no app
const microApp = document.querySelector('micro-app');
await microApp.call('refreshData');

// Emitir evento para o app
microApp.emitEvent('theme-changed', { theme: 'dark' });
```

## API do SDK (Apps)

### Inicialização

```typescript
import { microAppSDK } from '@shared/core/sdk';

microAppSDK.initialize().then(() => {
  const config = microAppSDK.getConfig();
  // config = { name, basePath, apiUrl, theme }

  // Bootstrap seu framework aqui
});
```

### Navegação

```typescript
// Notificar parent sobre navegação
microAppSDK.navigate('/users');
microAppSDK.navigate('/settings', true); // replace mode
microAppSDK.navigate('/profile', false, { from: 'menu' }); // com state
```

### Eventos

```typescript
// Emitir evento customizado para parent
microAppSDK.emit('user:created', { id: 123, name: 'John' });

// Escutar eventos do parent
microAppSDK.on('theme-changed', (theme) => {
  console.log('Theme changed to:', theme);
});

// Escutar mudanças de attribute
microAppSDK.on('attribute:theme', (theme) => {
  applyTheme(theme);
});

// Escutar mudanças de rota do parent
microAppSDK.on('route-change', (data) => {
  router.navigateByUrl(data.path);
});
```

### Registrar Métodos

```typescript
// Registrar método que parent pode chamar
microAppSDK.registerMethod('refreshData', async () => {
  await fetchData();
  return { success: true };
});

// Parent chama: await microApp.call('refreshData');
```

## Code-Splitting

Cada app usa code-splitting agressivo:

### Vite (Vue, React, Solid)

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['framework-name'],
          router: ['router-name']
        }
      }
    }
  }
});
```

### Angular CLI

```json
// angular.json
{
  "configurations": {
    "production": {
      "optimization": true,
      "buildOptimizer": true,
      "vendorChunk": true
    }
  }
}
```

## Deploy Independente

### Estrutura CDN

```
https://cdn.example.com/
├── shell/
│   └── index.html
├── angular/
│   ├── v1.0.0/
│   └── v1.1.0/  ← Nova versão
├── vue/
│   └── v1.0.0/
└── react/
    └── v1.0.0/
```

### Processo de Deploy

1. Build novo app: `bun run build:angular`
2. Upload para CDN: `aws s3 sync dist/app-angular/ s3://cdn/angular/v1.1.0/`
3. Atualizar shell para apontar para nova versão:
   ```html
   <micro-app src="https://cdn.example.com/angular/v1.1.0/" />
   ```
4. Deploy shell

### Rollback

Apenas mudar `src` para versão anterior:
```html
<micro-app src="https://cdn.example.com/angular/v1.0.0/" />
```

## Vantagens

✅ **Deploy Independente Real** - Cada app versionado individualmente
✅ **Isolamento Total** - CSS e JS isolados via iframe sandbox
✅ **Framework Agnostic** - Funciona com qualquer framework
✅ **Interface Declarativa** - Props/Attributes + Events familiar
✅ **Zero Vendor Lock-in** - Padrões web puros
✅ **Code-Splitting** - Bundles otimizados automaticamente

## Desvantagens

❌ **Complexidade Inicial** - Mais setup que monolito
❌ **Debugging Cross-Context** - Logs e stack traces fragmentados
❌ **Alguma Duplicação** - Frameworks duplicados entre apps (mitigado por HTTP/2 + cache)
❌ **SEO Limitado** - Conteúdo em iframes não indexado

## Quando Usar

### ✅ Use quando:
- Deploy independente é crítico
- Times autônomos com ciclos diferentes
- Isolamento de apps é importante
- Múltiplos apps grandes (3+)
- Framework flexibility necessária

### ❌ Não use quando:
- Time único pequeno
- SEO crítico (landing pages públicas)
- Performance extrema necessária
- Browsers antigos obrigatórios

## Troubleshooting

### Web Component não registra

Certifique-se de importar o Web Component no shell:
```typescript
import '@shared/core/web-component';
```

### SDK não inicializa

Verifique se o Web Component está enviando `__INIT__`:
```typescript
// Deve estar no connectedCallback do Web Component
this.sendToIframe({
  type: '__INIT__',
  payload: { name, basePath, apiUrl, theme }
});
```

### Navegação não funciona

Verifique event handlers no shell:
```typescript
onNavigate(event: CustomEvent) {
  const { path } = event.detail;
  this.router.navigateByUrl(path); // Executar no router root!
}
```

### CORS errors

Configure CORS headers no servidor de dev:
```typescript
// vite.config.ts
server: {
  cors: true
}
```

## Referências

- [Documento de Arquitetura](/MICRO-FRONTEND-ARCHITECTURE.md)
- [Web Components MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [postMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
