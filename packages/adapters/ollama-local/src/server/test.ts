import axios from "axios";
import type {
  AdapterEnvironmentTestContext,
  AdapterEnvironmentTestResult,
} from "@paperclipai/adapter-utils";
import type { OllamaConfig, OllamaModelsResponse } from "../types.js";

export async function testEnvironment(
  ctx: AdapterEnvironmentTestContext
): Promise<AdapterEnvironmentTestResult> {
  const config = ctx.config as Partial<OllamaConfig> | undefined;
  const endpoint =
    config?.endpoint || process.env.OLLAMA_ENDPOINT || "http://localhost:11434";

  const checks: Array<{
    code: string;
    level: "info" | "warn" | "error";
    message: string;
  }> = [];

  // Check 1: Ollama endpoint reachable
  try {
    const response = await axios.get<OllamaModelsResponse>(
      `${endpoint}/api/tags`,
      { timeout: 5000 }
    );

    if (response.status === 200) {
      checks.push({
        code: "ollama_endpoint",
        level: "info",
        message: `✅ Ollama is reachable at ${endpoint}`,
      });

      // Check 2: Models available
      const models = response.data.models || [];
      if (models.length === 0) {
        checks.push({
          code: "ollama_models",
          level: "warn",
          message: "⚠️ No models found. Run: pnpm ollama:pull-models",
        });
      } else {
        const modelNames = models.map((m) => m.name).join(", ");
        checks.push({
          code: "ollama_models",
          level: "info",
          message: `✅ Available models: ${modelNames}`,
        });
      }
    }
  } catch (error) {
    let message = "❌ Cannot connect to Ollama";
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNREFUSED") {
        message = `❌ Connection refused. Is Ollama running? (${endpoint}) Try: pnpm ollama:docker:up`;
      } else if (error.code === "ETIMEDOUT") {
        message = `❌ Ollama timeout at ${endpoint}`;
      }
    }

    checks.push({
      code: "ollama_endpoint",
      level: "error",
      message,
    });

    checks.push({
      code: "ollama_models",
      level: "error",
      message: "⏭️ Skipped (endpoint unreachable)",
    });
  }

  const hasError = checks.some((c) => c.level === "error");
  const hasWarning = checks.some((c) => c.level === "warn");

  return {
    adapterType: "ollama_local",
    status: hasError ? "fail" : hasWarning ? "warn" : "pass",
    checks,
    testedAt: new Date().toISOString(),
  };
}
