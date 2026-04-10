import type { AdapterConfigFieldsProps } from "../types";
import {
  Field,
  DraftInput,
  DraftNumberInput,
} from "../../components/agent-config-primitives";

const inputClass =
  "w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40";

function readSchemaValue(values: AdapterConfigFieldsProps["values"], key: string): unknown {
  const schemaValues = values?.adapterSchemaValues;
  if (!schemaValues || typeof schemaValues !== "object" || Array.isArray(schemaValues)) return undefined;
  return (schemaValues as Record<string, unknown>)[key];
}

function writeSchemaValue(
  values: AdapterConfigFieldsProps["values"],
  set: AdapterConfigFieldsProps["set"],
  key: string,
  value: unknown,
) {
  if (!set || !values) return;
  const schemaValues =
    values.adapterSchemaValues && typeof values.adapterSchemaValues === "object" && !Array.isArray(values.adapterSchemaValues)
      ? (values.adapterSchemaValues as Record<string, unknown>)
      : {};
  set({
    adapterSchemaValues: {
      ...schemaValues,
      [key]: value,
    },
  });
}

export function BedrockGatewayConfigFields({
  isCreate,
  values,
  set,
  config,
  eff,
  mark,
}: AdapterConfigFieldsProps) {
  const region = isCreate
    ? String(readSchemaValue(values, "awsRegion") ?? "us-east-1")
    : eff("adapterConfig", "awsRegion", String(config.awsRegion ?? "us-east-1"));

  const maxTokens = isCreate
    ? Number(readSchemaValue(values, "maxTokens") ?? 4096)
    : eff("adapterConfig", "maxTokens", Number(config.maxTokens ?? 4096));

  const temperature = isCreate
    ? Number(readSchemaValue(values, "temperature") ?? 0.7)
    : eff("adapterConfig", "temperature", Number(config.temperature ?? 0.7));

  return (
    <>
      <Field label="AWS Region" hint="AWS region for Bedrock runtime requests.">
        {isCreate ? (
          <DraftInput
            value={region}
            onCommit={(v) => writeSchemaValue(values, set, "awsRegion", (v || "us-east-1").trim() || "us-east-1")}
            immediate
            className={inputClass}
            placeholder="us-east-1"
          />
        ) : (
          <DraftInput
            value={region}
            onCommit={(v) => mark("adapterConfig", "awsRegion", (v || "us-east-1").trim() || "us-east-1")}
            immediate
            className={inputClass}
            placeholder="us-east-1"
          />
        )}
      </Field>

      <Field label="Max Tokens" hint="Maximum output tokens for Bedrock responses.">
        {isCreate ? (
          <DraftNumberInput
            value={maxTokens}
            onCommit={(v) => writeSchemaValue(values, set, "maxTokens", Math.max(1, Number(v || 4096)))}
            immediate
            className={inputClass}
          />
        ) : (
          <DraftNumberInput
            value={maxTokens}
            onCommit={(v) => mark("adapterConfig", "maxTokens", Math.max(1, Number(v || 4096)))}
            immediate
            className={inputClass}
          />
        )}
      </Field>

      <Field label="Temperature" hint="Sampling temperature between 0 and 1.">
        {isCreate ? (
          <DraftNumberInput
            value={temperature}
            onCommit={(v) => {
              const parsed = Number(v ?? 0.7);
              const clamped = Math.min(1, Math.max(0, parsed));
              writeSchemaValue(values, set, "temperature", clamped);
            }}
            immediate
            className={inputClass}
          />
        ) : (
          <DraftNumberInput
            value={temperature}
            onCommit={(v) => {
              const parsed = Number(v ?? 0.7);
              const clamped = Math.min(1, Math.max(0, parsed));
              mark("adapterConfig", "temperature", clamped);
            }}
            immediate
            className={inputClass}
          />
        )}
      </Field>
    </>
  );
}
