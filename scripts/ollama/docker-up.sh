#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker/docker-compose.ollama.yml"
OLLAMA_HOST="${OLLAMA_HOST:-http://127.0.0.1:11434}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker no esta instalado o no esta en PATH."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon no esta corriendo."
  exit 1
fi

echo "Levantando Ollama con docker compose..."
docker compose -f "$COMPOSE_FILE" up -d

for _ in $(seq 1 40); do
  if curl -fsS "$OLLAMA_HOST/api/tags" >/dev/null 2>&1; then
    echo "Ollama listo en $OLLAMA_HOST"
    exit 0
  fi
  sleep 1
done

echo "Ollama no respondio a tiempo. Revisa: docker compose -f $COMPOSE_FILE logs"
exit 1
