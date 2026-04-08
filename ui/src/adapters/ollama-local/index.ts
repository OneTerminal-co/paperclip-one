import type { UIAdapterModule } from "../types";
import { buildOllamaConfig } from "@paperclipai/adapter-ollama-local/ui";
import { parseProcessStdoutLine } from "../process/parse-stdout";

function OllamaLocalConfigFields() {
  return null;
}

export const ollamaLocalUIAdapter: UIAdapterModule = {
  type: "ollama_local",
  label: "Ollama (local)",
  parseStdoutLine: parseProcessStdoutLine,
  ConfigFields: OllamaLocalConfigFields,
  buildAdapterConfig: buildOllamaConfig,
};
