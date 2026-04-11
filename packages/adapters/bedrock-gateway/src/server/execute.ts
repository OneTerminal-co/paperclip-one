import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ConverseCommandInput,
} from "@aws-sdk/client-bedrock-runtime";
import type { AdapterExecutionContext, AdapterExecutionResult } from "@paperclipai/adapter-utils";
import {
  asString,
  joinPromptSections,
  renderPaperclipWakePrompt,
  stringifyPaperclipWakePayload,
} from "@paperclipai/adapter-utils/server-utils";
import { describeBedrockFailure } from "./parse.js";

interface BedrockConfig {
  modelId?: string;
  awsRegion?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsSessionToken?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  /** Price per 1 million input tokens in USD (default: 3.00 for claude-3-5-sonnet) */
  inputPricePer1MTokens?: number;
  /** Price per 1 million output tokens in USD (default: 15.00 for claude-3-5-sonnet) */
  outputPricePer1MTokens?: number;
  /** Maximum agentic turns before stopping (default: 15) */
  maxAgenticTurns?: number;
}

function readEnv(name: string): string | undefined {
  const candidate = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  const value = candidate?.env?.[name];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function extractBedrockConfig(config: Record<string, unknown>): BedrockConfig {
  return {
    modelId:
      (typeof config.modelId === "string" && config.modelId.trim().length > 0
        ? String(config.modelId)
        : readEnv("BEDROCK_MODEL")) || "anthropic.claude-3-5-sonnet-20241022-v2:0",
    awsRegion:
      (typeof config.awsRegion === "string" && config.awsRegion.trim().length > 0
        ? String(config.awsRegion)
        : readEnv("AWS_REGION")) || "us-east-1",
    awsAccessKeyId:
      (typeof config.awsAccessKeyId === "string" && config.awsAccessKeyId.trim().length > 0
        ? String(config.awsAccessKeyId)
        : readEnv("AWS_ACCESS_KEY_ID")) || undefined,
    awsSecretAccessKey:
      (typeof config.awsSecretAccessKey === "string" && config.awsSecretAccessKey.trim().length > 0
        ? String(config.awsSecretAccessKey)
        : readEnv("AWS_SECRET_ACCESS_KEY")) || undefined,
    awsSessionToken:
      (typeof config.awsSessionToken === "string" && config.awsSessionToken.trim().length > 0
        ? String(config.awsSessionToken)
        : readEnv("AWS_SESSION_TOKEN")) || undefined,
    systemPrompt: config.systemPrompt ? String(config.systemPrompt) : undefined,
    maxTokens: config.maxTokens ? Number(config.maxTokens) : 2048,
    temperature: config.temperature ? Number(config.temperature) : 0.7,
    topP: config.topP ? Number(config.topP) : 1,
    inputPricePer1MTokens:
      config.inputPricePer1MTokens != null ? Number(config.inputPricePer1MTokens) : undefined,
    outputPricePer1MTokens:
      config.outputPricePer1MTokens != null ? Number(config.outputPricePer1MTokens) : undefined,
    maxAgenticTurns:
      config.maxAgenticTurns != null ? Number(config.maxAgenticTurns) : 15,
  };
}

/**
 * Estimate cost in USD from token usage.
 * Uses configured prices; falls back to Claude 3.5 Sonnet pricing as safe default.
 */
function estimateCostUsd(
  inputTokens: number,
  outputTokens: number,
  cachedInputTokens: number,
  config: BedrockConfig,
): number {
  const inputPrice = config.inputPricePer1MTokens ?? resolveDefaultInputPrice(config.modelId);
  const outputPrice = config.outputPricePer1MTokens ?? resolveDefaultOutputPrice(config.modelId);
  // Cached reads are typically 10% of the base input price
  const cachedPrice = inputPrice * 0.1;
  const cost =
    (inputTokens / 1_000_000) * inputPrice +
    (outputTokens / 1_000_000) * outputPrice +
    (cachedInputTokens / 1_000_000) * cachedPrice;
  return Math.round(cost * 1_000_000) / 1_000_000; // round to 6 decimal places
}

function resolveDefaultInputPrice(modelId: string | undefined): number {
  const id = (modelId ?? "").toLowerCase();
  if (id.includes("claude-3-5-sonnet") || id.includes("claude-3-7")) return 3.0;
  if (id.includes("claude-3-5-haiku")) return 0.8;
  if (id.includes("claude-3-opus")) return 15.0;
  if (id.includes("claude-3-sonnet")) return 3.0;
  if (id.includes("claude-3-haiku")) return 0.25;
  if (id.includes("claude-2")) return 8.0;
  // Default to claude-3-5-sonnet pricing for inference profiles
  return 3.0;
}

function resolveDefaultOutputPrice(modelId: string | undefined): number {
  const id = (modelId ?? "").toLowerCase();
  if (id.includes("claude-3-5-sonnet") || id.includes("claude-3-7")) return 15.0;
  if (id.includes("claude-3-5-haiku")) return 4.0;
  if (id.includes("claude-3-opus")) return 75.0;
  if (id.includes("claude-3-sonnet")) return 15.0;
  if (id.includes("claude-3-haiku")) return 1.25;
  if (id.includes("claude-2")) return 24.0;
  // Default to claude-3-5-sonnet pricing for inference profiles
  return 15.0;
}

// ---------------------------------------------------------------------------
// Agentic loop: tool use via Bedrock Converse API
// ---------------------------------------------------------------------------

/**
 * Defines the http_request tool for the Bedrock Converse toolConfig.
 * The agent can call any Paperclip /api/* endpoint using this tool.
 * Auth headers are injected automatically — the model does NOT pass Bearer tokens.
 */
function buildPaperclipToolConfig(): Record<string, unknown> {
  return {
    tools: [
      {
        toolSpec: {
          name: "http_request",
          description:
            "Make an HTTP request to the Paperclip control plane API. " +
            "Use this to interact with Paperclip: get your assignments, checkout issues, " +
            "post comments, create agents, update task status, fetch issue context, etc. " +
            "Auth is injected automatically — do NOT add Authorization headers in `body`. " +
            "Only /api/* paths are allowed.",
          inputSchema: {
            json: {
              type: "object",
              properties: {
                method: {
                  type: "string",
                  enum: ["GET", "POST", "PATCH", "PUT", "DELETE"],
                  description: "HTTP method",
                },
                path: {
                  type: "string",
                  description:
                    "API path starting with /api, e.g. /api/agents/me or /api/issues/abc/comments",
                },
                body: {
                  type: "object",
                  description: "Request body for POST/PATCH/PUT requests",
                },
              },
              required: ["method", "path"],
            },
          },
        },
      },
    ],
  };
}

/**
 * Execute an http_request tool call and return the response as a JSON string.
 * Scoped to the Paperclip API base URL to prevent SSRF.
 */
async function executeHttpRequest(
  input: Record<string, unknown>,
  apiBase: string,
  authHeaders: Record<string, string>,
  ctx: AdapterExecutionContext,
): Promise<string> {
  const method = asString(input.method, "GET").toUpperCase();
  const path = asString(input.path, "");
  const bodyData =
    input.body && typeof input.body === "object" ? (input.body as Record<string, unknown>) : undefined;

  if (!path.startsWith("/api")) {
    return JSON.stringify({ error: "Only /api paths are allowed" });
  }

  const url = `${apiBase.replace(/\/$/, "")}${path}`;
  await ctx.onLog("stdout", `[tool] ${method} ${path}\n`);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        ...authHeaders,
        ...(bodyData ? { "content-type": "application/json" } : {}),
      },
      ...(bodyData ? { body: JSON.stringify(bodyData) } : {}),
    });

    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }

    if (!response.ok) {
      await ctx.onLog("stderr", `[tool] → ${response.status} ${path}\n`);
      return JSON.stringify({ error: `HTTP ${response.status}`, body: parsed });
    }

    await ctx.onLog("stdout", `[tool] → ${response.status} ${path}\n`);
    return typeof parsed === "string" ? parsed : JSON.stringify(parsed);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await ctx.onLog("stderr", `[tool] → error ${path}: ${msg}\n`);
    return JSON.stringify({ error: msg });
  }
}

