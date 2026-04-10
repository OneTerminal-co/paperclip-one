export function parseBedrockResponse(response: unknown): Record<string, unknown> | null {
  if (typeof response !== "object" || response === null) {
    return null;
  }

  const record = response as Record<string, unknown>;

  return {
    model: record.model,
    provider: "aws",
    stopReason: record.stop_reason,
    usage: {
      inputTokens: record.input_tokens,
      outputTokens: record.output_tokens,
    },
  };
}

export function describeBedrockFailure(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;

    if (message.includes("InvalidUserID")) {
      return "Invalid AWS credentials or user ID";
    }
    if (message.includes("Throttling")) {
      return "Rate limit exceeded. Please try again later.";
    }
    if (message.includes("AccessDenied")) {
      return "Access denied. Check AWS permissions and Bedrock model access.";
    }
    if (message.includes("ModelNotFound")) {
      return "Model not found. Verify the model ID is available in your region.";
    }
    if (message.includes("ServiceQuotaExceeded")) {
      return "Service quota exceeded for Bedrock.";
    }

    return message;
  }

  return String(error);
}
