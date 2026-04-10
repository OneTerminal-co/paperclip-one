import fs from "node:fs/promises";

const DEFAULT_AGENT_BUNDLE_FILES = {
  default: ["AGENTS.md"],
  ceo: ["AGENTS.md", "HEARTBEAT.md", "SOUL.md", "TOOLS.md"],
  // OpsFleet agents
  finops: ["AGENTS.md", "HEARTBEAT.md", "SOUL.md", "TOOLS.md"],
  security: ["AGENTS.md", "HEARTBEAT.md", "SOUL.md", "TOOLS.md"],
  "infra-ops": ["AGENTS.md", "HEARTBEAT.md", "SOUL.md", "TOOLS.md"],
  knowledge: ["AGENTS.md", "HEARTBEAT.md", "SOUL.md", "TOOLS.md"],
  cicd: ["AGENTS.md", "HEARTBEAT.md", "SOUL.md", "TOOLS.md"],
  compliance: ["AGENTS.md", "HEARTBEAT.md", "SOUL.md", "TOOLS.md"],
} as const;

type DefaultAgentBundleRole = keyof typeof DEFAULT_AGENT_BUNDLE_FILES;

function resolveDefaultAgentBundleUrl(role: DefaultAgentBundleRole, fileName: string) {
  return new URL(`../onboarding-assets/${role}/${fileName}`, import.meta.url);
}

export async function loadDefaultAgentInstructionsBundle(role: DefaultAgentBundleRole): Promise<Record<string, string>> {
  const fileNames = DEFAULT_AGENT_BUNDLE_FILES[role];
  const entries = await Promise.all(
    fileNames.map(async (fileName) => {
      const content = await fs.readFile(resolveDefaultAgentBundleUrl(role, fileName), "utf8");
      return [fileName, content] as const;
    }),
  );
  return Object.fromEntries(entries);
}

const OPSFLEET_ROLES = ["finops", "security", "infra-ops", "knowledge", "cicd", "compliance"] as const;

export function resolveDefaultAgentInstructionsBundleRole(role: string): DefaultAgentBundleRole {
  if (role === "ceo") return "ceo";
  if (OPSFLEET_ROLES.includes(role as (typeof OPSFLEET_ROLES)[number])) {
    return role as DefaultAgentBundleRole;
  }
  return "default";
}