type ConversationMessage = {
  role: "user" | "assistant";
  content: Array<Record<string, unknown>>;
};

type AgenticLoopResult = {
  text: string;
  usage: { inputTokens: number; outputTokens: number; cachedInputTokens: number };
  stopReason: string;
  postedCommentViaTool: boolean;
  turns: number;
};

/**
 * Run an agentic loop: send messages to Bedrock, handle tool_use responses,
 * execute tool calls against the Paperclip API, and repeat until done.
 */
async function runAgenticLoop(
  client: BedrockRuntimeClient,
  systemPrompt: string | undefined,
  prompt: string,
  config: BedrockConfig,
  ctx: AdapterExecutionContext,
  apiBase: string,
  authHeaders: Record<string, string>,
): Promise<AgenticLoopResult> {
  const maxTurns = config.maxAgenticTurns ?? 15;
  const toolConfig = buildPaperclipToolConfig();

  const messages: ConversationMessage[] = [
    { role: "user", content: [{ text: prompt }] },
  ];

  const totalUsage = { inputTokens: 0, outputTokens: 0, cachedInputTokens: 0 };
  let finalText = "";
  let lastStopReason = "end_turn";
  let postedCommentViaTool = false;
  let turn = 0;

  while (turn < maxTurns) {
    const input: ConverseCommandInput = {
      modelId: config.modelId,
      messages: messages as unknown as ConverseCommandInput["messages"],
      inferenceConfig: {
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        // topP: config.topP, // Removed: inference profiles don't support both temperature and topP
      },
      toolConfig: toolConfig as unknown as ConverseCommandInput["toolConfig"],
      ...(systemPrompt ? { system: [{ text: systemPrompt }] } : {}),
    };

    const rawResponse = await client.send(new ConverseCommand(input));
    const response = rawResponse as unknown as {
      output?: { message?: { content?: Array<Record<string, unknown>> } };
      usage?: { inputTokens?: number; outputTokens?: number; cacheReadInputTokens?: number };
      stopReason?: string;
    };

    // Accumulate usage
    totalUsage.inputTokens += response.usage?.inputTokens ?? 0;
    totalUsage.outputTokens += response.usage?.outputTokens ?? 0;
    totalUsage.cachedInputTokens += response.usage?.cacheReadInputTokens ?? 0;

    const assistantContent = (response.output?.message?.content ?? []) as Array<Record<string, unknown>>;
    messages.push({ role: "assistant", content: assistantContent });

    lastStopReason = response.stopReason ?? "end_turn";

    // Collect text from this response
    const textParts = assistantContent
      .filter((b) => typeof b.text === "string")
      .map((b) => b.text as string);
    if (textParts.length > 0) {
      finalText = textParts.join("\n").trim();
    }

    if (lastStopReason !== "tool_use") break;

    // Handle tool use blocks
    const toolUseBlocks = assistantContent.filter((b) => b.toolUse != null);
    if (toolUseBlocks.length === 0) break;

    const toolResults: Array<Record<string, unknown>> = [];

    for (const block of toolUseBlocks) {
      const toolUse = block.toolUse as Record<string, unknown>;
      const toolUseId = asString(toolUse.toolUseId, "");
      const toolName = asString(toolUse.name, "");
      const toolInput = (toolUse.input ?? {}) as Record<string, unknown>;

      let resultText: string;
      if (toolName === "http_request") {
        resultText = await executeHttpRequest(toolInput, apiBase, authHeaders, ctx);
        // Track if agent posted a comment via tool
        const callPath = asString(toolInput.path, "");
        const callMethod = asString(toolInput.method, "GET").toUpperCase();
        if (callMethod === "POST" && callPath.includes("/comments")) {
          postedCommentViaTool = true;
        }
      } else {
        resultText = JSON.stringify({ error: `Unknown tool: ${toolName}` });
      }

      toolResults.push({
        toolResult: {
          toolUseId,
          content: [{ text: resultText }],
          status: "success",
        },
      });
    }

    messages.push({ role: "user", content: toolResults });
    turn++;
  }

  if (turn >= maxTurns) {
    await ctx.onLog("stderr", `[agentic] Reached max turns (${maxTurns})\n`);
  }

  return { text: finalText, usage: totalUsage, stopReason: lastStopReason, postedCommentViaTool, turns: turn };
}

