import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../chatgpt-auth";
import { createWorkRecord, listWorkRecords } from "../../../lib/work-records/data";
import { validateWorkRecordInput } from "../../../lib/work-records/validation";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ message: "请先使用 ChatGPT 账号登录。" }, { status: 401 });

  try {
    return NextResponse.json({ records: await listWorkRecords(user.userId) });
  } catch {
    return NextResponse.json({ message: "读取工作记录失败，请稍后重试。" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
    return NextResponse.json(await createWorkRecord(user.userId, validation.data), { status: 201 });
  } catch {
    return NextResponse.json({ message: "保存工作记录失败，请稍后重试。" }, { status: 500 });
  }
}
