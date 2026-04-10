import type { CreateConfigValues } from "@paperclipai/adapter-utils";

export function buildBedrockConfig(values: CreateConfigValues): Record<string, unknown> {
  const config: Record<string, unknown> = {};

  // Model ID (required)
  if (values.model) {
    config.modelId = String(values.model);
  } else {
    config.modelId = "anthropic.claude-3-5-sonnet-20241022-v2:0";
  }

  // AWS Region - default to us-east-1
  config.awsRegion = "us-east-1";

  // Model Parameters
  config.maxTokens = 4096;
  config.temperature = 0.7;

  return config;
}


