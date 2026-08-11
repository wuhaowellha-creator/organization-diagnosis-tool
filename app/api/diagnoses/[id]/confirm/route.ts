import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import { confirmDiagnosis } from "../../../../../lib/diagnoses/data";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ message: "请先使用 ChatGPT 账号登录。" }, { status: 401 });

  try {
    const diagnosis = await confirmDiagnosis(user.userId, (await context.params).id);
    if (!diagnosis) return NextResponse.json({ message: "未找到诊断结果。" }, { status: 404 });
    return NextResponse.json(diagnosis);
  } catch {
    return NextResponse.json({ message: "确认诊断结果失败，请稍后重试。" }, { status: 500 });
  }
}
