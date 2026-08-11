import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { getWorkRecord, updateWorkRecord } from "../../../../lib/work-records/data";
import { validateWorkRecordInput } from "../../../../lib/work-records/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ message: "请先使用 ChatGPT 账号登录。" }, { status: 401 });

  try {
    const record = await getWorkRecord(user.userId, (await context.params).id);
    if (!record) return NextResponse.json({ message: "未找到工作记录。" }, { status: 404 });
    return NextResponse.json({ record });
  } catch {
    return NextResponse.json({ message: "读取工作记录失败，请稍后重试。" }, { status: 500 });
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
  const validation = validateWorkRecordInput(payload as Record<string, unknown>);
  if (!validation.ok) {
    return NextResponse.json({ errors: validation.errors, message: "请先补全必填字段。" }, { status: 400 });
  }

  try {
    const record = await updateWorkRecord(user.userId, (await context.params).id, validation.data);
    if (!record) return NextResponse.json({ message: "未找到工作记录。" }, { status: 404 });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ message: "保存工作记录失败，请稍后重试。" }, { status: 500 });
  }
}
