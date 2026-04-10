/**
 * Type definitions for Bedrock Adapter
 */

export interface BedrockMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type BedrockComplexity = 'simple' | 'medium' | 'complex';

export interface BedrockInvokeOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  complexity?: BedrockComplexity;
  fallbackModelAliases?: string[];
}

export interface BedrockResponse {
  content: Array<{
    type: 'text' | 'tool_use';
    text?: string;
    id?: string;
    name?: string;
    input?: Record<string, unknown>;
  }>;
  stopReason: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface StreamBedrockResponse {
  type: string;
  index?: number;
  delta?: {
    type: string;
    text?: string;
  };
  message?: BedrockResponse;
  contentBlockStart?: {
    contentBlockIndex: number;
    contentBlock: {
      type: string;
    };
  };
  contentBlockDelta?: {
    contentBlockIndex: number;
    delta: {
      type: string;
      text?: string;
    };
  };
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface AdapterError extends Error {
  code?: string;
  statusCode?: number;
  retryable?: boolean;
}
