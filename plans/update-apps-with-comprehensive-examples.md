# Plano: Atualizar Apps com Casos de Uso Abrangentes

## Objetivo

Atualizar todos os apps para usar o `fragment-elements` refatorado e criar exemplos que demonstrem TODAS as funcionalidades do SDK.

## Casos de Uso a Implementar

### 1. **Comunicação Básica** (Todos os apps)

- ✅ Inicialização do SDK
- ✅ Acesso a props (name, base, custom props)
- ✅ Emissão de eventos para o shell
- ✅ Escuta de eventos do shell

### 2. **Passagem de Funções** (Angular & React)

- ✅ Callback functions do shell para fragment
- ✅ Callback functions do fragment para shell
- ✅ Funções assíncronas com Promise
- ✅ Cleanup de funções registradas

### 3. **Atributos Dinâmicos** (Vue & Solid)

- ✅ Atualização de atributos pelo shell
- ✅ Reatividade a mudanças de atributos
- ✅ Listener de `attr:` events
- ✅ Sincronização de estado

### 4. **Transferable Objects** (React)

- ✅ ArrayBuffer transfer
- ✅ MessagePort transfer
- ✅ Performance com dados grandes

### 5. **Navegação & Routing** (Todos os apps)

- ✅ Emissão de eventos de navegação
- ✅ Deep linking
- ✅ Sincronização de rotas

### 6. **Error Handling** (Angular)

- ✅ Tratamento de erros no SDK
- ✅ Eventos de erro do shell
- ✅ Recovery de erros

### 7. **Lifecycle & Cleanup** (Todos os apps)

- ✅ Inicialização correta
- ✅ Cleanup no unmount
- ✅ Memory leak prevention

### 8. **Performance** (Solid)

- ✅ Batch updates
- ✅ Debouncing de eventos
- ✅ Optimistic UI updates

## Estrutura de Implementação

### App Shell (Angular)

**Funcionalidades:**

- Host para todos os fragments
- Roteamento principal
- Passagem de props dinâmicas
- Listeners de eventos de todos os fragments
- Demonstração de método `emit()` camelCase

**Arquivos principais:**

- `src/app/app.component.ts` - Shell principal
- `src/app/fragments/` - Componentes wrapper para fragments

### App Angular (Fragment)

**Casos de uso:**

- Callback functions bidirecionais
- Error handling avançado
- Formulários com validação
- Emissão de eventos tipados

**Arquivos principais:**

- `src/main.ts` - Inicialização do SDK
- `src/app/app.component.ts` - Componente raiz
- `src/app/services/sdk.service.ts` - Service wrapper do SDK

### App React (Fragment)

**Casos de uso:**

- Transferable objects (ArrayBuffer)
- Hook customizado para SDK
- Funções assíncronas
- Context API com SDK

**Arquivos principais:**

- `src/main.tsx` - Inicialização do SDK
- `src/hooks/useFragmentSDK.ts` - Custom hook
- `src/App.tsx` - Componente principal

### App Vue (Fragment)

**Casos de uso:**

- Composables para SDK
- Reatividade com atributos
- Watchers para mudanças
- Teleport com eventos

**Arquivos principais:**

- `src/main.ts` - Inicialização do SDK
- `src/composables/useFragmentSDK.ts` - Composable
- `src/App.vue` - Componente principal

### App Solid (Fragment)

**Casos de uso:**

- Signals para estado do SDK
- Performance com batch updates
- Stores para props
- Effects para listeners

**Arquivos principais:**

- `src/index.tsx` - Inicialização do SDK
- `src/store/sdk.ts` - Store para SDK
- `src/App.tsx` - Componente principal

## Implementação Passo a Passo

### Fase 1: App Shell (Host)

1. ✅ Criar componente principal com routing
2. ✅ Adicionar `<fragment-frame>` para cada app
3. ✅ Implementar passagem de props dinâmicas
4. ✅ Implementar listeners de eventos
5. ✅ Demonstrar métodos camelCase (`frame.themeChange()`)
6. ✅ Criar UI para controlar fragments

### Fase 2: App Angular

1. ✅ Criar serviço wrapper do SDK
2. ✅ Implementar casos de uso de callbacks
3. ✅ Criar formulário com validação
4. ✅ Emitir eventos tipados
5. ✅ Demonstrar error handling

### Fase 3: App React

1. ✅ Criar custom hook `useFragmentSDK`
2. ✅ Implementar transferable objects
3. ✅ Criar context provider
4. ✅ Demonstrar funções assíncronas
5. ✅ Implementar cleanup adequado

### Fase 4: App Vue

1. ✅ Criar composable `useFragmentSDK`
2. ✅ Implementar reatividade com atributos
3. ✅ Criar watchers para mudanças
4. ✅ Demonstrar teleport com eventos
5. ✅ Implementar navegação

