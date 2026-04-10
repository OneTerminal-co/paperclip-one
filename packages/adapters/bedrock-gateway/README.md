# AWS Bedrock Gateway Adapter

AWS Bedrock adapter for Paperclip control plane. Enables agents to invoke models from AWS Bedrock, including Claude 3.5, Llama 3.1, and Cohere models.

## Installation

Add to your Paperclip installation:

```bash
pnpm install @paperclipai/adapter-bedrock-gateway
```

## Configuration

### Environment Variables

```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1  # Optional, defaults to us-east-1
```

### Agent Configuration

```json
{
  "modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
  "awsRegion": "us-east-1",
  "maxTokens": 4096,
  "temperature": 0.7
}
```

## Supported Models

- **Claude 3.5 Sonnet** - `anthropic.claude-3-5-sonnet-20241022-v2:0`
- **Claude 3.5 Haiku** - `anthropic.claude-3-5-haiku-20241022-v1:0`
- **Claude 3 Opus** - `anthropic.claude-3-opus-20240229-v1:0`
- **Llama 3.1 405B** - `meta.llama3-1-405b-instruct-v1:0`
- **Llama 3.1 70B** - `meta.llama3-1-70b-instruct-v1:0`
- **Llama 3.1 8B** - `meta.llama3-1-8b-instruct-v1:0`
- **Cohere Command R** - `cohere.command-r-v1:0`
- **Cohere Command R+** - `cohere.command-r-plus-v1:0`

## Features

- ✅ Multi-model support
- ✅ Session management with conversation history
- ✅ Configurable parameters (maxTokens, temperature)
- ✅ AWS credential handling via env vars or config
- ✅ Environment health checks
- ✅ Full TypeScript support

## Usage

1. Create an agent with adapter type `bedrock_gateway`
2. Configure AWS credentials in environment
3. Select desired model from dropdown
4. Configure region and parameters
5. Run agent tasks via Paperclip

## Development

### Building

```bash
pnpm build
```

### Testing

```bash
pnpm typecheck
```

## AWS Setup

1. Create AWS account with Bedrock access
2. Enable model access in Bedrock console
3. Create IAM user with Bedrock permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "*"
    }
  ]
}
```

## License

MIT
