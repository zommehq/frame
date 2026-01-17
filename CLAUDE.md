# Development Guide

## Monorepo Workspace Structure

Este projeto usa **Bun workspaces** para gerenciar packages compartilhados:

```
micro-fe/
├── packages/
│   ├── fragment-frame/         # Core package
│   └── fragment-frame-angular/ # Angular wrapper
└── apps/
    ├── shell-angular/
    ├── app-angular/
    ├── app-react/
    └── app-vue/
```

## Mantendo Packages Atualizados

### Problema: Cache de Build

Quando você modifica código em `packages/`, os apps podem usar versões antigas por causa de:
- Cache de build do TypeScript/Angular
- `node_modules` desatualizados
- Browser cache

### Solução: Rebuild + Hard Refresh

**1. Rebuild dos packages** (quando modificar código em `packages/`):

```bash
# Rebuild apenas os packages
bun run build:packages

# Ou rebuild completo (packages + apps)
bun run build
```

**2. Reinstalar dependências** (se symlinks estiverem quebrados):

```bash
# Limpa tudo e reinstala
bun run reinstall

# Ou manualmente
rm -rf node_modules apps/*/node_modules packages/*/node_modules
bun install
```

**3. Hard Refresh no browser:**

- **Chrome/Edge:** `Cmd+Shift+R` (Mac) ou `Ctrl+Shift+R` (Windows/Linux)
- **Ou:** DevTools → Right-click Reload → "Empty Cache and Hard Reload"

## Quando Rebuild?

### ✅ **SEMPRE** rebuild depois de:
- Modificar código em `packages/fragment-frame/`
- Modificar código em `packages/fragment-frame-angular/`
- Mudar versões de dependencies
- Fazer `git pull` que modifique packages

### ❌ **NÃO** precisa rebuild para:
- Modificar código em `apps/`
- Mudar estilos CSS
- Modificar templates HTML

## Workflow Recomendado

### Desenvolvimento Normal (apps)

```bash
# Terminal 1: Dev server dos apps
bun run dev

# Trabalhe normalmente nos apps
# Hot reload funciona automático
```

### Desenvolvimento de Packages

```bash
# Terminal 1: Watch mode dos packages
cd packages/fragment-frame
bun run dev  # TypeScript watch mode

# Terminal 2: Dev server dos apps
bun run dev

# Quando salvar em packages/fragment-frame:
# 1. TypeScript recompila automaticamente
# 2. Apps detectam mudança e recarregam
# 3. Pode precisar hard refresh no browser
```

## Scripts Disponíveis

```bash
# Build
bun run build              # Build packages + apps
bun run build:packages     # Build apenas packages

# Development
bun run dev                # Start all dev servers

# Manutenção
bun run reinstall          # Clean + reinstall tudo
bun run lint               # Lint all packages

# Por workspace
bun --filter '@zomme/fragment-frame' run build
bun --filter '@zomme/app-angular' run dev
```

## Troubleshooting

### "Functions retornam undefined"

**Causa:** Browser está usando versão antiga do `fragment-frame.js`

**Solução:**
```bash
bun run build:packages
# Hard refresh no browser (Cmd+Shift+R)
```

### "Changes não aparecem"

**Causa:** Symlinks desatualizados ou cache

**Solução:**
```bash
bun run reinstall
bun run build:packages
# Hard refresh no browser
```

### "TypeError: X is not a function"

**Causa:** Versão incompatível entre packages

**Solução:**
```bash
bun run reinstall
bun run build
```

## Best Practices

1. **Sempre faça rebuild** após modificar packages
2. **Use hard refresh** para limpar browser cache
3. **Commit dist/**: Os arquivos `dist/` dos packages devem ser commitados
4. **Workspace versions**: Use `workspace:*` para dependências internas
5. **TypeScript strict**: Mantenha `strict: true` em todos tsconfig.json

## Architecture Notes

### Function Serialization

Funções passadas entre shell ↔ fragments usam **RPC (Remote Procedure Call)**:

- Parent seta função → gera UUID → envia referência
- Fragment recebe UUID → cria proxy function
- Fragment chama proxy → RPC via postMessage
- Parent executa função real → retorna resultado

**Importante:** Arrow functions mantêm contexto `this`:

```typescript
// ✅ CORRETO - arrow function
export class TasksService {
  addTask = (task) => { /* this funciona */ }
}

// ❌ ERRADO - method perderia this
export class TasksService {
  addTask(task) { /* this seria undefined */ }
}
```

### Workspace Dependencies

Apps devem declarar TODAS as dependencies, incluindo peer dependencies:

```json
{
  "dependencies": {
    "@zomme/fragment-frame": "workspace:*",        // ← Necessário!
    "@zomme/fragment-frame-angular": "workspace:*"
  }
}
```

Mesmo que `fragment-frame-angular` já dependa de `fragment-frame`, você precisa declarar explicitamente para garantir symlinks corretos.
