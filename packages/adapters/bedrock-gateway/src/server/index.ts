export { execute } from "./execute.js";
export { listBedrockSkills, syncBedrockSkills } from "./skills.js";
export { testEnvironment } from "./test.js";
export { parseBedrockResponse, describeBedrockFailure } from "./parse.js";
import type { AdapterSessionCodec } from "@paperclipai/adapter-utils";

function readNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export const sessionCodec: AdapterSessionCodec = {
  deserialize(raw: unknown) {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
    const record = raw as Record<string, unknown>;
    const conversationId = readNonEmptyString(record.conversationId) ?? readNonEmptyString(record.conversation_id);
    return conversationId ? { conversationId } : null;
  },
  serialize(params: Record<string, unknown> | null) {
    if (!params) return null;
    const conversationId = readNonEmptyString(params.conversationId) ?? readNonEmptyString(params.conversation_id);
    return conversationId ? { conversationId } : null;
  },
  getDisplayId(params: Record<string, unknown> | null) {
    if (!params) return null;
    return readNonEmptyString(params.conversationId) ?? readNonEmptyString(params.conversation_id);
  },
};
