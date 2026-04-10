# Bedrock Setup Rápido - Paperclip

Guía rápida para usar credenciales temporales de AWS Bedrock en Paperclip.

## 1️⃣ Obtén tus credenciales temporales

1. Ve a **AWS Console** → IAM → Users → `paperclip-bedrock-user`
2. **Security credentials** → **Create access key**
3. Selecciona **Application running outside AWS** → **Next**
4. **Create access key** y copia:
   - `Access Key ID` (empieza con `AKIA`)
   - `Secret Access Key`

⚠️ **NO pierdas estas claves** — no se pueden recuperar después.

## 2️⃣ Actualiza credenciales en `.env.local`

### Opción A: Script automático

```bash
chmod +x packages/adapters/bedrock-adapter/scripts/update-credentials.sh
./packages/adapters/bedrock-adapter/scripts/update-credentials.sh
```

El script te preguntará por las nuevas credenciales y actualizará `.env.local`.

### Opción B: Manual

Edita `.env.local`:

```env
AWS_ACCESS_KEY_ID=AKIA...     # Tu Access Key ID
AWS_SECRET_ACCESS_KEY=...     # Tu Secret Access Key
AWS_REGION=us-east-1          # Región (ó us-west-2, eu-west-1)
```

## 3️⃣ Verifica que funciona

```bash
# Verifica credenciales AWS
aws sts get-caller-identity

# Deberías ver algo como:
# {
#   "UserId": "AIDAI...",
#   "Account": "123456789",
#   "Arn": "arn:aws:iam::123456789:user/paperclip-bedrock-user"
# }
```

## 4️⃣ Test Bedrock

```bash
# Build del adaptador
pnpm --filter @paperclip/bedrock-adapter build

# Ejecuta el test
pnpm test:bedrock
```

Deberías ver:
```
🔍 Iniciando test de Bedrock...

📋 Verificando credenciales AWS:
  ✓ AWS_ACCESS_KEY_ID: ✅ Configurada
  ✓ AWS_SECRET_ACCESS_KEY: ✅ Configurada
  ✓ AWS_REGION: us-east-1

📡 Conectando a Bedrock...
📚 Modelos disponibles:
  • claude-3-5-sonnet: anthropic.claude-3-5-sonnet-20241022
  • claude-3-5-haiku: anthropic.claude-3-5-haiku-20241022
  ...

🎯 Enviando mensaje de prueba a Claude 3.5 Sonnet...
✅ Respuesta exitosa:
  "Soy Claude, un asistente de IA..."
```

## 5️⃣ Actualiza credenciales cuando expiren

Las credenciales temporales de AWS típicamente expiran. Cuando lo hagan:

1. Ve a AWS IAM y crea nuevas credenciales
2. Ejecuta: `./packages/adapters/bedrock-adapter/scripts/update-credentials.sh`
3. Ingresa las nuevas credenciales
4. Verifica: `aws sts get-caller-identity`

## 🔐 Seguridad

✅ **`.env.local` está en `.gitignore`** — nunca se commitea
✅ **Credenciales solo en memoria** — no se guardan en disco
✅ **Para producción:** Usa IAM Roles (EC2/Lambda/ECS), no Access Keys

## 📁 Archivos de utilidad

- `packages/adapters/bedrock-adapter/scripts/test-bedrock.mjs` — Script para probar conexión Bedrock
- `packages/adapters/bedrock-adapter/scripts/update-credentials.sh` — Script para actualizar credenciales
- `packages/adapters/bedrock-adapter/` — Implementación del adaptador
- `packages/adapters/bedrock-adapter/docs/setup.md` — Documentación completa

## ⚙️ Próximos pasos

1. Build: `pnpm --filter @paperclip/bedrock-adapter build`
2. Test: `pnpm test:bedrock`
3. Integra en Paperclip según `packages/adapters/bedrock-adapter/docs/setup.md`
4. Crea un agente que use Bedrock vía la UI

---

¿Tienes preguntas? Revisa `packages/adapters/bedrock-adapter/docs/setup.md` para la documentación completa.
