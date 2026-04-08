export const type = "ollama_local";
export const label = "Ollama (Local, Zero Cost)";

export const models = [
  { id: "gemma3:12b", label: "Gemma3 12B (Recommended - Most Complete)" },
  { id: "gemma3:4b", label: "Gemma3 4B (Fast, Lower Memory)" },
  { id: "mistral", label: "Mistral 7B" },
  { id: "llama2", label: "Llama2 7B" },
  { id: "neural-chat", label: "Neural Chat 7B" },
  { id: "openchat", label: "OpenChat 3.5" },
];

export const agentConfigurationDoc = `
# ollama_local agent configuration

Adapter: ollama_local

Run open-source LLMs locally with zero API costs using Ollama.

## Core Fields

- **model** (string, optional): Model ID (default: "gemma3:12b")
- **endpoint** (string, optional): Ollama HTTP endpoint (default: "http://localhost:11434")
- **temperature** (number, optional): Temperature 0-1 (default: 0.7)
- **numPredict** (number, optional): Max tokens to generate (default: 2048)
- **topP** (number, optional): Top-p sampling (default: 0.9)
- **topK** (number, optional): Top-k sampling (default: 40)

## Available Models

- **gemma3:12b** (complete) - Recommended, best quality, ~7GB
- **gemma3:4b** (fast) - Lower memory footprint, ~3.5GB
- **mistral** - Balanced performance, ~4GB
- **llama2** - Strong reasoning, ~3.8GB
- **neural-chat** - Conversation optimized, ~4GB

## Setup

Ensure Ollama is running locally:

\`\`\`bash
pnpm ollama:docker:up
pnpm ollama:pull-models
\`\`\`

## Cost

- **Local:** $0/inference
- **Total deployment cost:** $0 (uses existing hardware)

## Performance Notes

- First inference ~30-45s (model load)
- Subsequent calls 1-5s depending on model and prompt
- For production: pre-load models or use smaller variants
`;
