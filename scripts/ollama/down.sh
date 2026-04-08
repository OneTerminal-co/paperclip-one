#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PID_FILE="$ROOT_DIR/.paperclip/run/ollama.pid"

if [[ ! -f "$PID_FILE" ]]; then
  echo "No hay PID file de Ollama en $PID_FILE"
  exit 0
fi

PID="$(cat "$PID_FILE")"
if [[ -z "$PID" ]]; then
  echo "PID file vacio, eliminando archivo"
  rm -f "$PID_FILE"
  exit 0
fi

if kill -0 "$PID" >/dev/null 2>&1; then
  kill "$PID"
  echo "Ollama detenido (PID $PID)"
else
  echo "Proceso $PID no existe; limpiando PID file"
fi

rm -f "$PID_FILE"
