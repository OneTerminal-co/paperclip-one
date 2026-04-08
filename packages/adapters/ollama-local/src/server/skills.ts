import type {
  AdapterSkillEntry,
  AdapterSkillContext,
  AdapterSkillOrigin,
  AdapterSkillSnapshot,
  AdapterSkillState,
} from "@paperclipai/adapter-utils";
import {
  readPaperclipRuntimeSkillEntries,
  resolvePaperclipDesiredSkillNames,
} from "@paperclipai/adapter-utils/server-utils";

function inferOrigin(key: string, required: boolean): { origin: AdapterSkillOrigin; originLabel: string } {
  if (required || key.startsWith("paperclipai/paperclip/")) {
    return { origin: "paperclip_required", originLabel: "Paperclip required" };
  }
  return { origin: "company_managed", originLabel: "Company-managed" };
}

async function buildOllamaSkillSnapshot(
  config: Record<string, unknown>,
  desiredOverride?: string[],
): Promise<AdapterSkillSnapshot> {
  const availableEntries = await readPaperclipRuntimeSkillEntries(config, import.meta.dirname);
  const desiredSkills =
    desiredOverride ?? resolvePaperclipDesiredSkillNames(config, availableEntries);
  const desiredSet = new Set(desiredSkills);
  const availableByKey = new Map(availableEntries.map((entry) => [entry.key, entry]));

  const warnings: string[] = [];
  const entries: AdapterSkillEntry[] = availableEntries.map((entry) => {
    const desired = desiredSet.has(entry.key);
    const { origin, originLabel } = inferOrigin(entry.key, Boolean(entry.required));
    const state: AdapterSkillState = desired ? "configured" : "available";
    return {
      key: entry.key,
      runtimeName: entry.runtimeName,
      desired,
      managed: true,
      required: Boolean(entry.required),
      requiredReason: entry.requiredReason ?? null,
      state,
      origin,
      originLabel,
      locationLabel: "Injected into prompt at runtime",
      readOnly: false,
      sourcePath: entry.source,
      targetPath: null,
      detail: desired
        ? "Configured and injected when the agent runs."
        : "Available to configure.",
    };
  });

  for (const desiredSkill of desiredSkills) {
    if (availableByKey.has(desiredSkill)) continue;
    warnings.push(`Desired skill "${desiredSkill}" is not available from the Paperclip skills directory.`);
    entries.push({
      key: desiredSkill,
      runtimeName: null,
      desired: true,
      managed: true,
      state: "missing",
      sourcePath: null,
      targetPath: null,
      detail: "Paperclip cannot find this skill in the local runtime skills directory.",
      origin: "external_unknown",
      originLabel: "External or unavailable",
      readOnly: false,
    });
  }

  entries.sort((left, right) => left.key.localeCompare(right.key));

  return {
    adapterType: "ollama_local",
    supported: true,
    mode: "ephemeral",
    desiredSkills,
    entries,
    warnings,
  };
}

export async function listOllamaSkills(ctx: AdapterSkillContext): Promise<AdapterSkillSnapshot> {
  return buildOllamaSkillSnapshot(ctx.config);
}

export async function syncOllamaSkills(
  ctx: AdapterSkillContext,
  desiredSkills: string[],
): Promise<AdapterSkillSnapshot> {
  const availableEntries = await readPaperclipRuntimeSkillEntries(ctx.config, import.meta.dirname);
  const desiredSet = new Set([
    ...desiredSkills,
    ...availableEntries.filter((entry) => entry.required).map((entry) => entry.key),
  ]);
  return buildOllamaSkillSnapshot(ctx.config, Array.from(desiredSet));
}