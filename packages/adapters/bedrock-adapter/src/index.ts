/**
 * AWS Bedrock Adapter for Paperclip
 * Integrates AWS Bedrock models (Claude, Llama, Command-R) with Paperclip
 */

import { ConverseCommand, ConverseStreamCommand } from '@aws-sdk/client-bedrock-runtime';
import { getBedrockClient } from './client.js';
import { getBedrockConfig, getModelId, resolveAutoRouteModel } from './config.js';
import {
  BedrockComplexity,
  BedrockMessage,
  BedrockInvokeOptions,
  BedrockResponse,
  StreamBedrockResponse,
  AdapterError,
} from './types.js';

export { getBedrockConfig, getModelId } from './config.js';
export type { BedrockMessage, BedrockInvokeOptions, BedrockResponse } from './types.js';

/**
 * Bedrock Adapter Class
 */
export class BedrockAdapter {
  private client = getBedrockClient();
  private config = getBedrockConfig();

  private resolveRequestedModel(modelAlias: string, complexity?: BedrockComplexity): string {
    if (modelAlias !== 'auto') {
      return modelAlias;
    }

    return resolveAutoRouteModel(complexity ?? 'medium');
  }

  private buildCandidateModels(modelAlias: string, options?: BedrockInvokeOptions): string[] {
    const first = this.resolveRequestedModel(modelAlias, options?.complexity);
    const fallbacks = options?.fallbackModelAliases ?? [];
    const unique = new Set<string>([first, ...fallbacks]);
    return Array.from(unique);
  }

  private async runConverse(
    modelId: string,
    messages: BedrockMessage[],
    options?: BedrockInvokeOptions
  ): Promise<BedrockResponse> {
    const temperature = options?.temperature ?? this.config.temperature;
    const maxTokens = options?.maxTokens ?? this.config.maxTokens;

    const command = new ConverseCommand({
      modelId,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: [{ text: msg.content }],
      })),
      inferenceConfig: {
        temperature,
        maxTokens,
        topP: options?.topP,
        stopSequences: options?.stopSequences,
      },
    });

    const response = await this.client.send(command);

    const responseContent = (response.output?.message?.content ?? []) as Array<{
      text?: string;
    }>;
    const normalizedContent = responseContent
      .filter((part) => !!part.text)
      .map((part) => ({ type: 'text' as const, text: part.text }));

    return {
      content: normalizedContent,
      stopReason: response.stopReason || 'end_turn',
      usage: response.usage
        ? {
            inputTokens: response.usage.inputTokens ?? 0,
            outputTokens: response.usage.outputTokens ?? 0,
          }
        : undefined,
    };
  }

  /**
   * Invoke a model with messages (non-streaming)
   */
  async invokeModel(
    modelAlias: string,
    messages: BedrockMessage[],
    options?: BedrockInvokeOptions
  ): Promise<BedrockResponse> {
    const modelCandidates = this.buildCandidateModels(modelAlias, options);
    let lastError: unknown;

    for (const candidate of modelCandidates) {
      const modelId = getModelId(candidate);
      try {
        return await this.runConverse(modelId, messages, options);
      } catch (error) {
        lastError = error;
      }
    }

    throw this.handleError(lastError);
  }

  /**
   * Invoke a model with streaming response
   */
  async *invokeModelStream(
    modelAlias: string,
    messages: BedrockMessage[],
    options?: BedrockInvokeOptions
  ): AsyncGenerator<StreamBedrockResponse> {
    const selectedModel = this.resolveRequestedModel(modelAlias, options?.complexity);
    const modelId = getModelId(selectedModel);
    const temperature = options?.temperature ?? this.config.temperature;
    const maxTokens = options?.maxTokens ?? this.config.maxTokens;

    try {
      const command = new ConverseStreamCommand({
        modelId,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: [{ text: msg.content }],
        })),
        inferenceConfig: {
          temperature,
          maxTokens,
          topP: options?.topP,
          stopSequences: options?.stopSequences,
        },
      });

      const response = await this.client.send(command);

      if (!response.stream) {
        throw new Error('No response stream from Bedrock');
      }

      // Handle the event stream
      for await (const event of response.stream) {
        if (event.contentBlockDelta?.delta?.text) {
          yield {
            type: 'content_block_delta',
            contentBlockDelta: {
              contentBlockIndex: event.contentBlockDelta.contentBlockIndex ?? 0,
              delta: {
                type: 'text_delta',
                text: event.contentBlockDelta.delta.text,
              },
            },
          };
        }

        if (event.metadata?.usage) {
          yield {
            type: 'metadata',
            usage: {
              inputTokens: event.metadata.usage.inputTokens ?? 0,
              outputTokens: event.metadata.usage.outputTokens ?? 0,
            },
          };
        }
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * List available models
   */
  listModels(): Record<string, string> {
    return this.config.models;
  }

  /**
   * Error handling with retryable flag
   */
  private handleError(error: unknown): AdapterError {
    if (error instanceof Error) {
      const adapterError: AdapterError = new Error(error.message);
      adapterError.name = error.name;
      adapterError.code = (error as any).code;
      adapterError.statusCode = (error as any).statusCode;

      // Determine if error is retryable
      const retryableCodes = [
        'ThrottlingException',
        'ServiceUnavailableException',
        'RequestLimitExceeded',
      ];
      adapterError.retryable = retryableCodes.includes(adapterError.code || '');

      return adapterError;
    }

    return new Error('Unknown error occurred with Bedrock');
  }
}

/**
 * Singleton instance
 */
let adapter: BedrockAdapter | null = null;

export function getAdapter(): BedrockAdapter {
  if (!adapter) {
    adapter = new BedrockAdapter();
  }
  return adapter;
}

export default getAdapter();
