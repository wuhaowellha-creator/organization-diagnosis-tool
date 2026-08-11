import { getAiProviderRuntime } from "./providers";

export const defaultDeepSeekBaseUrl = "https://api.deepseek.com";
export const defaultDeepSeekModel = "deepseek-chat";

export function getDeepSeekEnv() {
  const runtime = getAiProviderRuntime("deepseek");
  return { apiKey: runtime.apiKey, baseUrl: runtime.baseUrl, model: runtime.model };
}
