import type { CreateConfigValues } from "@paperclipai/adapter-utils";

export function buildBedrockConfig(values: CreateConfigValues): Record<string, unknown> {
  const schemaValues =
    values.adapterSchemaValues && typeof values.adapterSchemaValues === "object" && !Array.isArray(values.adapterSchemaValues)
      ? (values.adapterSchemaValues as Record<string, unknown>)
      : {};
  const config: Record<string, unknown> = {};

  // Model ID (required)
  if (values.model) {
    config.modelId = String(values.model);
  } else {
    config.modelId = "anthropic.claude-3-5-sonnet-20241022-v2:0";
  }

  // AWS Region - default to us-east-1
  config.awsRegion =
    typeof schemaValues.awsRegion === "string" && schemaValues.awsRegion.trim().length > 0
      ? schemaValues.awsRegion.trim()
      : "us-east-1";

  // Model Parameters
  config.maxTokens =
    typeof schemaValues.maxTokens === "number" && Number.isFinite(schemaValues.maxTokens)
      ? Math.max(1, schemaValues.maxTokens)
      : 4096;
  config.temperature =
    typeof schemaValues.temperature === "number" && Number.isFinite(schemaValues.temperature)
      ? Math.min(1, Math.max(0, schemaValues.temperature))
      : 0.7;

  return config;
}