### Fase 5: App Solid

1. ✅ Criar store para SDK
2. ✅ Implementar signals para estado
3. ✅ Demonstrar batch updates
4. ✅ Criar effects para listeners
5. ✅ Otimizar performance

## Matriz de Funcionalidades

| Funcionalidade    | Angular | React | Vue  | Solid | Shell |
| ----------------- | ------- | ----- | ---- | ----- | ----- |
| SDK Init          | ✅      | ✅    | ✅   | ✅    | N/A   |
| Props Access      | ✅      | ✅    | ✅   | ✅    | N/A   |
| Emit Events       | ✅      | ✅    | ✅   | ✅    | N/A   |
| Listen Events     | ✅      | ✅    | ✅   | ✅    | ✅    |
| Callbacks         | ✅✅    | ✅✅  | ✅   | ✅    | ✅    |
| Async Functions   | ✅      | ✅✅  | ✅   | ✅    | ✅    |
| Transferables     | ✅      | ✅✅  | ✅   | ✅    | ✅    |
| Attr Listeners    | ✅      | ✅    | ✅✅ | ✅✅  | N/A   |
| Error Handling    | ✅✅    | ✅    | ✅   | ✅    | ✅    |
| Cleanup           | ✅      | ✅    | ✅   | ✅    | N/A   |
| CamelCase Methods | N/A     | N/A   | N/A  | N/A   | ✅✅  |

**Legenda:** ✅ = Implementado, ✅✅ = Caso de uso principal

## Checklist de Validação

### Para cada app fragment:

- [ ] SDK inicializa corretamente
- [ ] Props são acessíveis via `frameSDK.props`
- [ ] Eventos são emitidos para o shell
- [ ] Eventos do shell são recebidos
- [ ] Cleanup é executado no unmount
- [ ] Sem memory leaks
- [ ] Tratamento de erros adequado

### Para o shell:

- [ ] `<fragment-frame>` renderiza corretamente
- [ ] Props são passadas corretamente
- [ ] Eventos dos fragments são recebidos
- [ ] Métodos camelCase funcionam (`frame.themeChange()`)
- [ ] Navegação entre fragments funciona
- [ ] UI responsiva e intuitiva

## Arquivos a Criar/Modificar

### App Shell

- `src/app/app.component.ts` - Componente principal
- `src/app/app.component.html` - Template principal
- `src/app/app.routes.ts` - Configuração de rotas
- `src/app/fragments/` - Componentes wrapper

### App Angular

- `src/main.ts` - Inicialização
- `src/app/services/fragment-sdk.service.ts` - Service wrapper
- `src/app/app.component.ts` - Componente principal
- `src/app/components/callback-demo/` - Demo de callbacks
- `src/app/components/form-demo/` - Demo de formulários

### App React

- `src/main.tsx` - Inicialização
- `src/hooks/useFragmentSDK.ts` - Custom hook
- `src/context/FragmentContext.tsx` - Context provider
- `src/App.tsx` - Componente principal
- `src/components/TransferableDemo.tsx` - Demo de transferables

### App Vue

- `src/main.ts` - Inicialização
- `src/composables/useFragmentSDK.ts` - Composable
- `src/App.vue` - Componente principal
- `src/components/AttributeDemo.vue` - Demo de atributos

### App Solid

- `src/index.tsx` - Inicialização
- `src/store/fragmentSDK.ts` - Store
- `src/App.tsx` - Componente principal
- `src/components/PerformanceDemo.tsx` - Demo de performance

## Ordem de Execução

1. **Exploração** (30 min)

   - Ler código atual de cada app
   - Identificar padrões existentes
   - Documentar estrutura atual

2. **App Shell** (2h)

   - Implementar shell principal
   - Criar routing
   - Adicionar fragments
   - Implementar UI de controle

3. **App Angular** (1.5h)

   - Service wrapper
   - Callbacks bidirecionais
   - Error handling
   - Formulários

4. **App React** (1.5h)

   - Custom hook
   - Transferables
   - Context
   - Async functions

5. **App Vue** (1.5h)

   - Composable
   - Reatividade
   - Watchers
   - Navegação

6. **App Solid** (1.5h)

   - Store
   - Signals
   - Batch updates
   - Performance

7. **Testes** (1h)
   - Testar cada funcionalidade
   - Verificar integração
   - Validar cleanup
   - Memory leak checks

## Resultado Esperado

Ao final, teremos:

- ✅ 5 apps totalmente funcionais
- ✅ Exemplos de TODAS as funcionalidades do SDK
- ✅ Código limpo e bem documentado
- ✅ Padrões de uso para cada framework
- ✅ Demos interativas no shell
- ✅ Documentação viva do SDK
