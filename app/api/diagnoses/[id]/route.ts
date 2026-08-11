import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { updateDiagnosis } from "../../../../lib/diagnoses/data";
import { validateDiagnosisInput } from "../../../../lib/diagnoses/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
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
  const validation = validateDiagnosisInput(payload as Record<string, unknown>);
  if (!validation.ok) {
    return NextResponse.json({ errors: validation.errors, message: "请检查诊断字段后再保存。" }, { status: 400 });
  }

  try {
    const diagnosis = await updateDiagnosis(user.userId, (await context.params).id, validation.data);
    if (!diagnosis) return NextResponse.json({ message: "未找到诊断结果。" }, { status: 404 });
    return NextResponse.json(diagnosis);
  } catch {
    return NextResponse.json({ message: "保存诊断结果失败，请稍后重试。" }, { status: 500 });
  }
}
