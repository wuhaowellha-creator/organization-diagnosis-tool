import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../chatgpt-auth";
import { listFollowUps } from "../../../lib/follow-ups/data";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ message: "请先使用 ChatGPT 账号登录。" }, { status: 401 });

  try {
    return NextResponse.json({ followUps: await listFollowUps(user.userId) });
  } catch {
    return NextResponse.json({ message: "读取跟进事项失败，请稍后重试。" }, { status: 500 });
  }
}
