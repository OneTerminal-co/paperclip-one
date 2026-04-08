#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker/docker-compose.ollama.yml"
OLLAMA_HOST="${OLLAMA_HOST:-http://127.0.0.1:11434}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker no esta instalado o no esta en PATH."
  exit 1
fi

docker compose -f "$COMPOSE_FILE" ps

if curl -fsS "$OLLAMA_HOST/api/tags" >/dev/null 2>&1; then
  echo "Ollama API responde en $OLLAMA_HOST"
  exit 0
fi

echo "Ollama API no responde en $OLLAMA_HOST"
exit 1
