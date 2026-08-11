import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import { createFollowUpFromRecord } from "../../../../../lib/follow-ups/data";
import { validateFollowUpCreateInput } from "../../../../../lib/follow-ups/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
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
  const validation = validateFollowUpCreateInput(payload as Record<string, unknown>);
  if (!validation.ok) {
    return NextResponse.json({ errors: validation.errors, message: "请填写问题名称后再创建跟进事项。" }, { status: 400 });
  }

  try {
    const result = await createFollowUpFromRecord(user.userId, (await context.params).id, validation.data.title);
    if (!result.ok) return NextResponse.json({ message: result.message }, { status: result.status });
    return NextResponse.json({ id: result.id, existed: result.existed }, { status: result.existed ? 200 : 201 });
  } catch {
    return NextResponse.json({ message: "创建跟进事项失败，请稍后重试。" }, { status: 500 });
  }
}
