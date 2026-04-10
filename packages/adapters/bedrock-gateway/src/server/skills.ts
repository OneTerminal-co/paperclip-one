import type {
  AdapterSkillContext,
  AdapterSkillEntry,
  AdapterSkillSnapshot,
} from "@paperclipai/adapter-utils";
import {
  readPaperclipRuntimeSkillEntries,
  resolvePaperclipDesiredSkillNames,
  writePaperclipSkillSyncPreference,
} from "@paperclipai/adapter-utils/server-utils";

const __moduleDir = new URL(".", import.meta.url).pathname;

function buildEntries(
  availableEntries: Array<{
    key: string;
    runtimeName: string;
    source: string;
    required?: boolean;
    requiredReason?: string | null;
  }>,
  desiredSkills: string[],
): AdapterSkillEntry[] {
  const desiredSet = new Set(desiredSkills);

  return availableEntries.map((entry) => {
    const desired = desiredSet.has(entry.key);
    const required = Boolean(entry.required);

    return {
      key: entry.key,
      runtimeName: entry.runtimeName,
      desired,
      managed: true,
      required,
      requiredReason: entry.requiredReason ?? null,
      state: desired ? "configured" : "available",
      origin: required ? "paperclip_required" : "company_managed",
      originLabel: required ? "Paperclip required" : "Company-managed",
      locationLabel: "Paperclip runtime-managed",
      readOnly: required,
      sourcePath: entry.source,
      targetPath: null,
      detail: desired
        ? "Skill is configured and applied by Paperclip runtime context."
        : "Skill is available to configure for Paperclip runtime context.",
    } satisfies AdapterSkillEntry;
  });
}

async function buildBedrockSkillSnapshot(config: Record<string, unknown>): Promise<AdapterSkillSnapshot> {
  const availableEntries = await readPaperclipRuntimeSkillEntries(config, __moduleDir);
  const desiredSkills = resolvePaperclipDesiredSkillNames(config, availableEntries);
  const entries = buildEntries(availableEntries, desiredSkills);
  const warnings: string[] = [];
  const availableKeys = new Set(availableEntries.map((entry) => entry.key));

  for (const desiredSkill of desiredSkills) {
    if (availableKeys.has(desiredSkill)) continue;
    warnings.push(`Desired skill "${desiredSkill}" is not available from the Paperclip runtime skills directory.`);
    entries.push({
      key: desiredSkill,
      runtimeName: null,
      desired: true,
      managed: true,
      state: "missing",
      origin: "external_unknown",
      originLabel: "External or unavailable",
      readOnly: false,
      sourcePath: null,
      targetPath: null,
      detail: "Paperclip cannot find this skill in the runtime skills directory.",
    });
  }

  entries.sort((left, right) => left.key.localeCompare(right.key));

  return {
    adapterType: "bedrock_gateway",
    supported: true,
    mode: "ephemeral",
    desiredSkills,
    entries,
    warnings,
  };
}

export async function listBedrockSkills(ctx: AdapterSkillContext): Promise<AdapterSkillSnapshot> {
  return buildBedrockSkillSnapshot(ctx.config);
}

export async function syncBedrockSkills(
  ctx: AdapterSkillContext,
  desiredSkills: string[],
): Promise<AdapterSkillSnapshot> {
  const configWithPreference = writePaperclipSkillSyncPreference(ctx.config, desiredSkills);
  return buildBedrockSkillSnapshot(configWithPreference);
}
