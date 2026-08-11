import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import { generateDiagnosis } from "../../../../../lib/ai/client";
import { getAiProviderSetting } from "../../../../../lib/ai/settings";
import { validateBrowserAiProviderConfig } from "../../../../../lib/ai/validation";
import { saveGeneratedDiagnosis } from "../../../../../lib/diagnoses/data";
import { validateGeneratedDiagnosis } from "../../../../../lib/diagnoses/safety";
import { getWorkRecord } from "../../../../../lib/work-records/data";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ message: "请先使用 ChatGPT 账号登录。" }, { status: 401 });

  try {
    const record = await getWorkRecord(user.userId, (await context.params).id);
    if (!record) return NextResponse.json({ message: "未找到工作记录。" }, { status: 404 });

    let browserCredential = null;
    if ((request.headers.get("content-type") ?? "").includes("application/json")) {
      let payload: { provider_config?: unknown };
      try {
        payload = await request.json() as { provider_config?: unknown };
      } catch {
        return NextResponse.json({ message: "请求内容不是有效的 JSON。" }, { status: 400 });
      }
      if (payload.provider_config !== undefined) {
        const browserValidation = validateBrowserAiProviderConfig(payload.provider_config);
        if (!browserValidation.ok) {
          return NextResponse.json({ message: browserValidation.message }, { status: 400 });
        }
        browserCredential = browserValidation.data;
      }
    }

    const aiSetting = browserCredential
      ? { model: browserCredential.model, provider: browserCredential.provider }
      : await getAiProviderSetting(user.userId);
    const generated = await generateDiagnosis(
      {
        content: record.content,
        record_type: record.record_type,
        subject_name: record.subject_name,
        team_name: record.team_name
      },
      { ...aiSetting, browserCredential }
    );
    const validation = validateGeneratedDiagnosis(generated.output);
    if (!validation.ok) return NextResponse.json({ message: validation.message }, { status: 502 });

    const diagnosis = await saveGeneratedDiagnosis(user.userId, record.id, validation.data);
    return NextResponse.json({
      diagnosis,
      message: generated.usedFallback
        ? "所选 AI 接口未配置或调用失败，已使用内置规则生成诊断；请检查并人工确认。"
        : "辅助诊断已生成，请检查并人工确认后再进入后续流程。",
      provider: generated.provider,
      used_fallback: generated.usedFallback
    });
  } catch {
    return NextResponse.json({ message: "诊断生成失败，请稍后重试。" }, { status: 500 });
  }
}
