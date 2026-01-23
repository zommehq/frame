# ✅ PLANO APROVADO - Otimizações e Correção de Bugs

**Data:** 2026-01-23  
**Status:** Em Execução  
**Prioridade:** Otimizações primeiro, depois bugs

---

## 🎯 DECISÕES CONFIRMADAS

### 1. setTimeout(100) no React
**Decisão:** ✅ Usar `useEffect` com `currentPath` (determinístico, sem setTimeout)
- Sem timeouts arbitrários
- Comportamento previsível
- Reseta flag quando navegação realmente completa

### 2. Otimizações em geral
**Decisão:** ✅ Priorizar determinismo e performance
- Task 1.2: Simplificar if/else → **SIM**
- Task 1.3: Set ao invés de Array.includes → **SIM**
- Task 1.4: Simplificar recreate logic → **SIM**

### 3. Estrutura para register de funções
**Decisão:** ✅ Hook/Composable dedicado (como Angular)
- React: `hooks/useFrameActions.ts`
- Vue: `composables/useFrameActions.ts`
- Organizado, reutilizável, testável

### 4. Ordem de execução
**Decisão:** ✅ Otimizações primeiro, depois bugfixes
1. Tasks 1.1 → 1.2 → 1.3 → 1.4 (Otimizações)
2. Tasks 2.1 → 2.2 → 2.3 → 2.4 (Bugs)

---

## 📋 PLANO FINAL DE EXECUÇÃO

### FASE 1: OTIMIZAÇÕES (P1)

#### ✅ Task 1.1: Remover setTimeout(100) do useRouteSync
**Arquivo:** `packages/frame-react/src/useRouteSync.ts`

**Mudança:**
```typescript
// ❌ REMOVER:
const timeoutId = setTimeout(() => {
  isNavigatingFromShell.current = false;
}, timeout);

// ✅ ADICIONAR:
// Reset flag when navigation completes (currentPath changes)
useEffect(() => {
  if (isNavigatingFromShell.current) {
    isNavigatingFromShell.current = false;
  }
}, [currentPath]);
```

**Testes:**
- [ ] Navegação shell → frame (clicar Angular/React/Vue no shell)
- [ ] Navegação frame → shell (clicar links internos)
- [ ] Navegação rápida múltipla (verificar sem race conditions)
- [ ] Refresh de página

---

#### ✅ Task 1.2: Simplificar if/else em attributeChangedCallback
**Arquivo:** `packages/frame/src/frame.ts`

**Mudança:**
```typescript
// Adicionar no topo da classe (após observedAttributes):
private static readonly ATTR_GETTERS: Record<string, (instance: Frame, val?: string | null) => unknown> = {
  pathname: (instance) => instance.pathname,
  base: (instance) => instance.base,
  sandbox: (instance) => instance.sandbox,
  name: (_, val) => val,
  src: (_, val) => val,
};

// Substituir cadeia if/else (linhas 244-267):
if (this._ready) {
  const getter = Frame.ATTR_GETTERS[name];
  const value = getter ? getter(this, newValue) : newValue;
  this._sendPropUpdate({ [name]: value });
}
```

**Testes:**
- [ ] Mudança de pathname via property binding
- [ ] Mudança de base via setAttribute
- [ ] Mudança de theme via setAttribute
- [ ] Mudança de atributo customizado

---

#### ✅ Task 1.3: Otimizar MutationObserver com Set
**Arquivo:** `packages/frame/src/frame.ts` (método `_setupAttributeObserver`)

**Mudança:**
```typescript
private _setupAttributeObserver(): void {
  const observedAttrsSet = new Set(Frame.observedAttributes); // O(1) lookup

  this._observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      const attrName = mutation.attributeName;
      if (attrName && !observedAttrsSet.has(attrName)) { // ✅ O(1)
        // ... resto do código
      }
    });
  });
}
```

**Testes:**
- [ ] Atributos dinâmicos observados corretamente
- [ ] observedAttributes ignorados (não duplicados)

---