/**
 * Build the system prompt that gives the agent its identity and Paperclip context.
 * This is prepended to (or replaces) the user-configured system prompt.
 */
function buildAgentSystemPrompt(
  ctx: AdapterExecutionContext,
  apiBase: string,
  userSystemPrompt: string | undefined,
): string {
  const context = ctx.context as Record<string, unknown>;
  const agentId = asString(context.agentId, "").trim() || ctx.agent?.id || "";
  const companyId = asString(context.companyId, "").trim() || "";

  const identity = joinPromptSections([
    "# Paperclip Agent Runtime Context",
    "",
    "You are a Paperclip agent running in a heartbeat. You have access to the `http_request` tool to interact with the Paperclip control plane API.",
    "",
    "## Your Identity",
    agentId ? `- Agent ID: ${agentId}` : "",
    companyId ? `- Company ID: ${companyId}` : "",
    ctx.runId ? `- Run ID: ${ctx.runId}` : "",
    `- API Base URL: ${apiBase}`,
    "",
    "## Tool Usage Rules",
    "- Use `http_request` to call any `/api/*` endpoint.",
    "- Auth is injected automatically — do NOT add Authorization headers.",
    "- Always include `X-Paperclip-Run-Id` header for mutating requests by adding it to the tool body — it is already injected automatically.",
    "- For mutating requests (POST/PATCH/PUT) the run ID header is added automatically.",
    "",
    "## Common API Endpoints",
    "- GET /api/agents/me — Get your agent identity",
    "- GET /api/agents/me/inbox-lite — Get your assigned issues",
    "- POST /api/issues/{issueId}/checkout — Checkout an issue before working on it",
    "- GET /api/issues/{issueId}/heartbeat-context — Get full issue context",
    "- GET /api/issues/{issueId}/comments — List issue comments",
    "- POST /api/issues/{issueId}/comments — Post a comment (body: { \"body\": \"...\" })",
    "- PATCH /api/issues/{issueId} — Update issue (body: { \"status\": \"done\" })",
    "- POST /api/companies/{companyId}/agents — Create a new agent (requires companyId)",
    "- POST /api/companies/{companyId}/approvals — Create an approval request",
    "",
    "## Heartbeat Workflow",
    "1. Call GET /api/agents/me to confirm identity if needed.",
    "2. Call GET /api/agents/me/inbox-lite to get your assignments.",
    "3. For the assigned issue, call POST /api/issues/{issueId}/checkout first.",
    "4. Read context: GET /api/issues/{issueId}/heartbeat-context",
    "5. Do the work requested in the issue.",
    "6. Post your result as a comment: POST /api/issues/{issueId}/comments with { \"body\": \"...\" }",
    "7. Update issue status: PATCH /api/issues/{issueId} with { \"status\": \"done\" } when complete.",
    "",
    "## Creating Agents (Hiring)",
    "",
    "### Direct Creation (if you have Board permissions)",
    "POST /api/companies/{companyId}/agents",
    "- If you get 403 Forbidden, you need to create an approval request instead (see below).",
    "",
    "### Approval Request (when you get 403 Forbidden)",
    "If direct creation fails with 403, create an approval request:",
    "POST /api/companies/{companyId}/approvals",
    "```json",
    "{",
    "  \"type\": \"hire_agent\",",
    "  \"requestedByAgentId\": \"<your-agent-id>\",  // Optional, from GET /api/agents/me",
    "  \"payload\": {",
    "    // PUT THE ENTIRE AGENT CONFIGURATION HERE",
    "    \"name\": \"Agente de Marketing Digital\",",
    "    \"role\": \"cmo\",",
    "    \"title\": \"Chief Marketing Officer\",",
    "    \"capabilities\": \"Expert in...\",",
    "    \"reportsTo\": \"<ceo-id>\",",
    "    \"icon\": \"target\",",
    "    \"adapterType\": \"bedrock_gateway\",",
    "    \"adapterConfig\": { \"modelId\": \"...\", \"awsRegion\": \"us-east-1\", \"maxTokens\": 4096, \"temperature\": 0.7 },",
    "    \"budgetMonthlyCents\": 5000",
    "  },",
    "  \"issueIds\": [\"<current-issue-id>\"]  // Link to the issue that requested this agent",
    "}",
    "```",
    "",
    "### IMPORTANT: Agent Creation Best Practices",
    "When creating an agent, you MUST provide:",
    "1. **Descriptive name** - NOT 'new agent' or 'agent'. Use the actual role/function (e.g., 'Agente de Marketing Digital', 'Ingeniero de DevOps')",
    "2. **Specific role** - Choose from: ceo, cto, cmo, cfo, engineer, designer, pm, qa, devops, researcher, general",
    "3. **Clear title** - Professional title that describes their function (e.g., 'Especialista en Growth Marketing', 'Arquitecto de Soluciones Cloud')",
    "4. **Detailed capabilities** - Explain WHAT they can do and their expertise areas (2-4 sentences minimum)",
    "5. **Organizational context** - Use 'reportsTo' field with the CEO agent ID to establish hierarchy",
    "6. **Appropriate icon** - Choose from: brain, rocket, target, lightbulb, sparkles, chart-line, megaphone, code, database, shield, etc.",
    "7. **Budget** - Set budgetMonthlyCents (e.g., 5000 = $50.00)",
    "",
    "### Complete Agent Creation Example",
    "```json",
    "{",
    "  \"name\": \"Agente de Estrategia Comercial\",",
    "  \"role\": \"cmo\",",
    "  \"title\": \"Chief Marketing Officer - Especialista en Growth B2B\",",
    "  \"icon\": \"target\",",
    "  \"reportsTo\": \"<CEO_AGENT_ID>\",  // CRITICAL: Get this from GET /api/agents/me if you are the CEO",
    "  \"capabilities\": \"Experto en estrategia comercial B2B para empresas enterprise. Diseña playbooks de ventas, analiza mercados verticales por sector, planifica cuentas objetivo con ICP detallado, define estrategias de crecimiento con KPIs medibles, y propone alianzas estratégicas. Especializado en sectores: retail, salud, banca, tecnología.\",",
    "  \"desiredSkills\": [\"market-analysis\", \"sales-strategy\", \"account-planning\", \"competitive-intelligence\"],",
    "  \"adapterType\": \"bedrock_gateway\",",
    "  \"adapterConfig\": {",
    "    \"modelId\": \"arn:aws:bedrock:us-east-1:545642978142:application-inference-profile/jp3upemwe214\",",
    "    \"awsRegion\": \"us-east-1\",",
    "    \"maxTokens\": 4096,",
    "    \"temperature\": 0.7",
    "  },",
    "  \"budgetMonthlyCents\": 5000,",
    "  \"metadata\": {",
    "    \"department\": \"Marketing\",",
    "    \"expertise\": [\"B2B\", \"Enterprise\", \"Growth\"],",
    "    \"createdBy\": \"CEO via issue assignment\"",
    "  }",
    "}",
    "```",
    "",
    "### Role-Specific Guidelines",
    "- **CMO**: Marketing strategy, growth, campaigns, brand",
    "- **CTO**: Technical architecture, engineering leadership, infrastructure",
    "- **CFO**: Financial planning, budget management, cost optimization",
    "- **Engineer**: Code development, implementation, technical solutions",
    "- **Designer**: UI/UX, visual design, user experience",
    "- **PM**: Product management, roadmap, stakeholder coordination",
    "- **DevOps**: Infrastructure, CI/CD, deployment automation",
    "- **QA**: Testing, quality assurance, validation",
    "- **Researcher**: Market research, competitive analysis, data insights",
    "",
    "### NEVER DO THIS (Bad Examples)",
    "❌ { \"name\": \"new agent\" } - Too generic",
    "❌ { \"name\": \"Agent\" } - Not descriptive",
    "❌ { \"capabilities\": \"General tasks\" } - Too vague",
    "❌ Missing 'reportsTo' field - Breaks organizational structure",
    "❌ { \"role\": \"general\" } when a specific role exists - Lazy categorization",
    "",
    "## Important",
    "- Always use the correct Company ID in URLs for company-scoped endpoints.",
    "- **Agent Creation Flow**: Try POST /api/companies/{companyId}/agents first. If you get 403, immediately create an approval request.",
    "- **Approval Payloads**: The 'payload' field in approvals must contain the COMPLETE agent configuration (all fields).",
    "- Always complete the full workflow — do not just generate text without calling the API.",
    "- After creating an approval, post a comment explaining that Board needs to review and approve the hire request.",
    "- Write comments and responses in Spanish.",
    "- Be concrete and action-oriented.",
  ]).trim();

  if (userSystemPrompt && userSystemPrompt.trim().length > 0) {
    return `${identity}\n\n---\n\n${userSystemPrompt.trim()}`;
  }

  return identity;
}

