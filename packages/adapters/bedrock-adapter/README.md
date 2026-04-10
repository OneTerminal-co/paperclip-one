# AWS Bedrock Adapter for Paperclip

Integra modelos de AWS Bedrock (Anthropic, Meta, Cohere, DeepSeek, Mistral, Amazon Nova, OpenAI OSS) con Paperclip usando la API Converse.

## Features

✅ Soporte para Anthropic Claude (Haiku, Sonnet, Opus)
✅ Soporte para Meta Llama (3B, 8B, 70B)
✅ Soporte para Cohere Command-R
✅ Soporte para DeepSeek, Mistral, Amazon Nova y OpenAI OSS (aliases)
✅ Streaming de respuestas con async generators
✅ Manejo automático de errores y reintentos
✅ Credenciales desde variables de entorno
✅ TypeScript completo

## Setup

### 1. Instalar dependencias

```bash
# En monorepo
pnpm install

# O directamente
pnpm add @aws-sdk/client-bedrock-runtime @aws-sdk/credential-providers
```

### 2. Configurar credenciales AWS

Crea `.env.local` en la raíz del proyecto:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# Opcional
BEDROCK_TEMPERATURE=0.7
BEDROCK_MAX_TOKENS=4096
BEDROCK_REQUEST_TIMEOUT_MS=300000
```

### 3. Verificar credenciales

```bash
aws sts get-caller-identity
```

Deberías ver el ARN del user `paperclip-bedrock-user`.

## Uso

### Básico (non-streaming)

```typescript
import { getAdapter } from '@paperclip/bedrock-adapter';

const adapter = getAdapter();

const response = await adapter.invokeModel('claude-3-5-sonnet', [
  {
    role: 'user',
    content: 'Hola, ¿cuál es tu nombre?',
  },
]);

console.log(response.content);
```

### Con opciones personalizadas

```typescript
const response = await adapter.invokeModel(
  'claude-3-5-sonnet',
  [{ role: 'user', content: 'Explica la IA en 50 palabras' }],
  {
    temperature: 0.5,
    maxTokens: 2000,
  }
);
```

### Auto-routing por complejidad

```typescript
// Selecciona modelo automaticamente segun complejidad
const response = await adapter.invokeModel(
  'auto',
  [{ role: 'user', content: 'Resume este texto' }],
  {
    complexity: 'simple', // simple | medium | complex
    fallbackModelAliases: ['nova-lite', 'llama-8b'],
  }
);
```

Variables de entorno opcionales para routing:

```env
BEDROCK_PROFILE_SIMPLE=arn:aws:bedrock:...:application-inference-profile/...
BEDROCK_PROFILE_MEDIUM=claude-haiku
BEDROCK_PROFILE_COMPLEX=arn:aws:bedrock:...:application-inference-profile/...
```

Si no defines variables, el router usa defaults:
- simple -> `llama-8b`
- medium -> `claude-haiku`
- complex -> `claude-sonnet`

### Streaming

```typescript
const stream = adapter.invokeModelStream('claude-3-5-sonnet', [
  { role: 'user', content: 'Escribe un poema sobre la programación' },
]);

