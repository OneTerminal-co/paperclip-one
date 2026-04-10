# Guía: Usar Múltiples Modelos en Bedrock

Ahora el adaptador Bedrock soporta múltiples modelos económicos. Aquí cómo usarlos.

## 📊 Modelos Disponibles

### Anthropic Claude (Premium)
```typescript
'claude-opus'   // Premium: razonamiento avanzado
'claude-sonnet' // Balanceado
'claude-haiku'  // 💰 Económico: rápido
```

### Meta Llama (MÁS ECONÓMICOS ⭐)
```typescript
'llama-8b'   // 💰💰💰 Muy económico, tareas simples
'llama-70b'  // 💰💰 Económico pero potente, razonamiento
```

### Cohere
```typescript
'command-r'      // 💰 Económico
'command-r-plus' // Balanceado
```

## 💰 Comparativa de Precios

```
Por 1M tokens (Input / Output):

llama-8b:       $0.075 / $0.10           ← ⭐ MÁS ECONÓMICO
llama-70b:      $0.59 / $0.79
command-r:      $0.50 / $1.50
claude-haiku:   $0.80 / $4.00
command-r-plus: $3 / $15
claude-sonnet:  $3 / $15
claude-opus:    $15 / $75
```

## 🚀 Uso en Código

### Ejemplo 1: Usar Llama económico para tareas simples

```typescript
import { getAdapter } from '@paperclip/bedrock-adapter';

const adapter = getAdapter();

// Tarea simple → Llama 8B (más económico)
const response = await adapter.invokeModel('llama-8b', [
  {
    role: 'user',
    content: 'Traduce al inglés: Buenos días',
  },
]);

console.log(response.content[0].text);
```

### Ejemplo 2: Usar Claude Haiku (balance precio-calidad)

```typescript
// Tareas medianas → Claude Haiku
const response = await adapter.invokeModel('claude-haiku', [
  {
    role: 'user',
    content: 'Analiza este JSON y extrae campos: {...}',
  },
]);
```

### Ejemplo 3: Usar Claude Opus para tareas complejas

```typescript
// Tareas complejas → Claude Opus (mejor razonamiento)
const response = await adapter.invokeModel('claude-opus', [
  {
    role: 'user',
    content: 'Diseña una arquitectura de microservicios para...',
  },
]);
```

### Ejemplo 4: Seleccionar modelo según complejidad

```typescript
async function processTask(taskDescription: string, complexity: 'simple' | 'medium' | 'complex') {
  let modelToUse: string;
  
  switch (complexity) {
    case 'simple':
      modelToUse = 'llama-8b';      // 💰 Muy económico
      break;
    case 'medium':
      modelToUse = 'claude-haiku';  // 💰 Económico
      break;
    case 'complex':
      modelToUse = 'claude-opus';   // Premium, mejor razonamiento
      break;
  }
  
  const response = await adapter.invokeModel(modelToUse, [
    { role: 'user', content: taskDescription },
  ]);
  
  return response;
}

// Uso:
await processTask('Suma 2+2', 'simple');             // → llama-8b
await processTask('Analiza un documento', 'medium'); // → claude-haiku
await processTask('Diseña una solución arquitectónica', 'complex'); // → claude-opus
```

## 🔧 Configuración en Bedrock Console

### Paso 1: Habilitar Modelos

Ve a: `https://console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess`

Habilita estos modelos (toggle ON):
- ✅ `meta.llama3-8b-instruct-v1:0`
- ✅ `meta.llama3-70b-instruct-v1:0`
- ✅ `anthropic.claude-haiku-v1:0`
- ✅ `anthropic.claude-sonnet-4-20250514-v1:0`
- ✅ `anthropic.claude-opus-v1:0`
- ✅ `cohere.command-r-v1:0`

### Paso 2: (Opcional) Configurar Provisioned Throughput

Para ahorrar 40-50%:

1. Ve a: **Bedrock → Provisioned model throughput**
2. Click **Purchase provisioned throughput**
3. Selecciona modelo (ej: `llama-8b`)
4. Elige Units: `1,000 TPM` (~$0.30/hora)
5. Click **Purchase**

### Paso 3: (Si usas Claude On-Demand) Crear Inference Profile

1. Ve a: **Bedrock → Inference profiles**
2. Click **Create inference profile**
3. **Name:** `claude-multi`
4. **Models:** Selecciona Claude models
5. Click **Create**

Luego usa: `arn:aws:bedrock:us-east-1:ACCOUNT-ID:inference-profile/claude-multi`

## 📋 Decisión: Qué Modelo Usar

| Caso de Uso | Recomendación | Razón |
|-------------|---------------|-------|
| Clasificación simple | `llama-8b` | Rápido, económico |
| Traducción | `llama-8b` | No requiere razonamiento avanzado |
| Extracción de datos | `claude-haiku` | Mejor comprensión que Llama |
| Análisis de documentos | `claude-haiku` | Balance precio-calidad |
| Razonamiento complejo | `claude-opus` | Mejor en problemas difíciles |
| Escritura creativa | `claude-opus` | Más coherente y natural |
| Código generation | `claude-sonnet` | Balance: precio + calidad |

## ✅ Streaming con Múltiples Modelos

```typescript
// Streaming funciona con todos los modelos
const stream = adapter.invokeModelStream('llama-70b', [
  { role: 'user', content: 'Escribe un poema sobre programación' },
]);

for await (const chunk of stream) {
  if (chunk.contentBlockDelta?.delta?.text) {
    process.stdout.write(chunk.contentBlockDelta.delta.text);
  }
}
```

## 🧪 Test Completo

Para probar todos los modelos:

```bash
# Actualiza .env.local
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# Ejecuta test
npm run test:bedrock
```

## 📈 Optimización de Costos

### Estrategia 1: Tiered Routing (Recomendado)
```
Requests simples        → llama-8b      (AHORRO: 98%)
Requests medianas      → claude-haiku   (AHORRO: 70%)
Requests complejas     → claude-opus    (Sin ahorro, pero mejor calidad)
```

**Ahorro promedio: 60-70% vs usar siempre Claude Opus**

### Estrategia 2: Provisioned Throughput
Para producción con volumen predecible:
```
Ahorro: 40-50% vs On-Demand
Compromiso: mínimo de 1,000 TPM (~$0.30/hora)
```

### Estrategia 3: Regional Fallback
```typescript
// Si modelo no disponible en región, intenta otra
const FALLBACK_MODELS = {
  'llama-8b': ['us-east-1', 'us-west-2', 'eu-west-1'],
  'claude-haiku': ['us-east-1', 'us-west-2'],
};
```

## 🚀 Próximos Pasos

1. ✅ Habilita modelos en Bedrock Console (5 min)
2. ✅ Usa el adaptador actualizado
3. ✅ Implementa estrategia de routing (simple, medium, complex)
4. ✅ Monitorea costos en AWS Console (Cost Explorer)
5. ✅ (Opcional) Configura Provisioned Throughput cuando tengas volumen

---

**Resultado esperado:** Misma calidad, 60-70% menos en costos de IA 🎉