#### ✅ Task 1.4: Simplificar lógica de recreate iframe
**Arquivo:** `packages/frame/src/frame.ts`

**Mudança:**
```typescript
// Adicionar constante no topo da classe:
private static readonly RECREATE_ATTRS = new Set(['src', 'sandbox']);

// Simplificar linhas 216-240:
if (this._iframe && Frame.RECREATE_ATTRS.has(name)) {
  // src: always has oldValue when iframe exists
  // sandbox: may be first-time set (oldValue === null)
  const shouldRecreate = 
    (name === 'src' && oldValue !== null && oldValue !== newValue) ||
    (name === 'sandbox' && (
      (oldValue !== null && oldValue !== newValue) || // normal change
      (oldValue === null && newValue !== null)         // first-time set
    ));
    
  if (shouldRecreate) {
    logger.log(`${name} changed - recreating iframe`);
    this._cleanup();
    this._origin = new URL(this.src!).origin;
    this._initialize();
    return;
  }
}
```

**Testes:**
- [ ] Mudança de src recria iframe
- [ ] Mudança de sandbox (com oldValue) recria iframe
- [ ] First-time set sandbox recria iframe
- [ ] Mudança de outros atributos NÃO recria iframe

---

### FASE 2: CORREÇÃO DE BUGS (P2)

#### 🔴 Task 2.1: Implementar register de funções no React
**Arquivos:**
1. **CRIAR:** `apps/app-react/src/hooks/useFrameActions.ts`
2. **MODIFICAR:** `apps/app-react/src/App.tsx`

**Conteúdo de `useFrameActions.ts`:**
```typescript
import { frameSDK } from "@zomme/frame-react";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export function useFrameActions() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't register if SDK not initialized
    if (!frameSDK.props) return;

    const unregister = frameSDK.register({
      getStats: () => ({
        currentRoute: location.pathname,
        theme: document.body.className || "light",
        timestamp: Date.now(),
      }),
      
      navigateTo: async (path: string) => {
        navigate(path);
        return {
          navigatedTo: path,
          timestamp: Date.now(),
        };
      },
      
      refreshData: async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return {
          refreshedAt: Date.now(),
          success: true,
        };
      },
    });

    return unregister;
  }, [navigate, location.pathname]);
}
```

**Modificação em `App.tsx`:**
```typescript
import { useFrameActions } from "./hooks/useFrameActions";

function App({ sdkAvailable }: { sdkAvailable: boolean }) {
  // ... código existente
  
  // Register frame actions
  useFrameActions();
  
  // ... resto do código
}
```

**Testes:**
- [ ] Clicar "Settings" no shell → React navega para /settings
- [ ] Clicar "Tasks" no shell → React navega para /tasks
- [ ] Clicar "Stats" no shell → Retorna stats corretos
- [ ] Clicar "Refresh" no shell → Executa refresh

---

#### 🔴 Task 2.2: Implementar register de funções no Vue
**Arquivos:**
1. **CRIAR:** `apps/app-vue/src/composables/useFrameActions.ts`
2. **MODIFICAR:** `apps/app-vue/src/App.vue`

**Conteúdo de `useFrameActions.ts`:**
```typescript
import { frameSDK } from "@zomme/frame-vue";
import { onMounted, onUnmounted } from "vue";
import type { Router } from "vue-router";

export function useFrameActions(router: Router) {
  let unregister: (() => void) | undefined;

  onMounted(() => {
    // Don't register if SDK not initialized
    if (!frameSDK.props) return;

    unregister = frameSDK.register({
      getStats: () => ({
        currentRoute: router.currentRoute.value.path,
        theme: document.body.className || "light",
        timestamp: Date.now(),
      }),
      
      navigateTo: async (path: string) => {
        await router.push(path);
        return {
          navigatedTo: path,
          timestamp: Date.now(),
        };
      },
      
      refreshData: async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return {
          refreshedAt: Date.now(),
          success: true,
        };
      },
    });
  });

  onUnmounted(() => {
    unregister?.();
  });
}
```

