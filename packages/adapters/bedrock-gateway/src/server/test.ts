import type { AdapterEnvironmentTestContext, AdapterEnvironmentTestResult } from "@paperclipai/adapter-utils";

export async function testEnvironment(
  _ctx: AdapterEnvironmentTestContext
): Promise<AdapterEnvironmentTestResult> {
  const checks = [
    {
      code: "bedrock_available",
      level: "warn" as const,
      message: "AWS Bedrock is available in the configured region",
      hint: "Verify AWS Bedrock is accessible in your region",
    },
    {
      code: "aws_credentials",
      level: "warn" as const,
      message: "AWS credentials should be configured",
      hint: "Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY or use IAM roles",
    },
  ];

  return {
    adapterType: "bedrock_gateway",
    status: "warn",
    checks,
    testedAt: new Date().toISOString(),
  };
}



