import { aiProviders, type AiProvider } from "./providers";
import type { BrowserAiCredential } from "./browser-storage";

export type AiProviderSettingInput = {
  model: string;
  provider: AiProvider;
};

export type AiProviderSettingErrors = Partial<Record<keyof AiProviderSettingInput, string>>;

export function validateAiProviderSetting(payload: Record<string, unknown>) {
  const errors: AiProviderSettingErrors = {};
  const provider = typeof payload.provider === "string" ? payload.provider.trim() : "";
  const model = typeof payload.model === "string" ? payload.model.trim() : "";

  if (!aiProviders.includes(provider as AiProvider)) {
    errors.provider = "请选择有效的 AI 接口。";
  }

  if (provider !== "rules") {
    if (!model) errors.model = "请填写模型 ID。";
    else if (model.length > 120) errors.model = "模型 ID 不能超过 120 个字符。";
    else if (!/^[A-Za-z0-9._:/-]+$/.test(model)) errors.model = "模型 ID 只能包含字母、数字、点、冒号、斜杠、下划线和连字符。";
  }

  if (Object.keys(errors).length > 0) {
    return { data: null, errors, ok: false as const };
  }

  return {
    data: { model: provider === "rules" ? "" : model, provider: provider as AiProvider },
    errors: {},
    ok: true as const
  };
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isSafeCompatibleBaseUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  const hostname = url.hostname.toLowerCase();
  return (
    url.protocol === "https:" &&
    !url.username &&
    !url.password &&
    hostname !== "localhost" &&
    !hostname.endsWith(".localhost") &&
    !hostname.endsWith(".local") &&
    !hostname.endsWith(".internal") &&
    !hostname.includes(":") &&
    !isPrivateIpv4(hostname)
  );
}

const fixedBrowserBaseUrls: Partial<Record<Exclude<AiProvider, "rules">, string>> = {
  deepseek: "https://api.deepseek.com",
  openai: "https://api.openai.com/v1",
  openrouter: "https://openrouter.ai/api/v1"
};

export function validateBrowserAiProviderConfig(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { data: null, message: "浏览器 AI 接口配置格式不正确。", ok: false as const };
  }

  const record = payload as Record<string, unknown>;
  const provider = typeof record.provider === "string" ? record.provider.trim() : "";
  const apiKey = typeof record.api_key === "string" ? record.api_key.trim() : "";
  const model = typeof record.model === "string" ? record.model.trim() : "";
  const baseUrl = typeof record.base_url === "string" ? normalizeBaseUrl(record.base_url.trim()) : "";

  if (provider === "rules" || !aiProviders.includes(provider as AiProvider)) {
    return { data: null, message: "浏览器 AI 接口类型无效。", ok: false as const };
  }
  if (!apiKey || apiKey.length > 500) {
    return { data: null, message: "浏览器 API 密钥为空或长度不正确。", ok: false as const };
  }
  if (!model || model.length > 120 || !/^[A-Za-z0-9._:/-]+$/.test(model)) {
    return { data: null, message: "浏览器模型 ID 格式不正确。", ok: false as const };
  }

  const externalProvider = provider as Exclude<AiProvider, "rules">;
  const fixedBaseUrl = fixedBrowserBaseUrls[externalProvider];
  if (fixedBaseUrl && baseUrl !== fixedBaseUrl) {
    return { data: null, message: "该 AI 接口只能使用官方 HTTPS 地址。", ok: false as const };
  }
  if (!fixedBaseUrl && !isSafeCompatibleBaseUrl(baseUrl)) {
    return { data: null, message: "自定义接口必须使用可公开访问的 HTTPS 地址。", ok: false as const };
  }

  return {
    data: {
      api_key: apiKey,
      base_url: baseUrl,
      model,
      provider: externalProvider
    } satisfies BrowserAiCredential,
    message: "",
    ok: true as const
  };
}
