#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/.paperclip/run"
PID_FILE="$RUNTIME_DIR/ollama.pid"
LOG_FILE="$RUNTIME_DIR/ollama.log"
OLLAMA_HOST="${OLLAMA_HOST:-http://127.0.0.1:11434}"

mkdir -p "$RUNTIME_DIR"

if ! command -v ollama >/dev/null 2>&1; then
  echo "ollama CLI no esta instalado en esta maquina."
  echo "Instala Ollama: https://ollama.com/download"
  exit 1
fi

if curl -fsS "$OLLAMA_HOST/api/tags" >/dev/null 2>&1; then
  echo "Ollama ya esta corriendo en $OLLAMA_HOST"
  exit 0
fi

echo "Iniciando ollama serve..."
nohup ollama serve >"$LOG_FILE" 2>&1 &
OLLAMA_PID=$!
echo "$OLLAMA_PID" >"$PID_FILE"

for _ in $(seq 1 30); do
  if curl -fsS "$OLLAMA_HOST/api/tags" >/dev/null 2>&1; then
    echo "Ollama iniciado correctamente en $OLLAMA_HOST"
    echo "PID: $OLLAMA_PID"
    echo "Log: $LOG_FILE"
    exit 0
  fi
  sleep 1
done

echo "No se pudo iniciar Ollama a tiempo. Revisa $LOG_FILE"
exit 1
