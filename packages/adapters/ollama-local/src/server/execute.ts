import axios from "axios";
import type {
  AdapterExecutionContext,
  AdapterExecutionResult,
} from "@paperclipai/adapter-utils";
import type { OllamaConfig, OllamaGenerateResponse } from "../types.js";

export async function execute(
  ctx: AdapterExecutionContext
): Promise<AdapterExecutionResult> {
  const config = ctx.config as Partial<OllamaConfig> | undefined;
  const endpoint =
    config?.endpoint || process.env.OLLAMA_ENDPOINT || "http://localhost:11434";
  const model =
    config?.model || process.env.OLLAMA_MODEL || "gemma3:12b";
  const temperature = config?.temperature ?? parseFloat(process.env.OLLAMA_TEMPERATURE || "0.7");
  const numPredict = config?.numPredict ?? 2048;

  const startTime = Date.now();

  try {
    // Extract prompt from agent context
    const prompt = buildPrompt(ctx);

    if (!prompt) {
      return {
        exitCode: 1,
        signal: null,
        timedOut: false,
        errorMessage: "No prompt provided",
      };
    }

    // Log execution start
    await ctx.onLog("stdout", `🚀 Executing with Ollama model: ${model}\n`);
    await ctx.onLog("stdout", `📍 Endpoint: ${endpoint}\n`);

    // Call Ollama generate API
    const response = await axios.post<OllamaGenerateResponse>(
      `${endpoint}/api/generate`,
      {
        model,
        prompt,
        stream: false,
        temperature,
        num_predict: numPredict,
      },
      { timeout: 300000 } // 5 minute timeout
    );

    const result = response.data;
    const responseText = result.response || "";

    // Log response
    await ctx.onLog("stdout", `✅ Response:\n${responseText}\n`);

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    return {
      exitCode: 0,
      signal: null,
      timedOut: false,
      resultJson: {
        response: responseText,
        model,
        generatedTokens: result.eval_count ?? 0,
        durationMs,
      },
      provider: "ollama",
      model,
      billingType: "subscription_included",
      costUsd: 0, // Always zero for local models
    };
  } catch (error) {
    let errorMessage = "Unknown error";
    let timedOut = false;

    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNREFUSED") {
        errorMessage = `Connection refused to Ollama at ${endpoint}. Is it running? Try: pnpm ollama:docker:up`;
      } else if (error.code === "ETIMEDOUT") {
        timedOut = true;
        errorMessage = "Ollama request timeout. Model inference may be slow.";
      } else if (error.response?.status === 404) {
        errorMessage = `Model '${model}' not found. Try: pnpm ollama:pull-models`;
      } else {
        errorMessage = error.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    await ctx.onLog("stderr", `❌ Error: ${errorMessage}\n`);

    return {
      exitCode: 1,
      signal: null,
      timedOut,
      errorMessage,
      provider: "ollama",
      model,
      billingType: "subscription_included",
      costUsd: 0,
    };
  }
}

function buildPrompt(ctx: AdapterExecutionContext): string {
  // Extract task prompt from context
  if (typeof ctx.context?.prompt === "string") {
    return ctx.context.prompt;
  }

  const agent = ctx.agent;
  const instructions = (ctx.config as any)?.instructions || "";
  const task = (ctx.context as any)?.task || "";

  if (instructions && task) {
    return `${instructions}\n\nTask: ${task}`;
  }

  if (task) return task;
  if (instructions) return instructions;

  return "Assist the user with their request.";
}