// ---------------------------------------------------------------------------

function resolvePrompt(ctx: AdapterExecutionContext): string {
  const context = ctx.context as Record<string, unknown>;
  const wakeReason = asString(context.wakeReason, "").trim();
  const wakeReasonLower = wakeReason.toLowerCase();
  const taskId = asString(context.taskId, "").trim();
  const issueId = asString(context.issueId, "").trim();
  const taskTitle =
    asString((context as Record<string, unknown>).taskTitle, "").trim() ||
    asString((context as Record<string, unknown>).issueTitle, "").trim();
  const taskDescription =
    asString((context as Record<string, unknown>).taskDescription, "").trim() ||
    asString((context as Record<string, unknown>).issueDescription, "").trim();

  const rawPrompt =
    asString(context.prompt, "").trim() ||
    asString(context.userPrompt, "").trim() ||
    asString((context as Record<string, unknown>).instruction, "").trim();

  const wakePrompt = renderPaperclipWakePrompt(context.paperclipWake, {
    resumedSession: Boolean(ctx.runtime.sessionDisplayId),
  }).trim();
  const wakePayloadJson = stringifyPaperclipWakePayload(context.paperclipWake);

  const executionContextSection = joinPromptSections([
    "Execution context:",
    wakeReason ? `- wakeReason: ${wakeReason}` : "",
    taskId ? `- taskId: ${taskId}` : "",
    issueId ? `- issueId: ${issueId}` : "",
    taskTitle ? `- taskTitle: ${taskTitle}` : "",
    taskDescription ? `- taskDescription: ${taskDescription.slice(0, 1200)}` : "",
  ]).trim();

  const assignmentObjectiveSection =
    wakeReasonLower === "issue_assigned"
      ? joinPromptSections([
          "Primary objective:",
          taskTitle ? `- Solve this issue: ${taskTitle}` : "- Solve the assigned issue.",
          taskDescription ? `- Requested details: ${taskDescription.slice(0, 2000)}` : "",
          "- Provide a concrete draft directly usable by the team, not a generic summary.",
          "- Preserve any requested counts and structure (for example: number of outbound steps or KPIs).",
          "- Include explicit content for each requested deliverable from the issue description.",
          "- Do NOT talk about payload fields, latestCommentId, wake metadata, or internal automation state.",
        ]).trim()
      : "";

  const includeDiagnosticPromptData = wakeReasonLower !== "issue_assigned";

  return (
    joinPromptSections([
      includeDiagnosticPromptData ? rawPrompt : "",
      includeDiagnosticPromptData ? wakePrompt : "",
      includeDiagnosticPromptData && wakePayloadJson
        ? `Paperclip wake payload (JSON):\n${wakePayloadJson}`
        : "",
      executionContextSection,
      assignmentObjectiveSection,
      "Response format:",
      "- Write in Spanish.",
      "- Sound natural, direct, and helpful (avoid robotic templates).",
      "- Be concise and action-oriented.",
      "- Prefer short paragraphs and concrete bullets when useful.",
      "- Never mention internal ids, payload keys, or system metadata.",
      "- If the user asks a follow-up, answer that follow-up explicitly before proposing next steps.",
      "- Do not narrate your internal process (avoid lines like 'voy a revisar', 'voy a leer', 'mi proximo paso es').",
    ]).trim() ||
    "Responde en espanol de forma natural, concreta y accionable."
  );
}

