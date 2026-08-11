import type { AiProvider } from "./providers";

export type BrowserAiCredential = {
  api_key: string;
  base_url: string;
  model: string;
  provider: Exclude<AiProvider, "rules">;
};

type BrowserAiStorage = {
  credentials: Partial<Record<Exclude<AiProvider, "rules">, BrowserAiCredential>>;
  selected_provider: AiProvider;
};

const storageKey = "org-insight:ai-provider-credentials:v1";

function emptyStorage(): BrowserAiStorage {
  return { credentials: {}, selected_provider: "rules" };
}

export function readBrowserAiStorage(): BrowserAiStorage {
  if (typeof window === "undefined") return emptyStorage();

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return emptyStorage();
    const parsed = JSON.parse(raw) as Partial<BrowserAiStorage>;
    return {
      credentials: parsed.credentials && typeof parsed.credentials === "object" ? parsed.credentials : {},
      selected_provider: typeof parsed.selected_provider === "string" ? parsed.selected_provider as AiProvider : "rules"
    };
  } catch {
    return emptyStorage();
  }
}

export function saveBrowserAiSelection(provider: AiProvider, credential?: BrowserAiCredential) {
  if (typeof window === "undefined") return false;

  try {
    const current = readBrowserAiStorage();
    const credentials = { ...current.credentials };
    if (credential) credentials[credential.provider] = credential;
    window.localStorage.setItem(storageKey, JSON.stringify({ credentials, selected_provider: provider }));
    return true;
  } catch {
    return false;
  }
}

export function clearBrowserAiCredential(provider: Exclude<AiProvider, "rules">) {
  if (typeof window === "undefined") return false;

  try {
    const current = readBrowserAiStorage();
    const credentials = { ...current.credentials };
    delete credentials[provider];
    window.localStorage.setItem(storageKey, JSON.stringify({ ...current, credentials }));
    return true;
  } catch {
    return false;
  }
}

export function readBrowserDiagnosisConfig(): BrowserAiCredential | null {
  const current = readBrowserAiStorage();
  if (current.selected_provider === "rules") return null;
  return current.credentials[current.selected_provider] ?? null;
}
