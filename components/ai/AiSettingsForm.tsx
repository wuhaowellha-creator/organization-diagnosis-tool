"use client";

import { useEffect, useMemo, useState } from "react";
import {
  clearBrowserAiCredential,
  readBrowserAiStorage,
  saveBrowserAiSelection,
  type BrowserAiCredential
} from "../../lib/ai/browser-storage";
import type { AiProviderOption } from "../../lib/ai/providers";
import type { AiProviderSetting } from "../../lib/ai/settings";
import type { AiProviderSettingErrors } from "../../lib/ai/validation";
import { Badge, Button, ErrorMessage, Input, Select } from "../common";

type SettingsResponse = {
  errors?: AiProviderSettingErrors;
  message?: string;
  setting?: AiProviderSetting;
};

type AiSettingsFormProps = {
  initialSetting: AiProviderSetting;
  providers: AiProviderOption[];
};

type ExternalProvider = Exclude<AiProviderSetting["provider"], "rules">;

export function AiSettingsForm({ initialSetting, providers }: AiSettingsFormProps) {
  const [savedSetting, setSavedSetting] = useState(initialSetting);
  const [values, setValues] = useState(initialSetting);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [browserConfiguredProviders, setBrowserConfiguredProviders] = useState<Set<string>>(new Set());
  const [fieldErrors, setFieldErrors] = useState<AiProviderSettingErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const selectedOption = useMemo(
    () => providers.find((provider) => provider.value === values.provider) ?? providers[0],
    [providers, values.provider]
  );

  useEffect(() => {
    const browserStorage = readBrowserAiStorage();
    const selectedProvider = providers.some((provider) => provider.value === browserStorage.selected_provider)
      ? browserStorage.selected_provider
      : initialSetting.provider;
    const providerOption = providers.find((provider) => provider.value === selectedProvider);
    const credential = selectedProvider === "rules" ? undefined : browserStorage.credentials[selectedProvider];

    setValues({
      model: credential?.model ?? (initialSetting.provider === selectedProvider ? initialSetting.model : providerOption?.default_model ?? ""),
      provider: selectedProvider
    });
    setApiKey(credential?.api_key ?? "");
    setBaseUrl(credential?.base_url ?? providerOption?.default_base_url ?? "");
    setBrowserConfiguredProviders(
      new Set(
        Object.entries(browserStorage.credentials)
          .filter(([, item]) => Boolean(item?.api_key))
          .map(([provider]) => provider)
      )
    );
  }, [initialSetting, providers]);

  function clearMessages() {
    setFieldErrors({});
    setMessage(null);
    setFormError(null);
  }

  function changeProvider(provider: AiProviderSetting["provider"]) {
    const option = providers.find((item) => item.value === provider);
    const browserStorage = readBrowserAiStorage();
    const credential = provider === "rules" ? undefined : browserStorage.credentials[provider];

    setValues({
      model: credential?.model ?? (savedSetting.provider === provider ? savedSetting.model : option?.default_model ?? ""),
      provider
    });
    setApiKey(credential?.api_key ?? "");
    setBaseUrl(credential?.base_url ?? option?.default_base_url ?? "");
    setShowApiKey(false);
    clearMessages();
  }

  function clearCurrentBrowserKey() {
    if (values.provider === "rules") return;
    const cleared = clearBrowserAiCredential(values.provider);
    if (!cleared) {
      setFormError("浏览器存储不可用，未能清除密钥。");
      return;
    }

    setApiKey("");
    setBrowserConfiguredProviders((current) => {
      const next = new Set(current);
      next.delete(values.provider);
      return next;
    });
    setMessage("已从当前浏览器清除该接口密钥。");
    setFormError(null);
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    if (values.provider !== "rules" && !values.model.trim()) {
      setFieldErrors({ model: "请填写模型 ID。" });
      return;
    }
    if (values.provider !== "rules" && !apiKey.trim() && !selectedOption?.configured) {
      setFormError("该接口没有服务端密钥，请填写 API 密钥后再保存。");
      return;
    }
    if (values.provider !== "rules" && apiKey.trim() && !baseUrl.trim()) {
      setFormError("请填写 API 基础地址。");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/settings/ai", {
        body: JSON.stringify({
          ...values,
          model: values.model.trim(),
          uses_browser_key: values.provider !== "rules" && Boolean(apiKey.trim())
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH"
      });
      const result = (await response.json()) as SettingsResponse;

      if (!response.ok || !result.setting) {
        setFieldErrors(result.errors ?? {});
        setFormError(result.message ?? "AI 接口设置保存失败，请稍后重试。");
        return;
      }

      let credential: BrowserAiCredential | undefined;
      if (values.provider !== "rules" && apiKey.trim()) {
        credential = {
          api_key: apiKey.trim(),
          base_url: baseUrl.trim().replace(/\/+$/, ""),
          model: values.model.trim(),
          provider: values.provider
        };
      }
      if (!saveBrowserAiSelection(values.provider, credential)) {
        setFormError("接口选择已保存，但当前浏览器阻止了密钥存储。");
        return;
      }

      if (credential) {
        setBrowserConfiguredProviders((current) => new Set(current).add(credential.provider));
      }
      setSavedSetting(result.setting);
      setValues(result.setting);
      setMessage(credential ? "接口设置已保存，API 密钥已写入当前浏览器。" : result.message ?? "AI 接口设置已保存。");
    } catch {
      setFormError("网络连接异常，请稍后重试。");
    } finally {
      setIsSaving(false);
    }
  }

  function providerStatus(provider: AiProviderOption) {
    if (provider.value !== "rules" && browserConfiguredProviders.has(provider.value)) {
      return { label: "浏览器已保存", variant: "warning" as const };
    }
    if (provider.configured) return { label: provider.value === "rules" ? "可用" : "服务端可用", variant: "success" as const };
    return { label: "需要密钥", variant: "neutral" as const };
  }

  return (
    <form className="grid gap-6" onSubmit={saveSettings}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {providers.map((provider) => {
          const status = providerStatus(provider);
          return (
            <button
              aria-pressed={values.provider === provider.value}
              className={`min-h-36 rounded-2xl border p-4 text-left transition ${
                values.provider === provider.value
                  ? "border-teal-500 bg-teal-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
              key={provider.value}
              onClick={() => changeProvider(provider.value)}
              type="button"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-slate-950">{provider.label}</span>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-600">{provider.description}</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="ai_provider">AI 接口</label>
          <Select
            id="ai_provider"
            onChange={(event) => changeProvider(event.target.value as AiProviderSetting["provider"])}
            value={values.provider}
          >
            {providers.map((provider) => (
              <option key={provider.value} value={provider.value}>{provider.label}</option>
            ))}
          </Select>
          {fieldErrors.provider ? <ErrorMessage>{fieldErrors.provider}</ErrorMessage> : null}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="ai_model">模型 ID</label>
          <Input
            disabled={values.provider === "rules" || isSaving}
            id="ai_model"
            onChange={(event) => {
              setValues((current) => ({ ...current, model: event.target.value }));
              setFieldErrors((current) => ({ ...current, model: undefined }));
            }}
            placeholder={values.provider === "rules" ? "内置规则无需模型" : selectedOption?.default_model || "请输入模型 ID"}
            value={values.model}
          />
          {fieldErrors.model ? <ErrorMessage>{fieldErrors.model}</ErrorMessage> : null}
        </div>

        {values.provider === "rules" ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800 md:col-span-2">
            内置规则诊断无需外部 API 密钥，也不会发送记录内容到第三方模型服务。
          </div>
        ) : (
          <>
            <div className="grid gap-2 md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="ai_api_key">API 密钥</label>
                <div className="flex items-center gap-2">
                  <Button onClick={() => setShowApiKey((current) => !current)} size="sm" type="button" variant="ghost">
                    {showApiKey ? "隐藏" : "显示"}
                  </Button>
                  {apiKey ? (
                    <Button onClick={clearCurrentBrowserKey} size="sm" type="button" variant="ghost">清除本机密钥</Button>
                  ) : null}
                </div>
              </div>
              <Input
                autoComplete="off"
                disabled={isSaving}
                id="ai_api_key"
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="仅保存在当前浏览器，不会写入数据库"
                spellCheck={false}
                type={showApiKey ? "text" : "password"}
                value={apiKey}
              />
            </div>

            <div className="grid gap-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="ai_base_url">API 基础地址</label>
              <Input
                disabled={isSaving || values.provider !== "compatible"}
                id="ai_base_url"
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder={selectedOption?.default_base_url || "https://api.example.com/v1"}
                spellCheck={false}
                type="url"
                value={baseUrl}
              />
              <p className="text-xs leading-5 text-slate-500">
                DeepSeek、OpenAI 和 OpenRouter 固定使用官方 HTTPS 地址；自定义兼容接口可填写公开可访问的 HTTPS 地址。
              </p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 md:col-span-2">
              浏览器密钥会以明文保存在 localStorage 中，同一站点内运行的脚本可能读取它。仅在受信任的个人设备上使用，并在共享设备上及时清除。
            </div>
          </>
        )}
      </div>

      <div aria-live="polite">
        {formError ? <ErrorMessage>{formError}</ErrorMessage> : null}
        {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
      </div>

      <div className="flex justify-end border-t border-slate-200 pt-5">
        <Button className="w-full sm:w-auto" disabled={isSaving} type="submit">
          {isSaving ? "保存中..." : "保存接口设置"}
        </Button>
      </div>
    </form>
  );
}