for await (const chunk of stream) {
  if (chunk.contentBlockDelta?.delta?.text) {
    process.stdout.write(chunk.contentBlockDelta.delta.text);
  }
}
```

### Listar modelos disponibles

```typescript
const models = adapter.listModels();
// {
//   'claude-3-5-sonnet': 'anthropic.claude-3-5-sonnet-20241022',
//   'claude-3-5-haiku': 'anthropic.claude-3-5-haiku-20241022',
//   ...
// }
```

## Modelos soportados

| Alias | Model ID | Proveedor | Costo |
|-------|----------|-----------|-------|
| `claude-opus` | `anthropic.claude-opus-4-20250514-v1:0` | Anthropic | 💰💰💰 Premium |
| `claude-sonnet` | `anthropic.claude-3-7-sonnet-20250219-v1:0` | Anthropic | 💰💰 Balanceado |
| `claude-haiku` | `anthropic.claude-3-5-haiku-20241022-v1:0` | Anthropic | 💰 Económico |
| `claude-sonnet-4` | `anthropic.claude-sonnet-4-20250514-v1:0` | Anthropic | 💰💰 (puede requerir inference profile) |
| `llama-8b` | `meta.llama3-8b-instruct-v1:0` | Meta | 💰 Muy económico ⭐ |
| `llama-70b` | `meta.llama3-70b-instruct-v1:0` | Meta | 💰 Económico |
| `deepseek-r1` | `deepseek.r1-v1:0` | DeepSeek | 💰💰 Alto razonamiento |
| `ministral-3b` | `mistral.ministral-3-3b-instruct` | Mistral | 💰 Económico |
| `nova-micro` | `amazon.nova-micro-v1:0` | Amazon | 💰 Muy económico |
| `nova-lite` | `amazon.nova-lite-v1:0` | Amazon | 💰 Económico |
| `nova-pro` | `amazon.nova-pro-v1:0` | Amazon | 💰💰 Balanceado |
| `gpt-oss-20b` | `openai.gpt-oss-20b-1:0` | OpenAI | 💰💰 Balanceado |
| `command-r` | `cohere.command-r-v1:0` | Cohere | 💰 Económico |
| `command-r-plus` | `cohere.command-r-plus-v1:0` | Cohere | 💰💰 Balanceado |

**Precios aproximados por 1M tokens (input/output):**
- `llama-8b`: $0.075 / $0.10 ← MÁS ECONÓMICO
- `llama-70b`: $0.59 / $0.79
- `command-r`: $0.50 / $1.50
- `claude-haiku`: $0.80 / $4.00
- `claude-sonnet`: $3 / $15
- `claude-opus`: $15 / $75

## Errores comunes

### InvalidSignatureException
```
Las credenciales no son válidas o expiró el Access Key
```

**Solución:**
```bash
aws sts get-caller-identity
```

Si falla, regenera las credenciales en IAM Console.

### AccessDenied
```
El usuario no tiene permisos necesarios
```

**Solución:** Verifica que la IAM policy esté correctamente adjunta al user.

### UnknownServiceException
```
Bedrock no disponible en esa región
```

**Solución:** Usa una región que soporte Bedrock (ej: `us-east-1`, `us-west-2`).

### ThrottlingException
```
Demasiadas solicitudes simultáneas
```

**Solución:** El adapter implementa retry automático. Si persiste, aumenta:
```env
BEDROCK_REQUEST_TIMEOUT_MS=600000
```

## API Reference

### `getAdapter(): BedrockAdapter`

Obtiene la instancia singleton del adaptador.

### `adapter.invokeModel(modelAlias, messages, options?): Promise<BedrockResponse>`

Invoca un modelo con un conjunto de mensajes.

**Parámetros:**
- `modelAlias`: string - Alias del modelo (ej: `'claude-3-5-sonnet'`)
- `messages`: BedrockMessage[] - Array de mensajes `{role, content}`
- `options?`: BedrockInvokeOptions - Opciones como temperatura, max tokens

**Retorna:** Promise<BedrockResponse> con `content`, `stopReason`, `usage`

### `adapter.invokeModelStream(modelAlias, messages, options?): AsyncGenerator<StreamBedrockResponse>`

Invoca un modelo con streaming de respuesta.

**Parámetros:** Iguales a `invokeModel`

**Retorna:** AsyncGenerator que emite chunks de respuesta

### `adapter.listModels(): Record<string, string>`

Retorna un mapa de alias → model IDs disponibles.

## Testing

```bash
# Typecheck
pnpm --filter @paperclip/bedrock-adapter typecheck

# Build
pnpm --filter @paperclip/bedrock-adapter build

# Test seguro Bedrock (desde raíz del repo)
pnpm test:bedrock

# Tests (cuando agregues vitest)
pnpm --filter @paperclip/bedrock-adapter test
```

## Production

Para producción, NO uses Access Keys. Usa **IAM Roles**:

### EC2
```bash
# Crea un IAM Role y adjúntalo a la instancia
# El adapter leerá automáticamente las credenciales temporales
```

### Lambda
```bash
# Crea un IAM Role para Lambda con la Bedrock policy
# Adjúntalo a la función
# El adapter leerá las credenciales automáticamente
```

### ECS/Fargate
```bash
# Crea un IAM Task Role con la Bedrock policy
# Asígn
alo a la tarea ECS
# Env:\n#   AWS_ROLE_ARN=arn:aws:iam::...:role/...\n#   AWS_WEB_IDENTITY_TOKEN_FILE=/var/run/secrets/eks.amazonaws.com/serviceaccount/token
```

## Documentación

- [AWS Bedrock Docs](https://docs.aws.amazon.com/bedrock/)
- [AWS SDK JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/)
- [Setup completo](./docs/setup.md)
