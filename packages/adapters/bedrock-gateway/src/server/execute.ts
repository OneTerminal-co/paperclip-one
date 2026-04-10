import type { AdapterExecutionContext, AdapterExecutionResult } from "@paperclipai/adapter-utils";

interface BedrockConfig {
  modelId?: string;
  awsRegion?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

function extractBedrockConfig(config: Record<string, unknown>): BedrockConfig {
  return {
    modelId: config.modelId ? String(config.modelId) : "anthropic.claude-3-5-sonnet-20241022-v2:0",
    awsRegion: config.awsRegion ? String(config.awsRegion) : "us-east-1",
    systemPrompt: config.systemPrompt ? String(config.systemPrompt) : undefined,
    maxTokens: config.maxTokens ? Number(config.maxTokens) : 4096,
    temperature: config.temperature ? Number(config.temperature) : 0.7,
    topP: config.topP ? Number(config.topP) : 1,
  };
}

export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  try {
    const config = extractBedrockConfig(ctx.config);

    await ctx.onLog("stdout", `\n📡 Initializing AWS Bedrock\n`);
    await ctx.onLog("stdout", `Model: ${config.modelId}\n`);
    await ctx.onLog("stdout", `Region: ${config.awsRegion}\n`);

    // Simulate Bedrock invocation (in production, would use AWS SDK)
    // For now, return a success response
    await ctx.onLog("stdout", "\n✅ Bedrock adapter initialized successfully\n");
    await ctx.onLog("stdout", "(Note: Full AWS SDK integration requires additional setup)\n");

    return {
      exitCode: 0,
      signal: null,
      timedOut: false,
      provider: "aws",
      model: config.modelId,
      summary: `Bedrock ${config.modelId} initialized`,
      usage: {
        inputTokens: 0,
        outputTokens: 0,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await ctx.onLog("stderr", `\nError: ${errorMessage}\n`);

    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      errorMessage: `Bedrock adapter error: ${errorMessage}`,
      summary: "Bedrock adapter error",
    };
  }
}

