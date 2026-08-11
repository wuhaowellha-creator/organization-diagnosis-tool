import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { getAiProviderOptions } from "../../../../lib/ai/providers";
import { getAiProviderSetting, saveAiProviderSetting } from "../../../../lib/ai/settings";
import { validateAiProviderSetting } from "../../../../lib/ai/validation";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ message: "请先使用 ChatGPT 账号登录。" }, { status: 401 });

  try {
    return NextResponse.json({
      providers: getAiProviderOptions(),
      setting: await getAiProviderSetting(user.userId)
    });
  } catch {
    return NextResponse.json({ message: "AI 接口设置读取失败，请稍后重试。" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ message: "请先使用 ChatGPT 账号登录。" }, { status: 401 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "请求内容不是有效的 JSON。" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ message: "请求内容格式不正确。" }, { status: 400 });
  }

  const validation = validateAiProviderSetting(payload as Record<string, unknown>);
  if (!validation.ok) {
    return NextResponse.json(
      { errors: validation.errors, message: "请检查 AI 接口设置。" },
      { status: 400 }
    );
  }

  const selectedOption = getAiProviderOptions().find((option) => option.value === validation.data.provider);
  const usesBrowserKey = (payload as { uses_browser_key?: unknown }).uses_browser_key === true;
  if (!selectedOption?.configured && !usesBrowserKey) {
    return NextResponse.json(
      { errors: { provider: "该接口尚未在站点环境中配置密钥、地址或默认模型。" }, message: "该 AI 接口尚未配置。" },
      { status: 400 }
    );
  }

  try {
    const setting = await saveAiProviderSetting(user.userId, validation.data);
    return NextResponse.json({ message: "AI 接口设置已保存。", setting });
  } catch {
    return NextResponse.json({ message: "AI 接口设置保存失败，请稍后重试。" }, { status: 500 });
  }
}
