import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { getFollowUp, updateFollowUp } from "../../../../lib/follow-ups/data";
import { validateFollowUpInput } from "../../../../lib/follow-ups/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ message: "请先使用 ChatGPT 账号登录。" }, { status: 401 });

  try {
    const followUp = await getFollowUp(user.userId, (await context.params).id);
    if (!followUp) return NextResponse.json({ message: "未找到跟进事项。" }, { status: 404 });
    return NextResponse.json({ followUp });
  } catch {
    return NextResponse.json({ message: "读取跟进事项失败，请稍后重试。" }, { status: 500 });
  }
}

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
  const validation = validateFollowUpInput(payload as Record<string, unknown>);
  if (!validation.ok) {
    return NextResponse.json({ errors: validation.errors, message: "请检查跟进事项字段后再保存。" }, { status: 400 });
  }

  try {
    const followUp = await updateFollowUp(user.userId, (await context.params).id, validation.data);
    if (!followUp) return NextResponse.json({ message: "未找到跟进事项。" }, { status: 404 });
    return NextResponse.json(followUp);
  } catch {
    return NextResponse.json({ message: "保存跟进事项失败，请稍后重试。" }, { status: 500 });
  }
}
