import React, { useState, useEffect } from "react";
import type { AgentConfigValue } from "@paperclipai/adapter-utils";
import { Field } from "../../components/agent-config-primitives";

export interface BedrockConfigFieldsProps {
  values: Record<string, AgentConfigValue>;
  onChange: (key: string, value: AgentConfigValue) => void;
}

export function BedrockGatewayConfigFields({ values, onChange }: BedrockConfigFieldsProps) {
  const [region, setRegion] = useState<string>((values.awsRegion as string) || "us-east-1");
  const [modelId, setModelId] = useState<string>((values.modelId as string) || "");
  const [maxTokens, setMaxTokens] = useState<number>((values.maxTokens as number) || 4096);
  const [temperature, setTemperature] = useState<number>((values.temperature as number) || 0.7);

  useEffect(() => {
    onChange("awsRegion", region);
  }, [region, onChange]);

  useEffect(() => {
    onChange("modelId", modelId);
  }, [modelId, onChange]);

  useEffect(() => {
    onChange("maxTokens", maxTokens);
  }, [maxTokens, onChange]);

  useEffect(() => {
    onChange("temperature", temperature);
  }, [temperature, onChange]);

  const regions = [
    "us-east-1",
    "us-west-2",
    "eu-west-1",
    "ap-southeast-1",
    "ap-northeast-1",
  ];

  const models = [
    { id: "anthropic.claude-3-5-sonnet-20241022-v2:0", label: "Claude 3.5 Sonnet" },
    { id: "anthropic.claude-3-5-haiku-20241022-v1:0", label: "Claude 3.5 Haiku" },
    { id: "anthropic.claude-3-opus-20240229-v1:0", label: "Claude 3 Opus" },
    { id: "meta.llama3-1-405b-instruct-v1:0", label: "Llama 3.1 405B" },
    { id: "meta.llama3-1-70b-instruct-v1:0", label: "Llama 3.1 70B" },
    { id: "cohere.command-r-plus-v1:0", label: "Cohere Command R+" },
  ];

  return (
    <div className="space-y-4">
      <Field label="AWS Region" hint="Select the AWS region for Bedrock">
        <select
          className="w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm outline-none"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        >
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Model" hint="Select the AI model">
        <select
          className="w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm outline-none"
          value={modelId}
          onChange={(e) => setModelId(e.target.value)}
        >
          <option value="">-- Select a model --</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Max Tokens" hint="Maximum output tokens (1-4096)">
        <input
          type="number"
          min="1"
          max="4096"
          className="w-full rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm outline-none"
          value={maxTokens}
          onChange={(e) => setMaxTokens(Number(e.target.value))}
        />
      </Field>

      <Field label="Temperature" hint="Sampling temperature (0-1)">
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            className="flex-1"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
          />
          <span className="w-12 text-right text-sm font-mono">{temperature.toFixed(1)}</span>
        </div>
      </Field>

      <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
        <p className="font-medium">AWS Credentials</p>
        <p className="mt-1">
          AWS credentials can be provided via:
        </p>
        <ul className="mt-1 list-inside list-disc space-y-0.5">
          <li>Environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY</li>
          <li>AWS CLI configuration</li>
          <li>IAM roles (if running on AWS)</li>
        </ul>
      </div>
    </div>
  );
}
