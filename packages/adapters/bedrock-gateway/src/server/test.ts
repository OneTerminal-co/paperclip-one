import type { AdapterEnvironmentTestContext, AdapterEnvironmentTestResult } from "@paperclipai/adapter-utils";

export async function testEnvironment(
  ctx: AdapterEnvironmentTestContext
): Promise<AdapterEnvironmentTestResult> {
  const config = (ctx.config ?? {}) as Record<string, unknown>;
  const region = typeof config.awsRegion === "string" && config.awsRegion.trim().length > 0
    ? config.awsRegion.trim()
    : (process.env.AWS_REGION || "");
  const modelId = typeof config.modelId === "string" && config.modelId.trim().length > 0
    ? config.modelId.trim()
    : "";
  const hasCredentials =
    typeof process.env.AWS_ACCESS_KEY_ID === "string" &&
    process.env.AWS_ACCESS_KEY_ID.trim().length > 0 &&
    typeof process.env.AWS_SECRET_ACCESS_KEY === "string" &&
    process.env.AWS_SECRET_ACCESS_KEY.trim().length > 0;

  const checks: Array<{
    code: string;
    level: "info" | "warn" | "error";
    message: string;
    hint?: string;
  }> = [
    {
      code: "bedrock_region",
      level: region ? "info" : "warn",
      message: region
        ? `AWS region configured: ${region}`
        : "AWS region is not configured",
      hint: region ? undefined : "Set awsRegion in adapter config or AWS_REGION in server environment",
    },
    {
      code: "bedrock_model",
      level: modelId ? "info" : "warn",
      message: modelId
        ? `Bedrock model configured: ${modelId}`
        : "Bedrock model is not configured",
      hint: modelId ? undefined : "Set modelId in adapter config (model ID or inference profile ARN)",
    },
    {
      code: "aws_credentials",
      level: hasCredentials ? "info" : "warn",
      message: hasCredentials
        ? "AWS credentials found in server environment"
        : "AWS credentials are not configured in server environment",
      hint: hasCredentials
        ? undefined
        : "Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in the environment where the server is running, or use IAM roles",
    },
  ];

  const hasError = checks.some((check) => check.level === "error");
  const hasWarn = checks.some((check) => check.level === "warn");

  return {
    adapterType: "bedrock_gateway",
    status: hasError ? "fail" : hasWarn ? "warn" : "pass",
    checks,
    testedAt: new Date().toISOString(),
  };
}



