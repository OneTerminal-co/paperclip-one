# Plan: Ollama Local-First (Sin APIs pagas)

Date: 2026-04-08
Branch: `feat/ollama-local-first`
Status: In progress

## Objetivo

Habilitar ejecución local con Ollama desde este mismo repositorio, sin depender de Claude/Gemini APIs para el flujo base.

## Alcance MVP

- Levantar/parar/verificar Ollama con Docker Compose desde el repo.
- Levantar/parar/verificar Ollama desde scripts del repo.
- Descargar modelos locales iniciales (`gemma3:4b`, `gemma3:12b`).
- Exponer un bridge HTTP local para integrar con el adapter `http` actual de Paperclip.
- Dejar runbook operativo para que cualquier developer lo ejecute en local.

## Implementación (MVP)

1. `docker/docker-compose.ollama.yml`
   - Servicio `ollama` con volumen persistente local.
2. `scripts/ollama/docker-up.sh`, `docker-down.sh`, `docker-status.sh`, `docker-pull-models.sh`
   - Operación completa de runtime local vía Docker Compose.
3. `scripts/ollama/up.sh`
   - Inicia `ollama serve` si no está corriendo.
   - Espera health en `http://127.0.0.1:11434/api/tags`.
4. `scripts/ollama/down.sh`
   - Detiene proceso lanzado por el script usando PID file local.
5. `scripts/ollama/status.sh`
   - Verifica estado y conectividad de Ollama.
6. `scripts/ollama/pull-models.sh`
   - Descarga modelos base con `OLLAMA_MODELS` configurable.
7. `scripts/ollama/http-bridge.mjs`
   - Endpoint `POST /invoke` para recibir payload del adapter `http`.
   - Llama a Ollama (`/api/generate`) con modelo local.
   - Si recibe `issueId` y hay `PAPERCLIP_API_KEY`, publica comentario de resultado en el issue.
8. `package.json`
   - Comandos: `ollama:docker:*`, `ollama:*`, `ollama:bridge`.

## Configuración de agente (http adapter)

`adapterType: "http"`

`adapterConfig` mínimo:

```json
{
  "url": "http://127.0.0.1:11435/invoke",
  "method": "POST",
  "timeoutMs": 120000,
  "payloadTemplate": {
    "model": "gemma3:4b"
  }
}
```

Notas:
- El bridge usa `context.issueId` o `context.taskId` para postear comentario al issue.
- Para comentar en Paperclip se requiere `PAPERCLIP_API_KEY` en el proceso del bridge.

## Operación local desde cero

```sh
pnpm ollama:docker:up
pnpm ollama:docker:pull-models
PAPERCLIP_API_KEY=<agent_or_service_key> pnpm ollama:bridge
pnpm dev
```

## Verificación

1. `pnpm ollama:docker:status` devuelve running.
2. `curl http://127.0.0.1:11435/health` responde `ok: true`.
3. Crear agente `http` apuntando al bridge.
4. Ejecutar wake manual y confirmar comentario automático en el issue.

## Riesgos / Mitigación

- Ollama no instalado en host:
  - Mitigación: scripts fallan con mensaje explícito e instrucción de instalación.
- Sin `PAPERCLIP_API_KEY` en bridge:
  - Mitigación: el invoke sigue respondiendo, pero no postea comentario.
- Modelo no descargado:
  - Mitigación: usar `pnpm ollama:pull-models` o definir `OLLAMA_MODELS`.

## Próxima fase opcional

Crear adapter nativo `ollama_local` con `listModels()` y `testEnvironment()` para UX completa en formulario de agentes.
