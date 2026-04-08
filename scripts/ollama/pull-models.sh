#!/usr/bin/env bash
set -euo pipefail

MODELS="${OLLAMA_MODELS:-gemma3:4b gemma3:12b}"

if ! command -v ollama >/dev/null 2>&1; then
  echo "ollama CLI no esta instalado en esta maquina."
  echo "Instala Ollama: https://ollama.com/download"
  exit 1
fi

for model in $MODELS; do
  echo "Pull model: $model"
  ollama pull "$model"
done

echo "Modelos descargados: $MODELS"
