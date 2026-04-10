import type { TranscriptEntry } from "@paperclipai/adapter-utils";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function parseBedrockStdoutLine(line: string, ts: string): TranscriptEntry[] {
  const parsed = asRecord(safeJsonParse(line));
  if (!parsed) {
    return [{ kind: "stdout", ts, text: line }];
  }

  // Handle model initialization
  if (parsed.provider === "aws" && typeof parsed.model === "string") {
    return [
      {
        kind: "init",
        ts,
        model: parsed.model,
        sessionId: "",
      },
    ];
  }

  // Handle text responses  
  if (typeof parsed.text === "string" && parsed.text.trim()) {
    return [
      {
        kind: "assistant",
        ts,
        text: parsed.text.trim(),
      },
    ];
  }

  // Handle errors
  if (typeof parsed.errorMessage === "string") {
    return [
      {
        kind: "stdout",
        ts,
        text: `Error: ${parsed.errorMessage}`,
      },
    ];
  }

  // Handle summary
  if (typeof parsed.summary === "string") {
    return [
      {
        kind: "stdout",
        ts,
        text: parsed.summary,
      },
    ];
  }

  // Default: treat as stdout
  return [{ kind: "stdout", ts, text: line }];
}

