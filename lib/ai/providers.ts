import type { AiProvider } from "../../db/schema";

export { aiProviders, type AiProvider } from "../../db/schema";

export type AiProviderOption = {
  configured: boolean;
  default_base_url: string;
  default_model: string;
  description: string;
  env_hint: string;
  label: string;
  value: AiProvider;
};

export type AiProviderRuntime = {
  apiKey: string;
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  model: string;
  provider: Exclude<AiProvider, "rules">;
};

type ProviderDefinition = {
  apiKeyEnv: string;
  baseUrlEnv: string;
  defaultBaseUrl: string;
  defaultModel: string;
  description: string;
  label: string;
  modelEnv: string;
};

const providerDefinitions: Record<Exclude<AiProvider, "rules">, ProviderDefinition> = {
  deepseek: {
    apiKeyEnv: "DEEPSEEK_API_KEY",
    baseUrlEnv: "DEEPSEEK_BASE_URL",
    defaultBaseUrl: "https://api.deepseek.com",
    defaultModel: "deepseek-chat",
    description: "使用 DeepSeek 的 OpenAI 兼容 Chat Completions 接口。",
    label: "DeepSeek",
    modelEnv: "DEEPSEEK_MODEL"
  },
  openai: {
    apiKeyEnv: "OPENAI_API_KEY",
    baseUrlEnv: "OPENAI_BASE_URL",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4.1-mini",
    description: "使用 OpenAI Chat Completions 接口生成结构化诊断。",
    label: "OpenAI",
    modelEnv: "OPENAI_MODEL"
  },
  openrouter: {
    apiKeyEnv: "OPENROUTER_API_KEY",
    baseUrlEnv: "OPENROUTER_BASE_URL",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4.1-mini",
    description: "通过 OpenRouter 在同一接口下调用不同模型。",
    label: "OpenRouter",
    modelEnv: "OPENROUTER_MODEL"
  },
  compatible: {
    apiKeyEnv: "COMPATIBLE_API_KEY",
    baseUrlEnv: "COMPATIBLE_BASE_URL",
    defaultBaseUrl: "",
    defaultModel: "",
    description: "适用于提供 OpenAI Chat Completions 兼容协议的其他服务。",
    label: "自定义兼容接口",
    modelEnv: "COMPATIBLE_MODEL"
  }
};

const externalProviderOrder: Array<Exclude<AiProvider, "rules">> = [
  "deepseek",
  "openai",
  "openrouter",
  "compatible"
];

function readEnv(name: string) {
  return process.env[name]?.trim() || "";
}

function getConfiguredDefaultModel(provider: Exclude<AiProvider, "rules">) {
  const definition = providerDefinitions[provider];
  return readEnv(definition.modelEnv) || definition.defaultModel;
}

export function getAiProviderOptions(): AiProviderOption[] {
  const externalOptions = externalProviderOrder.map(
    (provider) => {
      const definition = providerDefinitions[provider];
      const hasApiKey = Boolean(readEnv(definition.apiKeyEnv));
      const hasBaseUrl = Boolean(readEnv(definition.baseUrlEnv) || definition.defaultBaseUrl);
      const defaultModel = getConfiguredDefaultModel(provider);

      return {
        configured: hasApiKey && hasBaseUrl && Boolean(defaultModel),
        default_base_url: definition.defaultBaseUrl,
        default_model: defaultModel,
        description: definition.description,
        env_hint: [definition.apiKeyEnv, definition.baseUrlEnv, definition.modelEnv].join(" · "),
        label: definition.label,
        value: provider
      };
    }
  );

  return [
    {
      configured: true,
      default_base_url: "",
      default_model: "",
      description: "无需外部密钥，使用可解释的内置规则生成基础诊断。",
      env_hint: "无需配置",
      label: "内置规则诊断",
      value: "rules"
    },
    ...externalOptions
  ];
}

export function getDefaultAiProvider(): AiProvider {
  return getAiProviderOptions().find((option) => option.value !== "rules" && option.configured)?.value ?? "rules";
}

export function getAiProviderRuntime(provider: Exclude<AiProvider, "rules">, modelOverride = ""): AiProviderRuntime {
  const definition = providerDefinitions[provider];
  const apiKey = readEnv(definition.apiKeyEnv);
  const baseUrl = readEnv(definition.baseUrlEnv) || definition.defaultBaseUrl;
  const model = modelOverride.trim() || getConfiguredDefaultModel(provider);

  if (!apiKey || !baseUrl || !model) {
    throw new Error(`Provider ${provider} is not configured`);
  }

  const defaultHeaders =
    provider === "openrouter"
      ? Object.fromEntries(
          [
            ["HTTP-Referer", readEnv("OPENROUTER_SITE_URL")],
            ["X-Title", readEnv("OPENROUTER_APP_NAME")]
          ].filter((entry): entry is [string, string] => Boolean(entry[1]))
        )
      : undefined;

  return {
    apiKey,
    baseUrl,
    defaultHeaders,
    model,
    provider
  };
}
