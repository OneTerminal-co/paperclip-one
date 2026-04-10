import axios from "axios";
import fs from "node:fs/promises";
import path from "node:path";
import type {
  AdapterExecutionContext,
  AdapterExecutionResult,
} from "@paperclipai/adapter-utils";
import {
  asString,
  joinPromptSections,
  parseObject,
  readPaperclipRuntimeSkillEntries,
  renderTemplate,
  resolvePaperclipDesiredSkillNames,
} from "@paperclipai/adapter-utils/server-utils";
import type { OllamaConfig, OllamaGenerateResponse } from "../types.js";

export async function execute(
  ctx: AdapterExecutionContext
): Promise<AdapterExecutionResult> {
  const config = ctx.config as Partial<OllamaConfig> | undefined;
  const endpoint =
    config?.endpoint || process.env.OLLAMA_ENDPOINT || "http://localhost:11434";
  const model =
    config?.model || process.env.OLLAMA_MODEL || "gemma3:4b";
  const temperature = config?.temperature ?? parseFloat(process.env.OLLAMA_TEMPERATURE || "0.7");
  const numPredict = config?.numPredict ?? 2048;
  const requestTimeoutMs =
    config?.requestTimeoutMs ?? parseInt(process.env.OLLAMA_TIMEOUT_MS || "900000", 10);

  const startTime = Date.now();

  try {
    const prompt = await buildPrompt(ctx);

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

    if (ctx.onMeta) {
      await ctx.onMeta({
        adapterType: "ollama_local",
        command: "ollama-http",
        cwd: process.cwd(),
        commandNotes: ["Using Ollama HTTP API"],
        commandArgs: ["POST", `${endpoint}/api/generate`],
        prompt,
        promptMetrics: { promptChars: prompt.length },
        context: ctx.context,
      });
    }

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
      { timeout: requestTimeoutMs }
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
      summary: responseText,
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
      } else if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
        timedOut = true;
        errorMessage = "Ollama request timeout. Model inference may be slow.";
      } else if (error.response?.status === 404) {
        errorMessage = `Model '${model}' not found. Try: pnpm ollama:pull-models`;
      } else if (typeof error.response?.data === "object" && error.response?.data !== null) {
        const data = error.response.data as Record<string, unknown>;
        const apiError = typeof data.error === "string" ? data.error : null;
        errorMessage = apiError
          ? `Ollama API error (${error.response.status}): ${apiError}`
          : error.message;
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

async function buildPrompt(ctx: AdapterExecutionContext): Promise<string> {
  const config = parseObject(ctx.config);
  const includeSkillMarkdown = parseBooleanLike(config.includeSkillMarkdown) ?? false;
  const maxSkillsPromptChars =
    parseIntegerLike(config.maxSkillsPromptChars) ??
    parseIntegerLike(process.env.OLLAMA_MAX_SKILLS_PROMPT_CHARS) ??
    1200;
  const promptTemplate = asString(
    config.promptTemplate,
    "You are agent {{agent.id}} ({{agent.name}}). Continue your Paperclip work.",
  );
  const bootstrapPromptTemplate = asString(config.bootstrapPromptTemplate, "").trim();

  const workspaceContext = parseObject(ctx.context.paperclipWorkspace);
  const workspaceCwd = asString(workspaceContext.cwd, "").trim();
  const configuredCwd = asString(config.cwd, "").trim();
  const cwd = workspaceCwd || configuredCwd || process.cwd();

  const instructionsFilePath = asString(config.instructionsFilePath, "").trim();
  let instructionsPrefix = "";
  if (instructionsFilePath.length > 0) {
    const resolvedPath = path.resolve(cwd, instructionsFilePath);
    try {
      const instructionsContents = await fs.readFile(resolvedPath, "utf8");
      const instructionsDir = `${path.dirname(resolvedPath)}/`;
      instructionsPrefix =
        `${instructionsContents}\n\n` +
        `The above agent instructions were loaded from ${resolvedPath}. ` +
        `Resolve any relative file references from ${instructionsDir}.\n\n`;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      await ctx.onLog(
        "stdout",
        `[paperclip] Warning: could not read agent instructions file \"${resolvedPath}\": ${reason}\n`,
      );
    }
  }

  let skillsPromptSection = "";
  const availableSkills = await readPaperclipRuntimeSkillEntries(config, import.meta.dirname);
  const desiredSkills = resolvePaperclipDesiredSkillNames(config, availableSkills);
  if (desiredSkills.length > 0) {
    if (includeSkillMarkdown) {
      const desiredSet = new Set(desiredSkills);
      const skillBlocks: string[] = [];
      let skillsChars = 0;
      for (const skill of availableSkills) {
        if (!desiredSet.has(skill.key)) continue;
        try {
          const markdown = await fs.readFile(path.join(skill.source, "SKILL.md"), "utf8");
          if (maxSkillsPromptChars <= 0) continue;
          const block = `## Skill: ${skill.runtimeName}\n${markdown}`;
          if (skillsChars + block.length > maxSkillsPromptChars) break;
          skillBlocks.push(block);
          skillsChars += block.length;
        } catch {
          await ctx.onLog(
            "stdout",
            `[paperclip] Warning: could not load skill markdown for ${skill.key}\n`,
          );
        }
      }
      if (skillBlocks.length > 0) {
        skillsPromptSection =
          "The following skills are configured for this run. Use them as internal operating instructions.\n" +
          "Do NOT summarize, review, or critique these skills in your response.\n" +
          "Apply them only when relevant to the current task.\n\n" +
          skillBlocks.join("\n\n---\n\n") +
          "\n\n";
      }
    } else {
      skillsPromptSection =
        "Configured skills (names only): " +
        desiredSkills.join(", ") +
        "\nUse them only as silent internal guidance. Never review or summarize them.\n\n";
    }
  }

  const wakeReason = asString(ctx.context.wakeReason, "").trim();
  const taskId = asString(ctx.context.taskId, "").trim();
  const issueId = asString(ctx.context.issueId, "").trim();
  const taskTitle =
    asString((ctx.context as Record<string, unknown>).taskTitle, "").trim() ||
    asString((ctx.context as Record<string, unknown>).issueTitle, "").trim();
  const taskDescription =
    asString((ctx.context as Record<string, unknown>).taskDescription, "").trim() ||
    asString((ctx.context as Record<string, unknown>).issueDescription, "").trim();
  const hasAssignedTask = taskId.length > 0 || issueId.length > 0 || taskTitle.length > 0;

  const normalizedTaskDescription =
    taskDescription.length > 1200 ? `${taskDescription.slice(0, 1200)}...` : taskDescription;

  const executionContextSection = joinPromptSections([
    "Execution context:",
    wakeReason ? `- wakeReason: ${wakeReason}` : "",
    taskId ? `- taskId: ${taskId}` : "",
    issueId ? `- issueId: ${issueId}` : "",
    taskTitle ? `- taskTitle: ${taskTitle}` : "",
    normalizedTaskDescription ? `- taskDescription: ${normalizedTaskDescription}` : "",
  ]).trim();

  const noTaskDirective = !hasAssignedTask
    ? "No concrete task is assigned in this run. Ask for a specific task in 1-2 concise sentences and stop."
    : "";
  const taskResponseDirective = hasAssignedTask
    ? [
        "Response format requirements:",
        "- Write in Spanish.",
        "- Be concise and task-focused.",
        "- Do not review documentation, skills, or memory systems.",
        "- Do not ask follow-up questions.",
        "- Do not claim that you executed actions unless they actually happened in this run.",
        "- If no real action was executed, set 'Accion' to a concrete analysis/planning action.",
        "- Use exactly these headings: 'Accion', 'Resultado', 'Siguiente paso'.",
      ].join("\n")
    : "";

  const templateData = {
    agentId: ctx.agent.id,
    companyId: ctx.agent.companyId,
    runId: ctx.runId,
    company: { id: ctx.agent.companyId },
    agent: ctx.agent,
    run: { id: ctx.runId, source: "on_demand" },
    context: ctx.context,
  };

  const renderedHeartbeatPrompt = renderTemplate(promptTemplate, templateData).trim();
  const renderedBootstrapPrompt =
    !ctx.runtime.sessionId && bootstrapPromptTemplate.length > 0
      ? renderTemplate(bootstrapPromptTemplate, templateData).trim()
      : "";
  const sessionHandoffNote = asString(ctx.context.paperclipSessionHandoffMarkdown, "").trim();

  const prompt = joinPromptSections([
    instructionsPrefix,
    skillsPromptSection,
    executionContextSection,
    renderedBootstrapPrompt,
    sessionHandoffNote,
    renderedHeartbeatPrompt,
    taskResponseDirective,
    noTaskDirective,
  ]).trim();

  if (prompt.length > 0) return prompt;
  if (typeof ctx.context.prompt === "string" && ctx.context.prompt.trim().length > 0) {
    return ctx.context.prompt.trim();
  }

  return "Continue your Paperclip work for the assigned task.";
}

function parseIntegerLike(input: unknown): number | null {
  if (typeof input === "number" && Number.isFinite(input)) {
    return Math.trunc(input);
  }
  if (typeof input !== "string" || input.trim().length === 0) {
    return null;
  }
  const parsed = Number.parseInt(input, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBooleanLike(input: unknown): boolean | null {
  if (typeof input === "boolean") return input;
  if (typeof input !== "string") return null;
  const normalized = input.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return null;
}
