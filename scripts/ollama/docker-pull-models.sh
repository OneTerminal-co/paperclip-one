#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker/docker-compose.ollama.yml"
MODELS="${OLLAMA_MODELS:-gemma3:4b gemma3:12b}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker no esta instalado o no esta en PATH."
  exit 1
fi

docker compose -f "$COMPOSE_FILE" up -d ollama >/dev/null

for model in $MODELS; do
  echo "Pull model in container: $model"
  docker compose -f "$COMPOSE_FILE" exec -T ollama ollama pull "$model"
done

echo "Modelos descargados en volumen docker: $MODELS"
