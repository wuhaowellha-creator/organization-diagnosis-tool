import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { generateAndSaveSummaryReport } from "../../../../lib/reports/data";
import { validateReportSummaryInput } from "../../../../lib/reports/validation";

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
  const validation = validateReportSummaryInput(payload as Record<string, unknown>);
  if (!validation.ok) {
    return NextResponse.json({ errors: validation.errors, message: "请检查报告时间范围。" }, { status: 400 });
  }

  try {
    const result = await generateAndSaveSummaryReport(user.userId, validation.data);
    return result.empty
      ? NextResponse.json({ empty: true, message: result.message })
      : NextResponse.json({ empty: false, report: result.report });
  } catch {
    return NextResponse.json({ message: "生成报告失败，请稍后重试。" }, { status: 500 });
  }
}
