/**
 * AWS Bedrock Client Factory
 * Creates and manages the BedrockRuntime client with proper credential handling
 */

import {
  BedrockRuntime,
  BedrockRuntimeClientConfig,
} from '@aws-sdk/client-bedrock-runtime';
import { fromEnv } from '@aws-sdk/credential-providers';

/**
 * Creates a BedrockRuntime client with credentials from environment variables
 */
export function createBedrockClient(): BedrockRuntime {
  const clientConfig: BedrockRuntimeClientConfig = {
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: fromEnv(),
    requestHandler: {
      requestTimeoutInMs: parseInt(
        process.env.BEDROCK_REQUEST_TIMEOUT_MS || '300000'
      ),
    },
  };

  return new BedrockRuntime(clientConfig);
}

/**
 * Singleton client instance
 */
let bedrockClient: BedrockRuntime | null = null;

export function getBedrockClient(): BedrockRuntime {
  if (!bedrockClient) {
    bedrockClient = createBedrockClient();
  }
  return bedrockClient;
}

/**
 * Reset client (useful for testing)
 */
export function resetBedrockClient(): void {
  bedrockClient = null;
}