function buildBedrockClient(config: BedrockConfig): BedrockRuntimeClient {
  if (config.awsAccessKeyId && config.awsSecretAccessKey) {
    return new BedrockRuntimeClient({
      region: config.awsRegion,
      credentials: {
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsSecretAccessKey,
        ...(config.awsSessionToken ? { sessionToken: config.awsSessionToken } : {}),
      },
    });
  }

  return new BedrockRuntimeClient({ region: config.awsRegion });
}

function extractTextFromConverseOutput(output: unknown): string {
  if (!output || typeof output !== "object") return "";
  const record = output as Record<string, unknown>;
  const message =
    typeof record.message === "object" && record.message !== null
      ? (record.message as Record<string, unknown>)
      : null;
  const content = Array.isArray(message?.content) ? message?.content : [];
  const textParts = content
    .map((part) => (part && typeof part === "object" ? (part as Record<string, unknown>).text : null))
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  return textParts.join("\n").trim();
}

function includesAllRequestedKeywords(description: string, text: string): boolean {
  const normalizedDescription = description.toLowerCase();
  const normalizedText = text.toLowerCase();

  const requiredByDescription: string[] = [];
  if (normalizedDescription.includes("icp")) requiredByDescription.push("icp");
  if (normalizedDescription.includes("segment")) requiredByDescription.push("segment");
  if (normalizedDescription.includes("outbound")) requiredByDescription.push("outbound");
  if (normalizedDescription.includes("kpi")) requiredByDescription.push("kpi");

  return requiredByDescription.every((token) => normalizedText.includes(token));
}

function containsPseudoToolScript(text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    normalized.includes("http_request to call")
    || normalized.includes("**http_request**")
    || normalized.includes("```http_request")
    || normalized.includes("\"method\": \"get\"")
    || normalized.includes("\"method\": \"post\"")
    || normalized.includes("\"method\": \"patch\"")
    || normalized.includes("method: get")
    || normalized.includes("method: post")
    || normalized.includes("method: patch")
    || normalized.includes("path: /api/issues/")
    || normalized.includes("/api/issues/{issueid}")
    || normalized.includes("response:\n```json")
  );
}

function containsMetaPlanningOnlyText(text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    normalized.includes("revisar el comentario reciente")
    || normalized.includes("necesito determinar")
    || normalized.includes("realizar una solicitud get")
    || normalized.includes("obtener mas contexto")
    || normalized.includes("obtener m\u00e1s contexto")
    || normalized.includes("para determinar las proximas acciones")
    || normalized.includes("para determinar las pr\u00f3ximas acciones")
    || normalized.includes("voy a leer el comentario")
    || normalized.includes("voy a revisar el comentario")
    || normalized.includes("mi proximo paso")
    || normalized.includes("mi pr\u00f3ximo paso")
    || normalized.includes("primero, voy a")
  );
}

function isHireAgentIntent(title: string, description: string): boolean {
  const haystack = `${title}\n${description}`.toLowerCase();
  return (
    haystack.includes("create a new agent")
    || haystack.includes("crear agente")
    || haystack.includes("crea agente")
    || haystack.includes("hire agent")
    || haystack.includes("contrata")
    || haystack.includes("contratar")
  );
}

async function ensureHireApprovalForIssue(
  ctx: AdapterExecutionContext,
  config: BedrockConfig,
): Promise<{ created: boolean; approvalId: string | null; approvalStatus: string | null }> {
  const context = ctx.context as Record<string, unknown>;
  const paperclipWake =
    typeof context.paperclipWake === "object" && context.paperclipWake !== null
      ? (context.paperclipWake as Record<string, unknown>)
      : null;
  const wakeIssue =
    paperclipWake && typeof paperclipWake.issue === "object" && paperclipWake.issue !== null
      ? (paperclipWake.issue as Record<string, unknown>)
      : null;
  const issueId =
    asString(context.issueId, "").trim() ||
    asString(context.taskId, "").trim();
  const companyId = asString(context.companyId, "").trim() || ctx.agent?.companyId || "";
  if (!issueId || !companyId) return { created: false, approvalId: null, approvalStatus: null };
  if (!ctx.authToken || ctx.authToken.trim().length === 0) return { created: false, approvalId: null, approvalStatus: null };

  const taskTitle =
    asString((context as Record<string, unknown>).taskTitle, "").trim() ||
    asString((context as Record<string, unknown>).issueTitle, "").trim() ||
    asString(wakeIssue?.title, "").trim();
  const taskDescription =
    asString((context as Record<string, unknown>).taskDescription, "").trim() ||
    asString((context as Record<string, unknown>).issueDescription, "").trim() ||
    asString(wakeIssue?.description, "").trim();

  const hydrated = await hydrateIssueDetails(ctx, taskTitle, taskDescription);
  if (!isHireAgentIntent(hydrated.title, hydrated.description)) {
    return { created: false, approvalId: null, approvalStatus: null };
  }

  const apiBase = readEnv("PAPERCLIP_API_URL") || "http://127.0.0.1:3100";
  const authHeader = `Bearer ${ctx.authToken.trim()}`;
  const baseHeaders: Record<string, string> = {
    "content-type": "application/json",
    authorization: authHeader,
    "x-paperclip-run-id": ctx.runId,
  };

  try {
    const linkedResponse = await fetch(
      `${apiBase.replace(/\/$/, "")}/api/issues/${encodeURIComponent(issueId)}/approvals`,
      {
        method: "GET",
        headers: {
          authorization: authHeader,
          "x-paperclip-run-id": ctx.runId,
        },
      },
    );

    if (linkedResponse.ok) {
      const linked = (await linkedResponse.json()) as Array<Record<string, unknown>>;
      const existing = linked.find((item) => {
        if (item.type !== "hire_agent") return false;
        const status = typeof item.status === "string" ? item.status.toLowerCase() : "";
        return status !== "rejected";
      });
      if (existing && typeof existing.id === "string" && existing.id.trim().length > 0) {
        return {
          created: false,
          approvalId: existing.id,
          approvalStatus: typeof existing.status === "string" ? existing.status : null,
        };
      }
    }
  } catch {
    // Best effort pre-check; continue creating approval.
  }

  const approvalPayload: Record<string, unknown> = {
    name: `Solicitud desde ${hydrated.title || "issue"}`,
    role: "general",
    adapterType: "bedrock_gateway",
    adapterConfig: {
      modelId: config.modelId,
      awsRegion: config.awsRegion,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
    },
    capabilities:
      hydrated.description.trim().length > 0
        ? hydrated.description.slice(0, 1200)
        : "Agente solicitado desde issue para atender necesidad especifica de la compania.",
    metadata: {
      source: "bedrock_gateway_fallback",
      runId: ctx.runId,
      issueId,
    },
  };

  const createResponse = await fetch(
    `${apiBase.replace(/\/$/, "")}/api/companies/${encodeURIComponent(companyId)}/approvals`,
    {
      method: "POST",
      headers: baseHeaders,
      body: JSON.stringify({
        type: "hire_agent",
        payload: approvalPayload,
        issueIds: [issueId],
      }),
    },
  );

  if (!createResponse.ok) {
    const detail = await createResponse.text().catch(() => "");
    await ctx.onLog(
      "stderr",
      `[paperclip] Failed to create hire approval (${createResponse.status})${detail ? `: ${detail}` : ""}\n`,
    );
    return { created: false, approvalId: null, approvalStatus: null };
  }

  const created = (await createResponse.json()) as Record<string, unknown>;
  const approvalId = typeof created.id === "string" ? created.id : null;
  await ctx.onLog(
    "stdout",
    `[paperclip] Created hire approval${approvalId ? ` ${approvalId}` : ""} for issue ${issueId}\n`,
  );
  return { created: true, approvalId, approvalStatus: "pending" };
}

