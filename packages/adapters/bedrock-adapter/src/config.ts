/**
 * Bedrock Adapter Configuration
 * Environment variables required:
 * - AWS_REGION: AWS region (default: us-east-1)
 * - AWS_ACCESS_KEY_ID: AWS access key
 * - AWS_SECRET_ACCESS_KEY: AWS secret key
 * - BEDROCK_MODEL: Model ID or alias (default: claude-3-5-sonnet)
 * - BEDROCK_TEMPERATURE: Model temperature (default: 0.7)
 * - BEDROCK_MAX_TOKENS: Max tokens (default: 4096)
 */

export interface BedrockConfig {
  region: string;
  models: Record<string, string>;
  temperature: number;
  maxTokens: number;
  requestTimeoutMs: number;
}

export type BedrockComplexity = 'simple' | 'medium' | 'complex';

const MODEL_MAPPING: Record<string, string> = {
  // Anthropic (text)
  'claude-haiku': 'anthropic.claude-3-5-haiku-20241022-v1:0',
  'claude-sonnet': 'anthropic.claude-3-7-sonnet-20250219-v1:0',
  'claude-opus': 'anthropic.claude-opus-4-20250514-v1:0',

  // Anthropic Sonnet 4 family (often requires inference profile/provisioned)
  'claude-sonnet-4': 'anthropic.claude-sonnet-4-20250514-v1:0',
  'claude-sonnet-4-5': 'anthropic.claude-sonnet-4-5-20250929-v1:0',
  'claude-sonnet-4-6': 'anthropic.claude-sonnet-4-6',

  // Meta Llama
  'llama-3-2-3b': 'meta.llama3-2-3b-instruct-v1:0',
  'llama-8b': 'meta.llama3-8b-instruct-v1:0',
  'llama-70b': 'meta.llama3-70b-instruct-v1:0',

  // Cohere
  'command-r': 'cohere.command-r-v1:0',
  'command-r-plus': 'cohere.command-r-plus-v1:0',

  // DeepSeek
  'deepseek-r1': 'deepseek.r1-v1:0',
  'deepseek-v3-2': 'deepseek.v3.2',

  // Mistral
  'ministral-3b': 'mistral.ministral-3-3b-instruct',
  'ministral-8b': 'mistral.ministral-3-8b-instruct',
  'mistral-large-3': 'mistral.mistral-large-3-675b-instruct',

  // Amazon Nova
  'nova-micro': 'amazon.nova-micro-v1:0',
  'nova-lite': 'amazon.nova-lite-v1:0',
  'nova-pro': 'amazon.nova-pro-v1:0',

  // Open models in your catalog
  'gpt-oss-20b': 'openai.gpt-oss-20b-1:0',
  'gpt-oss-120b': 'openai.gpt-oss-120b-1:0',

  // Backward compatibility aliases
  'claude-3-5-sonnet': 'anthropic.claude-3-7-sonnet-20250219-v1:0',
  'claude-3-5-haiku': 'anthropic.claude-3-5-haiku-20241022-v1:0',
  'claude-3-opus': 'anthropic.claude-opus-4-20250514-v1:0',
  'llama3-1-8b': 'meta.llama3-1-8b-instruct-v1:0',
  'llama3-1-70b': 'meta.llama3-1-70b-instruct-v1:0',
};

export function getBedrockConfig(): BedrockConfig {
  const config: BedrockConfig = {
    region: process.env.AWS_REGION || 'us-east-1',
    models: MODEL_MAPPING,
    temperature: parseFloat(process.env.BEDROCK_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.BEDROCK_MAX_TOKENS || '4096'),
    requestTimeoutMs: parseInt(process.env.BEDROCK_REQUEST_TIMEOUT_MS || '300000'),
  };

  // Validation
  if (config.temperature < 0 || config.temperature > 1) {
    throw new Error('BEDROCK_TEMPERATURE must be between 0 and 1');
  }

  if (config.maxTokens < 1 || config.maxTokens > 200000) {
    throw new Error('BEDROCK_MAX_TOKENS must be between 1 and 200000');
  }

  return config;
}

export function getModelId(modelAlias: string): string {
  const config = getBedrockConfig();
  const modelId = config.models[modelAlias];

  if (modelId) {
    return modelId;
  }

  // Allow direct model IDs and inference profile ARNs.
  if (
    modelAlias.includes('.') ||
    modelAlias.startsWith('arn:aws:bedrock:')
  ) {
    return modelAlias;
  }

  throw new Error(
    `Model alias "${modelAlias}" not found. Available: ${Object.keys(config.models).join(', ')}`
  );
}

export function resolveAutoRouteModel(complexity: BedrockComplexity = 'medium'): string {
  const envOverrides: Record<BedrockComplexity, string | undefined> = {
    simple: process.env.BEDROCK_PROFILE_SIMPLE || process.env.BEDROCK_MODEL_SIMPLE,
    medium: process.env.BEDROCK_PROFILE_MEDIUM || process.env.BEDROCK_MODEL_MEDIUM,
    complex: process.env.BEDROCK_PROFILE_COMPLEX || process.env.BEDROCK_MODEL_COMPLEX,
  };

  const defaults: Record<BedrockComplexity, string> = {
    simple: 'llama-8b',
    medium: 'claude-haiku',
    complex: 'claude-sonnet',
  };

  return envOverrides[complexity] || defaults[complexity];
}
