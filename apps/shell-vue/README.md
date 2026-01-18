# Shell Vue - Micro Frontend Host Application

Shell application em Vue 3 que orquestra múltiplos frames (Angular, Vue, React, Solid) usando `z-frame` custom elements.

## Características

- **Vue 3 + Vite**: Build rápido e HMR
- **Vue Router**: Navegação entre frames
- **Custom Elements**: Usa `<z-frame>` para carregar frames
- **TypeScript**: Type-safe
- **Comunicação bidirecional**: Props, eventos e callbacks entre shell e frames

## Desenvolvimento

```bash
# Instalar dependências
bun install

# Rodar em modo dev (porta 4000)
bun run dev

# Build de produção
bun run build

# Preview do build
bun run preview

# Type checking
bun run type-check
```

## Arquitetura

### Estrutura de Pastas

```
shell-vue/
├── src/
│   ├── App.vue          # Componente principal com lógica do shell
│   ├── main.ts          # Entry point (registra z-frame)
│   ├── router.ts        # Configuração do Vue Router
│   └── env.d.ts         # Type definitions
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Frame Configuration

Cada frame é configurado com:

```typescript
interface FrameConfig {
  baseUrl: string; // Base URL (ex: http://localhost)
  name: string; // Nome do frame (angular, vue, react, solid)
  port: number; // Porta do dev server
}
```

### Comunicação Shell → Frame

**Via Props:**

```vue
<z-frame
  ref="angularFrame"
  :user="currentUser"
  :theme="currentTheme"
  :successCallback="handleAngularSuccess"
  :actionCallback="handleAngularAction"
/>
```

**Setando Atributos via JavaScript:**

```typescript
watchEffect(() => {
  if (angularFrame.value) {
    angularFrame.value.setAttribute("name", "angular");
    angularFrame.value.setAttribute("src", getFrameUrl("angular"));
  }
});
```

> **Nota**: Vue não suporta attribute binding direto em custom elements. Usamos `refs` + `watchEffect` para setar `name` e `src`.

### Comunicação Frame → Shell

**Via Eventos:**

```vue
<z-frame
  @ready="onFrameReady"
  @navigate="onFrameNavigate"
  @error="onFrameError"
  @action-clicked="onActionClicked"
/>
```

**Handlers:**

```typescript
const onFrameReady = (event: CustomEvent) => {
  const { name } = event.detail;
  console.log(`Frame '${name}' is ready`);

  // Sincronizar rota atual
  syncRouteToFrame(name);
};

const onFrameNavigate = (event: CustomEvent) => {
  const { path } = event.detail;
  const frameName = (event.target as any).getAttribute("name");

  // Atualizar URL do navegador
  router.push(`/${frameName}${path}`);
};
```

## Frames Suportados

### 1. Angular Frame (porta 4000)

- **Props**: `user`, `theme`, `successCallback`, `actionCallback`
- **Eventos**: `ready`, `navigate`, `error`, `action-clicked`
- **Features**: Callbacks bidirecionais, error handling

### 2. React Frame (porta 4201)

- **Props**: `metricsData` (ArrayBuffer), `fetchDataCallback` (async)
- **Eventos**: `ready`, `navigate`, `error`, `data-loaded`, `large-data`
- **Features**: Transferable objects, async callbacks

### 3. Vue Frame (porta 4202)

- **Props**: `theme`
- **Eventos**: `ready`, `navigate`, `error`, `counter-changed`
- **Features**: Reatividade, composables

## Navegação

O shell gerencia navegação em 2 níveis:

### 1. Navegação do Shell (Vue Router)

```
http://localhost:4000/angular     → Carrega Angular frame
http://localhost:4000/react       → Carrega React frame
http://localhost:4000/vue         → Carrega Vue frame
```

### 2. Navegação Interna do Frame

Quando um frame navega internamente (ex: `/users`), ele emite evento `navigate`:

```typescript
// Frame emite
frameSDK.emit('navigate', { path: '/users' });

// Shell recebe e atualiza URL
onFrameNavigate(event) {
  const fullPath = `/angular/users`;
  router.push(fullPath);
}
```

**Resultado:** URL do navegador = `http://localhost:4000/angular/users`

## Props Especiais

### Callbacks (Angular)

```typescript
const handleAngularSuccess = (data: any) => {
  console.log("[Shell] Success:", data);
};

const handleAngularAction = (data: any) => {
  console.log("[Shell] Action:", data);
};
```

### Async Functions (React)

```typescript
const handleFetchData = async (params: any) => {
  await simulateAPICall();
  return {
    results: [...],
    timestamp: Date.now()
  };
};
```

### Transferable Objects (React)

```typescript
const metricsArrayBuffer = ref<ArrayBuffer>(new ArrayBuffer(16));

onMounted(() => {
  const buffer = new ArrayBuffer(16);
  const view = new DataView(buffer);
  view.setFloat64(0, Math.random() * 1000);
  metricsArrayBuffer.value = buffer;
});
```

### Batch Updates (Solid)

```typescript
const chatMessages = ref([
  { id: 1, text: "Welcome!", timestamp: Date.now() },
  { id: 2, text: "Demo message", timestamp: Date.now() },
]);

// Quando frame envia mensagem
const onMessageSent = (event: CustomEvent) => {
  chatMessages.value.push({
    id: chatMessages.value.length + 1,
    text: event.detail.text,
    timestamp: Date.now(),
  });
};
```

## Theme Toggle

Demonstra reatividade entre shell e frames:

```typescript
const currentTheme = ref<"light" | "dark">("light");

const toggleTheme = () => {
  currentTheme.value = currentTheme.value === "light" ? "dark" : "light";
  // Atualização reativa propagada para todos os frames
};
```

## Troubleshooting

### Frame não carrega (iframe não aparece)

1. Verificar se `name` e `src` estão sendo setados:

```typescript
watchEffect(() => {
  if (frameRef.value) {
    console.log("Setting attributes:", {
      name: "angular",
      src: getFrameUrl("angular"),
    });
  }
});
```

2. Verificar console do navegador para erros

### Comunicação não funciona

1. Verificar se frame está emitindo eventos:

```typescript
// No frame
frameSDK.emit("navigate", { path: "/users" });
```

2. Verificar se shell está escutando:

```vue
<z-frame @navigate="onFrameNavigate" />
```

## Performance

- Cada frame roda em z-frame isolado
- Mudança de frame destrói iframe anterior (evita memory leaks)
- Props reativas atualizam automaticamente
- HMR funciona tanto no shell quanto nos frames

## Links

- [Frame Package](../../packages/frame)
- [Angular Frame](../app-angular)
- [Vue Frame](../app-vue)
- [React Frame](../app-react)
- [Solid Frame](../app-solid)
