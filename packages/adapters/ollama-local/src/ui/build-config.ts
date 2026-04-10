import type { OllamaConfig } from "../types.js";

export interface OllamaUIFormValues {
  endpoint?: string;
  model?: string;
  temperature?: number;
  numPredict?: number;
}

export function buildOllamaConfig(
  values: OllamaUIFormValues
): Record<string, unknown> {
  const config: Partial<OllamaConfig> = {};

  if (values.endpoint) config.endpoint = values.endpoint;
  if (values.model) config.model = values.model;
  if (values.temperature !== undefined)
    config.temperature = Math.max(0, Math.min(1, values.temperature));
  if (values.numPredict !== undefined)
    config.numPredict = Math.max(1, values.numPredict);

  return {
    endpoint: config.endpoint || "http://localhost:11434",
    model: config.model || "gemma3:4b",
    temperature: config.temperature ?? 0.7,
    numPredict: config.numPredict ?? 2048,
    maxSkillsPromptChars: 1200,
  };
}
