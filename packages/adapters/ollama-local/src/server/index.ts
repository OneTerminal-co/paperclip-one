export { execute } from "./execute.js";
export { testEnvironment } from "./test.js";

import type { AdapterSessionCodec } from "@paperclipai/adapter-utils";

export const sessionCodec: AdapterSessionCodec = {
  deserialize(raw: unknown) {
    // Ollama is stateless, no session management needed
    return null;
  },
  serialize(params: Record<string, unknown> | null) {
    // Ollama is stateless
    return null;
  },
  getDisplayId(params: Record<string, unknown> | null) {
    return "Stateless";
  },
};
