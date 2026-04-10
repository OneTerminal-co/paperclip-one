export function formatBedrockStdoutEvent(raw: string, _debug: boolean): void {
  const line = raw.trim();
  if (!line) return;

  // Parse JSON if possible
  let parsed: Record<string, unknown> | null = null;
  try {
    const json = JSON.parse(line);
    if (typeof json === "object" && json !== null && !Array.isArray(json)) {
      parsed = json as Record<string, unknown>;
    }
  } catch {
    // Not JSON, treat as plain text
  }

  if (!parsed) {
    console.log(line);
    return;
  }

  // Handle model initialization
  if (parsed.provider === "aws" && parsed.model) {
    console.log(`Bedrock initialized (model: ${parsed.model})`);
    return;
  }

  // Handle usage information
  if (parsed.usage) {
    const usage = parsed.usage as Record<string, unknown>;
    const input = Number(usage.inputTokens ?? 0);
    const output = Number(usage.outputTokens ?? 0);
    console.log(`tokens: in=${input} out=${output}`);
    return;
  }

  // Handle errors
  if (parsed.errorMessage) {
    console.log(`error: ${parsed.errorMessage}`);
    return;
  }

  // Handle summary
  if (parsed.summary) {
    console.log(`summary: ${parsed.summary}`);
    return;
  }

  console.log(line);
}