function buildAssignmentFallbackResponse(title: string, description: string): string {
  const issueTitle = title.trim() || "este issue";
  const contextLine = description.trim().length > 0
    ? `Contexto que estoy tomando en cuenta: ${description.slice(0, 500)}.`
    : "";
  return [
    `Perfecto. Ya estoy trabajando sobre ${issueTitle}.`,
    contextLine,
    "Hoy mismo puedo avanzar en tres frentes:",
    "- Definir el alcance funcional y el orden de implementacion por prioridad.",
    "- Proponer una estructura de entrega clara (que se hace primero, que se valida despues).",
    "- Dejar una primera version accionable para que el equipo la revise y la ejecute.",
    "Si quieres, en el siguiente mensaje te envio una propuesta completa en formato de plan breve.",
  ]
    .filter((line) => line.length > 0)
    .join("\n");
}

function buildCommentedIssueFallbackResponse(
  title: string,
  description: string,
  latestUserComment: string,
): string {
  const issueTitle = title.trim() || "este issue";
  const userAsk = latestUserComment.trim() || "Aclarar que mas apoyo operativo necesita en este issue.";
  const contextLine = description.trim().length > 0
    ? `Para mantener contexto, sigo trabajando con: ${description.slice(0, 500)}.`
    : "";
  return [
    `Gracias por el comentario. Sobre ${issueTitle}, esto es lo que puedo hacer ahora mismo:`,
    `- Entendi tu pedido: \"${userAsk.slice(0, 300)}\".`,
    "- Definir alcance funcional y estructura de entregables por prioridad.",
    "- Proponer arquitectura tecnica y stack recomendado segun velocidad/costo.",
    "- Redactar copy base (hero, beneficios, CTA) y checklist de lanzamiento.",
    "- Preparar plan de ejecucion por fases con estimacion y riesgos.",
    contextLine,
    "- Dime si quieres que avance primero con: (1) arquitectura, (2) copy, o (3) plan completo.",
    "- Si eliges opcion 3, te dejo una primera version accionable en la siguiente respuesta.",
  ]
    .filter((line) => line.length > 0)
    .join("\n");
}

function buildHireApprovalResponse(
  title: string,
  description: string,
  approvalId: string | null,
  createdNow: boolean,
  approvalStatus: string | null,
): string {
  const normalizedStatus = (approvalStatus || "pending").toLowerCase();
  const statusLine =
    normalizedStatus === "approved"
      ? "Ya existe una aprobacion de contratacion aprobada para este issue, asi que no cree una nueva solicitud."
      : normalizedStatus === "rejected"
        ? "La aprobacion anterior fue rechazada; por eso genere una nueva solicitud de contratacion para retomarlo."
        : "Ya hay una aprobacion de contratacion pendiente para este issue, por eso no duplique la solicitud.";

  return [
    `Actualizacion sobre la solicitud de contratacion para ${title || "Create a new agent"}:`,
    createdNow
      ? "Acabo de crear una aprobacion formal para que Board valide la contratacion."
      : statusLine,
    approvalId
      ? `ID de seguimiento: ${approvalId}.`
      : "La aprobacion quedo registrada en el sistema.",
    "La contratacion no se ejecuta automaticamente: queda a la espera de decision de Board.",
    description ? `Contexto usado para esta solicitud: ${description.slice(0, 500)}.` : "",
    "Siguiente paso recomendado:",
    "- Revisar la solicitud en la bandeja de Approvals.",
    "- Aprobar o rechazar la solicitud con nota de decision.",
    "- Si se aprueba, validar configuracion inicial del nuevo agente y asignarle su primera tarea.",
  ]
    .filter((line) => line.length > 0)
    .join("\n");
}

