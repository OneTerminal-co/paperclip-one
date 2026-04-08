#!/usr/bin/env node
import http from "node:http";

const BRIDGE_PORT = Number(process.env.OLLAMA_BRIDGE_PORT || 11435);
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:4b";
const PAPERCLIP_API_URL = process.env.PAPERCLIP_API_URL || "http://127.0.0.1:3100/api";
const PAPERCLIP_API_KEY = process.env.PAPERCLIP_API_KEY || "";

function json(res, statusCode, payload) {
  res.writeHead(statusCode, { "content-type": "application/json" });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve(text ? JSON.parse(text) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function buildPrompt(body) {
  if (typeof body.prompt === "string" && body.prompt.trim()) {
    return body.prompt.trim();
  }

  const context = body.context && typeof body.context === "object" ? body.context : {};
  const title = typeof context.issueTitle === "string" ? context.issueTitle : "";
  const description = typeof context.issueDescription === "string" ? context.issueDescription : "";
  const wakeReason = typeof context.wakeReason === "string" ? context.wakeReason : "";
  const runId = typeof body.runId === "string" ? body.runId : "";

  const parts = [
    "Eres un agente de software en Paperclip.",
    title ? `Issue: ${title}` : "",
    description ? `Description:\n${description}` : "",
    wakeReason ? `Wake reason: ${wakeReason}` : "",
    runId ? `Run ID: ${runId}` : "",
    "Responde con un resumen breve de acciones y siguiente paso recomendado.",
  ].filter(Boolean);

  return parts.join("\n\n");
}

async function callOllama(prompt, model) {
  const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ollama error ${response.status}: ${body.slice(0, 500)}`);
  }

  const data = await response.json();
  return {
    text: typeof data.response === "string" ? data.response : JSON.stringify(data),
    raw: data,
  };
}

async function postIssueComment(issueId, text) {
  if (!PAPERCLIP_API_KEY) return { skipped: true, reason: "missing PAPERCLIP_API_KEY" };

  const response = await fetch(`${PAPERCLIP_API_URL}/issues/${issueId}/comments`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${PAPERCLIP_API_KEY}`,
    },
    body: JSON.stringify({ body: text }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Paperclip comments error ${response.status}: ${body.slice(0, 500)}`);
  }

  return { skipped: false };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    json(res, 200, {
      ok: true,
      bridgePort: BRIDGE_PORT,
      ollamaHost: OLLAMA_HOST,
      model: OLLAMA_MODEL,
    });
    return;
  }

  if (req.method !== "POST" || req.url !== "/invoke") {
    json(res, 404, { ok: false, error: "Not found" });
    return;
  }

  try {
    const body = await readBody(req);
    const model = typeof body.model === "string" && body.model.trim() ? body.model.trim() : OLLAMA_MODEL;
    const prompt = buildPrompt(body);

    const ollama = await callOllama(prompt, model);

    const context = body.context && typeof body.context === "object" ? body.context : {};
    const issueId =
      (typeof context.issueId === "string" && context.issueId) ||
      (typeof context.taskId === "string" && context.taskId) ||
      null;

    let commentResult = { skipped: true, reason: "missing issueId in context" };
    if (issueId) {
      const commentText = [
        `### Local Ollama (${model})`,
        "",
        ollama.text,
      ].join("\n");
      commentResult = await postIssueComment(issueId, commentText);
    }

    json(res, 200, {
      ok: true,
      model,
      issueId,
      comment: commentResult,
      summary: ollama.text.slice(0, 200),
    });
  } catch (error) {
    json(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(BRIDGE_PORT, "127.0.0.1", () => {
  process.stdout.write(
    `[ollama-bridge] listening on http://127.0.0.1:${BRIDGE_PORT} (ollama=${OLLAMA_HOST}, model=${OLLAMA_MODEL})\n`,
  );
});
