# AWS Bedrock Setup para Paperclip

Guía completa para configurar Paperclip con AWS Bedrock como proveedor de modelos de IA.

## 1. Prerequisitos

- Cuenta AWS activa
- AWS CLI configurado (`aws configure`)
- Node.js 18+ y pnpm instalados
- Paperclip clonado localmente

## 2. Crear IAM User y Access Keys

### 2.1 Desde AWS Console

1. Ve a **IAM → Users → Create user**
2. Nombre: `paperclip-bedrock-user`
3. En **Set permissions**, selecciona **Attach policies directly**
4. Copia y pega la siguiente política inline:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockInvokeModels",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-sonnet*",
        "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-haiku*",
        "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-opus*",
        "arn:aws:bedrock:*::foundation-model/meta.llama3-1*",
        "arn:aws:bedrock:*::foundation-model/cohere.command-r*"
      ]
    },
    {
      "Sid": "BedrockListModels",
      "Effect": "Allow",
      "Action": [
        "bedrock:ListFoundationModels"
      ],
      "Resource": "*"
    }
  ]
}
```

5. Click **Create user**

### 2.2 Generar Access Keys

1. En **Users**, busca `paperclip-bedrock-user`
2. **Security credentials → Create access key**
3. Selecciona **Application running outside AWS** → **Next**
4. **Create access key**
5. **Copia y guarda** (no se puede recuperar después):
   - `Access Key ID`
   - `Secret Access Key`

⚠️ **SEGURIDAD**: Nunca compartas estas claves. Si las comprometes, desactívalas inmediatamente.

## 3. Configurar Variables de Entorno

### 3.1 Crear `.env.local` (nunca commitear)

```bash
cp .env.example .env.local
```

Edita `.env.local`:

```env
# Existente
DATABASE_URL=postgres://paperclip:paperclip@localhost:5432/paperclip
PORT=3100
SERVE_UI=false
BETTER_AUTH_SECRET=paperclip-dev-secret

# Nuevo - AWS Bedrock
AWS_ACCESS_KEY_ID=AKIA... (tu Access Key ID)
AWS_SECRET_ACCESS_KEY=... (tu Secret Access Key)
AWS_REGION=us-east-1

# Bedrock Model Config
BEDROCK_MODEL=anthropic.claude-3-5-sonnet-20241022
BEDROCK_TEMPERATURE=0.7
BEDROCK_MAX_TOKENS=4096
```

### 3.2 Verificar Credenciales

```bash
aws sts get-caller-identity
```

Deberías ver el ARN del user `paperclip-bedrock-user`.

## 4. Crear Adaptador Bedrock para Paperclip

### 4.1 Estructura del Adaptador

En `packages/adapters/bedrock-adapter/`:

```
bedrock-adapter/
├── package.json
├── src/
│   ├── index.ts           # Adaptador principal
│   ├── client.ts          # Cliente Bedrock
│   ├── config.ts          # Configuración
│   └── streaming.ts       # Soporte streaming
└── tsconfig.json
```

### 4.2 Implementación Básica

**src/config.ts:**
```typescript
export const BEDROCK_CONFIG = {
  models: {
    'claude-3-5-sonnet': 'anthropic.claude-3-5-sonnet-20241022',
    'claude-3-5-haiku': 'anthropic.claude-3-5-haiku-20241022',
    'claude-3-opus': 'anthropic.claude-3-opus-20250219',
  },
  temperature: parseFloat(process.env.BEDROCK_TEMPERATURE || '0.7'),
  maxTokens: parseInt(process.env.BEDROCK_MAX_TOKENS || '4096'),
  region: process.env.AWS_REGION || 'us-east-1',
};
```

**src/client.ts:**
```typescript
import { BedrockRuntime } from '@aws-sdk/client-bedrock-runtime';

export function createBedrockClient() {
  return new BedrockRuntime({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}
```

**src/index.ts:**
```typescript
import { createBedrockClient } from './client';
import { BEDROCK_CONFIG } from './config';

export class BedrockAdapter {
  private client = createBedrockClient();

  async invokeModel(messages: any[], model: string) {
    const modelId = BEDROCK_CONFIG.models[model as keyof typeof BEDROCK_CONFIG.models];
    
    const response = await this.client.invokeModel({
      modelId,
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-06-01',
        max_tokens: BEDROCK_CONFIG.maxTokens,
        temperature: BEDROCK_CONFIG.temperature,
        messages,
      }),
    });

    return JSON.parse(response.body.toString());
  }
}

export const bedrockAdapter = new BedrockAdapter();
```

## 5. Registrar en Paperclip

En `packages/adapters/index.ts`:

```typescript
import { bedrockAdapter } from './bedrock-adapter';

export const adapters = {
  // existentes...
  bedrock: bedrockAdapter,
};
```

## 6. Testing

```bash
# Verificar sintaxis
pnpm -r typecheck

# Ejecutar tests
pnpm test:run

# Build completo
pnpm build
```

## 7. Solución de Problemas

### Error: "InvalidSignatureException"
- Verifica que `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY` sean correctos
- Ejecuta `aws sts get-caller-identity`

### Error: "AccessDenied"
- Verifica que la IAM policy esté correctamente attachada
- Revisa que el modelo exista en `BEDROCK_CONFIG.models`

### Error: "UnknownServiceException"
- Confirma que `AWS_REGION` es válida (ej: `us-east-1`, `us-west-2`)
- Verifica disponibilidad de Bedrock en esa región

### Rate Limiting
- Bedrock tiene límites de 10 solicitudes/segundo
- Implementa retry logic con exponential backoff

## 8. Deployment a Producción

Para producción, **NO uses Access Keys**. Usa **IAM Roles**:

```bash
# En EC2/Lambda, Paperclip obtiene credenciales automáticamente
# No necesitas AWS_ACCESS_KEY_ID ni AWS_SECRET_ACCESS_KEY
```

### Crear IAM Role para EC2

1. **IAM → Roles → Create role**
2. **Trusted entity**: AWS service → EC2
3. Adjunta la misma Bedrock policy
4. Asigna a instancia EC2

### Crear IAM Role para Lambda

1. **IAM → Roles → Create role**
2. **Trusted entity**: AWS service → Lambda
3. Adjunta la misma Bedrock policy
4. Usa en función Lambda

## Referencias

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/)
- [Paperclip Adapter System](./doc/DEVELOPING.md)
