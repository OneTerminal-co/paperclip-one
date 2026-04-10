export const type = "bedrock_gateway";
export const label = "AWS Bedrock";

export const models = [
  { id: "anthropic.claude-3-5-sonnet-20241022-v2:0", label: "Claude 3.5 Sonnet" },
  { id: "anthropic.claude-3-5-haiku-20241022-v1:0", label: "Claude 3.5 Haiku" },
  { id: "anthropic.claude-3-opus-20240229-v1:0", label: "Claude 3 Opus" },
  { id: "anthropic.claude-3-sonnet-20240229-v1:0", label: "Claude 3 Sonnet" },
  { id: "anthropic.claude-3-haiku-20240307-v1:0", label: "Claude 3 Haiku" },
  { id: "meta.llama3-1-405b-instruct-v1:0", label: "Llama 3.1 405B" },
  { id: "meta.llama3-1-70b-instruct-v1:0", label: "Llama 3.1 70B" },
  { id: "meta.llama3-1-8b-instruct-v1:0", label: "Llama 3.1 8B" },
  { id: "cohere.command-r-v1:0", label: "Cohere Command R" },
  { id: "cohere.command-r-plus-v1:0", label: "Cohere Command R+" },
];

export const agentConfigurationDoc = `# bedrock_gateway agent configuration

Adapter: bedrock_gateway

Use when:
- You want to run agents using AWS Bedrock API
- You need multi-model support from a single gateway
- You have AWS credentials available in the environment or configured

Core fields:
- modelId (string, required): Bedrock model ID (e.g. anthropic.claude-3-5-sonnet-20241022-v2:0)
- awsRegion (string, optional, default: us-east-1): AWS region for Bedrock
- awsAccessKeyId (string, optional): AWS access key ID (if not using IAM role or environment variables)
- awsSecretAccessKey (string, optional): AWS secret access key (if not using environment variables)
- systemPrompt (string, optional): System prompt for the model
- maxTokens (number, optional, default: 4096): Maximum output tokens
- temperature (number, optional, default: 0.7): Sampling temperature (0-1)
- topP (number, optional, default: 1): Nucleus sampling parameter

Environment Variables (recommended):
- AWS_ACCESS_KEY_ID: AWS access key
- AWS_SECRET_ACCESS_KEY: AWS secret key
- AWS_REGION: AWS region (defaults to us-east-1)

Features:
- Supports streaming inference for real-time output
- Automatic token usage tracking
- Multi-model deployment capability
`;
