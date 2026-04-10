# Test Seguro de Bedrock - Sin Exponer Credenciales

## Cómo ejecutar el test CORRECTAMENTE

### 1. Obtén credenciales nuevas en AWS (sin compartir)

```bash
# En AWS Console (no en terminal/chat):
#   1. IAM → Users → paperclip-bedrock-user
#   2. Security credentials → Access keys → Delete old keys
#   3. Create access key
#   4. Descarga o copia: Access Key ID + Secret Access Key
```

### 2. Configura variables de entorno LOCALES (no en archivos)

```bash
# En tu terminal LOCAL - estas no se guardan en git:
export AWS_ACCESS_KEY_ID="tu_access_key_aqui"
export AWS_SECRET_ACCESS_KEY="tu_secret_aqui"
export AWS_REGION="us-east-1"

# Verifica que funcionan:
aws sts get-caller-identity
```

### 3. Ejecuta el test (credenciales vienen de env, no de archivos)

```bash
npm run test:bedrock
```

### 4. El script hace lo siguiente automáticamente:

✅ Lee credenciales de variables de entorno  
✅ **NO las expone** en logs o reportes  
✅ Valida conexión a AWS  
✅ Verifica acceso a Bedrock  
✅ Prueba invocación de Claude  
✅ Genera reporte en `bedrock-test-report.json` (sin credenciales)  

### 5. Reporta resultados sin mostrar datos sensibles

Si falla, el script muestra:
```
❌ Model Invocation: Error de conexión
```

No incluye las credenciales en ningún lado.

---

## Por qué este enfoque

❌ **Inseguro:** Guardar credenciales en archivos de texto  
❌ **Inseguro:** Compartir credenciales en chat/email  
❌ **Inseguro:** Commitear secretos a git  

✅ **Seguro:** Variables de entorno locales del shell (no se guardan)  
✅ **Seguro:** Credenciales nunca en git  
✅ **Seguro:** Pruebas automáticas sin exponer datos  

---

## Archivos de seguridad

- `.env.local` — **Vacío**, contiene solo instrucciones  
- `packages/adapters/bedrock-adapter/scripts/test-bedrock-safe.mjs` — Lee env vars, no muestra credenciales  
- `bedrock-test-report.json` — Reporte sin secretos (OK commitear)  

---

## Después del test

Si funciona:

```bash
# Desactiva credenciales de env (solo sesión actual)
unset AWS_ACCESS_KEY_ID
unset AWS_SECRET_ACCESS_KEY

# O cierra la terminal (se olvida automáticamente)
exit
```

Las credenciales solo viven en memoria mientras el shell esté abierto.
