import type { UIAdapterModule } from "../types";
import { parseBedrockStdoutLine } from "@paperclipai/adapter-bedrock-gateway/ui";
import { BedrockGatewayConfigFields } from "./config-fields";
import { buildBedrockConfig } from "@paperclipai/adapter-bedrock-gateway/ui";

export const bedrockGatewayUIAdapter: UIAdapterModule = {
  type: "bedrock_gateway",
  label: "AWS Bedrock",
  parseStdoutLine: parseBedrockStdoutLine,
  ConfigFields: BedrockGatewayConfigFields,
  buildAdapterConfig: buildBedrockConfig,
};