**Modificação em `App.vue`:**
```vue
<script setup lang="ts">
import { useRouter } from "vue-router";
import { useFrameActions } from "./composables/useFrameActions";

const router = useRouter();

// Register frame actions
useFrameActions(router);
</script>
```

**Testes:**
- [ ] Clicar "Settings" no shell → Vue navega para /settings
- [ ] Clicar "Tasks" no shell → Vue navega para /tasks
- [ ] Clicar "Stats" no shell → Retorna stats corretos
- [ ] Clicar "Refresh" no shell → Executa refresh

---

#### 🔴 Task 2.3: Corrigir theme change callback no React
**Arquivo:** `apps/app-react/src/pages/Settings.tsx` linha ~210

**Mudança:**
```typescript
// ❌ ANTES:
onChange={(e) =>
  setSettings({ ...settings, theme: e.target.value as "dark" | "light" })
}

// ✅ DEPOIS:
onChange={(e) => {
  const newTheme = e.target.value as "dark" | "light";
  setSettings({ ...settings, theme: newTheme });
  
  // Call parent callback to update shell
  if (typeof props.changeTheme === "function") {
    props.changeTheme(newTheme);
  }
}}
```

**Testes:**
- [ ] Mudar select de theme na página Settings
- [ ] Verificar que app React muda de tema
- [ ] Verificar que ícone do shell atualiza (sol/lua)
- [ ] Verificar que outros apps também recebem mudança via prop

---

#### 🔴 Task 2.4: Corrigir theme change callback no Vue
**Arquivo:** `apps/app-vue/src/views/Settings.vue`

**Mudança no script:**
```typescript
// Adicionar função no script setup (após as outras funções):
function handleThemeChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  const newTheme = target.value as "dark" | "light";
  
  // Call parent callback to update shell
  if (typeof props.value.changeTheme === "function") {
    props.value.changeTheme(newTheme);
  }
}
```

**Mudança no template (linha ~171):**
```vue
<!-- ❌ ANTES: -->
<select id="theme" v-model="settings.theme" name="theme">

<!-- ✅ DEPOIS: -->
<select 
  id="theme" 
  v-model="settings.theme" 
  name="theme"
  @change="handleThemeChange"
>
```

**Testes:**
- [ ] Mudar select de theme na página Settings
- [ ] Verificar que app Vue muda de tema
- [ ] Verificar que ícone do shell atualiza (sol/lua)
- [ ] Verificar que outros apps também recebem mudança via prop

---

## 📊 RESUMO FINAL

**Total de tarefas:** 8
- **Otimizações:** 4 (Fase 1)
- **Bugs:** 4 (Fase 2)

**Arquivos a criar:** 2
- `apps/app-react/src/hooks/useFrameActions.ts`
- `apps/app-vue/src/composables/useFrameActions.ts`

**Arquivos a modificar:** 6
- `packages/frame/src/frame.ts` (3 otimizações)
- `packages/frame-react/src/useRouteSync.ts` (1 otimização)
- `apps/app-react/src/App.tsx` (1 bug)
- `apps/app-react/src/pages/Settings.tsx` (1 bug)
- `apps/app-vue/src/App.vue` (1 bug)
- `apps/app-vue/src/views/Settings.vue` (1 bug)

**Estratégia de testes:**
- Testar cada otimização individualmente após implementação
- Testar cada bugfix individualmente após implementação
- Fazer teste completo E2E ao final de cada fase

---

## 📝 Notas de Implementação

### Decisões Técnicas

1. **Sem timeouts arbitrários:** Todas as soluções devem ser determinísticas
2. **Performance primeiro:** Preferir Set sobre Array quando apropriado
3. **Organização:** Hooks/composables dedicados ao invés de código inline
4. **Consistência:** Seguir padrão do app-angular como referência

### Critérios de Sucesso

- ✅ Todos os testes passam
- ✅ Sem timeouts arbitrários no código
- ✅ Navegação funciona em todos os 3 frameworks
- ✅ Theme change atualiza shell de todos os apps
- ✅ Performance melhorada (Set vs Array)
- ✅ Código mais legível e manutenível