async function hydrateIssueDetails(
  ctx: AdapterExecutionContext,
  title: string,
  description: string,
): Promise<{ title: string; description: string }> {
  if (title.trim().length > 0 && description.trim().length > 0) {
    return { title, description };
  }

  const context = ctx.context as Record<string, unknown>;
  const issueId = asString(context.issueId, "").trim() || asString(context.taskId, "").trim();
  if (!issueId) return { title, description };

  const apiBase = readEnv("PAPERCLIP_API_URL") || "http://127.0.0.1:3100";
  const url = `${apiBase.replace(/\/$/, "")}/api/issues/${encodeURIComponent(issueId)}`;

  try {
    const headers: Record<string, string> = {};
    if (ctx.authToken && ctx.authToken.trim().length > 0) {
      headers.authorization = `Bearer ${ctx.authToken.trim()}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) return { title, description };

    const payload = (await response.json()) as Record<string, unknown>;
    const apiTitle = asString(payload.title, "").trim();
    const apiDescription = asString(payload.description, "").trim();

    return {
      title: title.trim().length > 0 ? title : apiTitle,
      description: description.trim().length > 0 ? description : apiDescription,
    };
  } catch {
    return { title, description };
  }
}

async function hydrateWakeCommentBody(ctx: AdapterExecutionContext): Promise<string> {
  const context = ctx.context as Record<string, unknown>;
  const paperclipWake =
    typeof context.paperclipWake === "object" && context.paperclipWake !== null
      ? (context.paperclipWake as Record<string, unknown>)
      : null;
  const wakeComment =
    paperclipWake && typeof paperclipWake.comment === "object" && paperclipWake.comment !== null
      ? (paperclipWake.comment as Record<string, unknown>)
      : null;

  const inlineBody = asString((context as Record<string, unknown>).wakeCommentBody, "").trim()
    || asString(wakeComment?.body, "").trim();
  if (inlineBody.length > 0) return inlineBody;

  const issueId = asString(context.issueId, "").trim() || asString(context.taskId, "").trim();
  const wakeCommentId = asString((context as Record<string, unknown>).wakeCommentId, "").trim();
  if (!issueId || !wakeCommentId) return "";

  const apiBase = readEnv("PAPERCLIP_API_URL") || "http://127.0.0.1:3100";
  const url = `${apiBase.replace(/\/$/, "")}/api/issues/${encodeURIComponent(issueId)}/comments/${encodeURIComponent(wakeCommentId)}`;

  try {
    const headers: Record<string, string> = {};
    if (ctx.authToken && ctx.authToken.trim().length > 0) {
      headers.authorization = `Bearer ${ctx.authToken.trim()}`;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) return "";
    const payload = (await response.json()) as Record<string, unknown>;
    return asString(payload.body, "").trim();
  } catch {
    return "";
  }
}

async function finalizeIssueWakeText(ctx: AdapterExecutionContext, text: string): Promise<string> {
  const context = ctx.context as Record<string, unknown>;
  const wakeReason = asString(context.wakeReason, "").trim().toLowerCase();
  const isAssignmentWake = wakeReason === "issue_assigned";
  const isCommentWake = wakeReason === "issue_commented" || wakeReason === "issue_reopened_via_comment";
  if (!isAssignmentWake && !isCommentWake) return text;

  const paperclipWake =
    typeof context.paperclipWake === "object" && context.paperclipWake !== null
      ? (context.paperclipWake as Record<string, unknown>)
      : null;
  const wakeIssue =
    paperclipWake && typeof paperclipWake.issue === "object" && paperclipWake.issue !== null
      ? (paperclipWake.issue as Record<string, unknown>)
      : null;

  const taskTitle =
    asString((context as Record<string, unknown>).taskTitle, "").trim() ||
    asString((context as Record<string, unknown>).issueTitle, "").trim() ||
    asString(wakeIssue?.title, "").trim();
  const taskDescription =
    asString((context as Record<string, unknown>).taskDescription, "").trim() ||
    asString((context as Record<string, unknown>).issueDescription, "").trim() ||
    asString(wakeIssue?.description, "").trim();

  const hydrated = await hydrateIssueDetails(ctx, taskTitle, taskDescription);

  if (isCommentWake) {
    const latestUserComment = await hydrateWakeCommentBody(ctx);
    if (containsPseudoToolScript(text) || containsMetaPlanningOnlyText(text)) {
      return buildCommentedIssueFallbackResponse(hydrated.title, hydrated.description, latestUserComment);
    }
    return text;
  }

  // If the model writes pseudo-instructions like "http_request to call"
  // instead of actually using tools, replace with a concrete response body.
  if (containsPseudoToolScript(text)) {
    return buildAssignmentFallbackResponse(hydrated.title, hydrated.description);
  }

  const coversRequestedDeliverables = includesAllRequestedKeywords(hydrated.description, text);

  if (coversRequestedDeliverables) return text;
  return buildAssignmentFallbackResponse(hydrated.title, hydrated.description);
}

async function tryPostIssueComment(
  ctx: AdapterExecutionContext,
  body: string,
): Promise<boolean> {
  const context = ctx.context as Record<string, unknown>;
  const paperclipWake =
    typeof context.paperclipWake === "object" && context.paperclipWake !== null
      ? (context.paperclipWake as Record<string, unknown>)
      : null;
  const wakeIssue =
    paperclipWake && typeof paperclipWake.issue === "object" && paperclipWake.issue !== null
      ? (paperclipWake.issue as Record<string, unknown>)
      : null;
  const payload =
    typeof context.payload === "object" && context.payload !== null
      ? (context.payload as Record<string, unknown>)
      : null;
  const issueId =
    (typeof context.issueId === "string" && context.issueId.trim().length > 0
      ? context.issueId.trim()
      : null) ||
    (typeof wakeIssue?.id === "string" && wakeIssue.id.trim().length > 0
      ? wakeIssue.id.trim()
      : null) ||
    (typeof payload?.issueId === "string" && payload.issueId.trim().length > 0
      ? payload.issueId.trim()
      : null) ||
    (typeof context.taskId === "string" && context.taskId.trim().length > 0
      ? context.taskId.trim()
      : null);

  if (!issueId) return false;
  if (!body.trim()) return false;

  const apiBase = readEnv("PAPERCLIP_API_URL") || "http://127.0.0.1:3100";
  const url = `${apiBase.replace(/\/$/, "")}/api/issues/${encodeURIComponent(issueId)}/comments`;

  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-paperclip-run-id": ctx.runId,
  };
  if (ctx.authToken && ctx.authToken.trim().length > 0) {
    headers.authorization = `Bearer ${ctx.authToken.trim()}`;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ body }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      await ctx.onLog(
        "stderr",
        `[paperclip] Failed to post issue comment (${response.status})${detail ? `: ${detail}` : ""}\n`,
      );
      return false;
    }

    await ctx.onLog("stdout", `[paperclip] Posted issue comment for ${issueId}\n`);
    return true;
  } catch (error) {
    await ctx.onLog(
      "stderr",
      `[paperclip] Failed to post issue comment: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    return false;
  }
}

function shouldPostIssueComment(ctx: AdapterExecutionContext): boolean {
  const context = ctx.context as Record<string, unknown>;
  const source = asString(context.source, "").trim().toLowerCase();
  const wakeReason = asString(context.wakeReason, "").trim().toLowerCase();
  const wakeSource = asString(context.wakeSource, "").trim().toLowerCase();

  // Avoid infinite loops: comment-triggered runs must not auto-comment again.
  if (source === "issue.comment") return false;
  if (wakeReason === "issue_commented") return false;

  // Only publish a comment for assignment-driven wakes.
  return (
    wakeReason === "issue_assigned" ||
    wakeSource === "assignment" ||
    source === "issue.create" ||
    source === "issue.assignment"
  );
}

export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const startedAt = Date.now();
  try {
    const config = extractBedrockConfig(ctx.config);
    const prompt = resolvePrompt(ctx);
    const client = buildBedrockClient(config);

    const apiBase = readEnv("PAPERCLIP_API_URL") || "http://127.0.0.1:3100";
    const authHeaders: Record<string, string> = {
      "x-paperclip-run-id": ctx.runId,
      ...(ctx.authToken && ctx.authToken.trim().length > 0
        ? { authorization: `Bearer ${ctx.authToken.trim()}` }
        : {}),
    };

    const systemPrompt = buildAgentSystemPrompt(ctx, apiBase, config.systemPrompt);

    await ctx.onLog("stdout", `\n📡 Initializing AWS Bedrock (agentic mode)\n`);
    await ctx.onLog("stdout", `Model: ${config.modelId}\n`);
    await ctx.onLog("stdout", `Region: ${config.awsRegion}\n`);
    await ctx.onLog("stdout", `Max agentic turns: ${config.maxAgenticTurns ?? 15}\n`);

    if (ctx.onMeta) {
      await ctx.onMeta({
        adapterType: "bedrock_gateway",
        command: "bedrock.converse.agentic",
        commandArgs: [config.modelId ?? ""],
        commandNotes: ["AWS Bedrock Converse API with tool use"],
        prompt,
        promptMetrics: { promptChars: prompt.length },
        context: ctx.context,
      });
    }

    const loopResult = await runAgenticLoop(
      client,
      systemPrompt,
      prompt,
      config,
      ctx,
      apiBase,
      authHeaders,
    );

    const { text: rawText, usage, postedCommentViaTool, turns } = loopResult;

    // If agent used tools (made API calls), trust it handled everything.
    // If it was a pure text response (no tool calls), apply existing fallback logic.
    const text = turns === 0
      ? await finalizeIssueWakeText(ctx, rawText)
      : rawText;

    const context = ctx.context as Record<string, unknown>;
    const paperclipWake =
      typeof context.paperclipWake === "object" && context.paperclipWake !== null
        ? (context.paperclipWake as Record<string, unknown>)
        : null;
    const wakeIssue =
      paperclipWake && typeof paperclipWake.issue === "object" && paperclipWake.issue !== null
        ? (paperclipWake.issue as Record<string, unknown>)
        : null;
    const runTaskTitle =
      asString((context as Record<string, unknown>).taskTitle, "").trim() ||
      asString((context as Record<string, unknown>).issueTitle, "").trim() ||
      asString(wakeIssue?.title, "").trim();
    const runTaskDescription =
      asString((context as Record<string, unknown>).taskDescription, "").trim() ||
      asString((context as Record<string, unknown>).issueDescription, "").trim() ||
      asString(wakeIssue?.description, "").trim();
    const hydratedForComment = await hydrateIssueDetails(ctx, runTaskTitle, runTaskDescription);

    const hireApproval = turns === 0
      ? await ensureHireApprovalForIssue(ctx, config)
      : { created: false, approvalId: null, approvalStatus: null };

    const textWithOperationalNote = hireApproval.approvalId
      ? buildHireApprovalResponse(
          hydratedForComment.title,
          hydratedForComment.description,
          hireApproval.approvalId,
          hireApproval.created,
          hireApproval.approvalStatus,
        )
      : text;

    const costUsd = estimateCostUsd(
      usage.inputTokens,
      usage.outputTokens,
      usage.cachedInputTokens,
      config,
    );

    const durationMs = Date.now() - startedAt;
    await ctx.onLog("stdout", `✅ Bedrock agentic run complete (${turns} tool-use turns)\n`);
    await ctx.onLog(
      "stdout",
      `Usage: input=${usage.inputTokens}, output=${usage.outputTokens}, cached=${usage.cachedInputTokens}, cost=$${costUsd.toFixed(6)}\n`,
    );
    if (textWithOperationalNote) {
      await ctx.onLog("stdout", `${textWithOperationalNote}\n`);
    }

    // Only auto-post comment if agent did NOT already post it via tool use
    if (!postedCommentViaTool && textWithOperationalNote && shouldPostIssueComment(ctx)) {
      await tryPostIssueComment(ctx, textWithOperationalNote);
    }

    const summary = textWithOperationalNote || `Bedrock agentic run completed in ${durationMs}ms (${turns} turns).`;

    return {
      exitCode: 0,
      signal: null,
      timedOut: false,
      provider: "aws",
      biller: "aws",
      billingType: "metered_api",
      model: config.modelId,
      summary,
      usage,
      costUsd,
      resultJson: {
        text: textWithOperationalNote,
        stopReason: loopResult.stopReason,
        turns,
        postedCommentViaTool,
        hireApprovalCreated: hireApproval.created,
        hireApprovalId: hireApproval.approvalId,
        hireApprovalStatus: hireApproval.approvalStatus,
        metrics: {
          durationMs,
        },
      },
    };
  } catch (error) {
    const errorMessage = describeBedrockFailure(error);
    await ctx.onLog("stderr", `\nError: ${errorMessage}\n`);

    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      errorMessage: `Bedrock adapter error: ${errorMessage}`,
      provider: "aws",
      biller: "aws",
      billingType: "metered_api",
      summary: "Bedrock adapter error",
    };
  }
}

