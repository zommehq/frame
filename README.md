# Micro-Frontend Architecture with Bun Monorepo

Arquitetura de micro-frontend usando Web Components, iframes, postMessage e SDK para comunicação bidirecional entre apps.

See [Architecture](./docs/architecture.md) for detailed documentation.

## Quick Start

### Instalação

```bash
# Instalar dependências
bun install

# Build de todos os apps
bun build
```

### Desenvolvimento

```bash
# Todos os apps em paralelo
bun dev
```

Acesse: http://localhost:4200

## Documentação

* [Arquitetura Detalhada](docs/architecture.md)
* [Frame Package](packages/frame/README.md)
* [Documentação Completa](packages/frame/docs/)

## API Reference

### Frame (Parent)

```html
<z-frame
  name="admin"
  src="https://..."
  base="/admin"
></z-frame>
```

```typescript
// Properties
frame.apiUrl = 'https://api.example.com';
frame.theme = 'dark';
frame.onSuccess = (data) => console.log(data);

// Methods
frame.emit('theme-change', { theme: 'dark' });
frame.themeChange({ theme: 'dark' }); // camelCase alias

// Events
frame.addEventListener('ready', () => {});
frame.addEventListener('user-created', (e) => {});
```

[Documentação Completa →](packages/frame/docs/references/frame.md)

### Frame SDK (Child)

```typescript
import { frameSDK } from '@zomme/frame/sdk';

// Inicializar
await frameSDK.initialize();

// Props
console.log(frameSDK.props.name);
frameSDK.props.onSuccess({ status: 'ok' });

// Eventos
frameSDK.emit('user-created', { id: 123 });
frameSDK.on('theme-change', (data) => {});

// Watch prop changes (modern API)
const unwatch = frameSDK.watch(['apiUrl', 'theme'], (changes) => {
  if ('apiUrl' in changes) {
    const [newUrl, oldUrl] = changes.apiUrl;
    console.log(`API URL changed from ${oldUrl} to ${newUrl}`);
  }
});
```

[Documentação Completa →](packages/frame/docs/references/sdk.md)

## Recursos

### Function Serialization

Funções podem ser passadas bidirecionalmente:

```typescript
// Parent → Child
frame.onSuccess = (data) => console.log(data);

// Child usa
frameSDK.props.onSuccess({ status: 'ok' });
```

[Mais detalhes →](packages/frame/docs/advanced/function-serialization.md)

### Transferables

Performance otimizada para dados grandes:

```typescript
const buffer = new ArrayBuffer(1024 * 1024);
frameSDK.emit('data', { buffer }); // zero-copy transfer
```

## Frameworks

* [Angular](packages/frame/docs/frameworks/angular.md)
* [React](packages/frame/docs/frameworks/react.md)
* [Vue](packages/frame/docs/frameworks/vue.md)
* [Solid](packages/frame/docs/frameworks/solid.md)

## Deploy

```bash
# Build
bun run build

# Upload para CDN
aws s3 sync dist/app-angular/ s3://cdn/angular/v1.0.0/
```

```html
<!-- Shell aponta para versão específica -->
<z-frame src="https://cdn.example.com/angular/v1.0.0/" />
```

## Vantagens vs Desvantagens

| ✅ Vantagens | ❌ Desvantagens |
|-------------|-----------------|
| Deploy independente | Complexidade inicial |
| Isolamento total | Debugging cross-context |
| Framework agnostic | Alguma duplicação |
| Function serialization | SEO limitado |
| Transferables support | |

## Quando Usar

✅ **Use quando:**

* Deploy independente é crítico
* Times autônomos
* Isolamento necessário
* Múltiplos apps (3+)

❌ **Não use quando:**

* Time pequeno único
* SEO crítico
* Performance extrema necessária

## Testes

```bash
bun test
bun test --watch
bun test --coverage
```

## Troubleshooting

[Ver documentação completa](packages/frame/docs/)

## Referências

* [Web Components MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
* [postMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
* [Transferable Objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects)

## Acknowledgments

This project was inspired by architectural patterns from:

* [zoid](https://github.com/krakenjs/zoid) by PayPal
* [post-robot](https://github.com/krakenjs/post-robot) by PayPal

## License

MIT License - see [LICENSE](LICENSE) for details.
