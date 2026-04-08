#!/usr/bin/env bash
set -euo pipefail

OLLAMA_HOST="${OLLAMA_HOST:-http://127.0.0.1:11434}"

if ! command -v ollama >/dev/null 2>&1; then
  echo "ollama CLI no esta instalado en esta maquina."
  echo "Instala Ollama: https://ollama.com/download"
  exit 1
fi

if curl -fsS "$OLLAMA_HOST/api/tags" >/dev/null 2>&1; then
  echo "Ollama esta corriendo en $OLLAMA_HOST"
  exit 0
fi

echo "Ollama no esta corriendo en $OLLAMA_HOST"
exit 1
