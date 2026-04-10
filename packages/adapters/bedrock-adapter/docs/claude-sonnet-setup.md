# Claude Sonnet en Bedrock: Configuración Requerida

**SÍ, Claude Sonnet está completamente soportado.** Pero requiere configuración adicional (Inference Profile).

## ⚠️ Importante

Bedrock tiene dos modos de acceso a Claude Sonnet:

| Modo | Requiere | Costo |
|------|----------|-------|
| **On-Demand** | Inference Profile | $3/$15 por 1M tokens |
| **Provisioned** | Throughput Purchase | ~$1.50-7.50/hora (descuento 40-50%) |

**TL;DR:** No puedes invocar Claude Sonnet directamente. Debes usar uno de estos dos métodos.

## Opción 1: Usar Inference Profile (Recomendado para dev/test)

### Crear Inference Profile en Bedrock Console

1. Ve a: https://console.aws.amazon.com/bedrock/
2. **Inference profiles** → **Create inference profile**
3. **Name:** `claude-sonnet-profile`
4. **Models to include:** Selecciona Claude Sonnet
5. **Regions:** us-east-1 (y adicionales si quieres redundancia)
6. Click **Create**

### Usar en código

```typescript
import { getAdapter } from '@paperclip/bedrock-adapter';

const adapter = getAdapter();

// Usar model ID como ARN del Inference Profile
const response = await adapter.invokeModel(
  'arn:aws:bedrock:us-east-1:ACCOUNT-ID:inference-profile/claude-sonnet-profile',
  [
    {
      role: 'user',
      content: 'Explica AWS Bedrock',
    },
  ]
);
```

## Opción 2: Provisioned Throughput (Recomendado para producción)

### Comprar Throughput

1. Ve a: https://console.aws.amazon.com/bedrock/
2. **Provisioned model throughput** → **Purchase provisioned throughput**
3. **Model:** Selecciona Claude Sonnet
4. **Throughput:** 1,000 TPM (~$1.50/hora)
5. Click **Purchase**

### Usar en código

```typescript
// Después de comprar throughput, funciona con model ID directo
const response = await adapter.invokeModel('claude-sonnet', [
  {
    role: 'user',
    content: 'Explica AWS Bedrock',
  },
]);
```

## 🔄 Comparativa: Claude Sonnet vs Llama 8B

| Aspecto | Claude Sonnet | Llama 8B |
|--------|---------------|---------|
| **Requiere Inference Profile** | ✅ Sí | ❌ No |
| **Requiere Provisioned Throughput** | ❌ No (opcional) | ❌ No (opcional) |
| **Funciona On-Demand directo** | ❌ No | ✅ Sí |
| **Calidad** | ⭐⭐⭐⭐ Muy buena | ⭐⭐⭐ Buena |
| **Velocidad** | Rápido | Muy rápido |
| **Costo On-Demand** | $3/$15 | $0.075/$0.10 |

## ✅ Recomendación

Para empezar rápido:
```typescript
// Usa Llama 8B (ON-DEMAND INMEDIATO)
await adapter.invokeModel('llama-8b', messages);
```

Para producción con mejor calidad:
```typescript
// Configura Inference Profile + Claude Sonnet
// O Provisioned Throughput + Claude Sonnet
```

## 📋 Checklist: Habilitar Claude Sonnet

- [ ] Ve a Bedrock Console → Model access
- [ ] Habilita `anthropic.claude-sonnet-4-20250514-v1:0`
- [ ] Elige UNA de estas opciones:
  - [ ] Opción A: Crea Inference Profile (`claude-sonnet-profile`)
  - [ ] Opción B: Compra Provisioned Throughput (1,000 TPM)
- [ ] Usa en código con ARN (Opción A) o alias `claude-sonnet` (Opción B)

---

**Estado actual:** Claude Sonnet is available, but requires Inference Profile or Provisioned Throughput to use on-demand.
