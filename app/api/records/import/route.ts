import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { createWorkRecords } from "../../../../lib/work-records/data";
import { workRecordImportLimit } from "../../../../lib/work-records/import";
import { validateWorkRecordInput, type WorkRecordInput } from "../../../../lib/work-records/validation";

type RowError = {
  errors: Partial<Record<keyof WorkRecordInput, string>>;
  row: number;
};

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

  const records = (payload as { records?: unknown }).records;
  if (!Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ message: "请至少提供一条工作记录。" }, { status: 400 });
  }
  if (records.length > workRecordImportLimit) {
    return NextResponse.json(
      { message: `单次最多导入 ${workRecordImportLimit} 条工作记录。` },
      { status: 400 }
    );
  }

  const validRecords: WorkRecordInput[] = [];
  const rowErrors: RowError[] = [];
  records.forEach((record, index) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      rowErrors.push({ errors: { content: "记录格式不正确。" }, row: index + 2 });
      return;
    }

    const validation = validateWorkRecordInput(record as Record<string, unknown>);
    if (!validation.ok) {
      rowErrors.push({ errors: validation.errors, row: index + 2 });
      return;
    }
    validRecords.push(validation.data);
  });

  if (rowErrors.length > 0) {
    return NextResponse.json(
      { message: "部分记录未通过校验，请修正后重新导入。", row_errors: rowErrors },
      { status: 400 }
    );
  }

  try {
    const result = await createWorkRecords(user.userId, validRecords);
    return NextResponse.json(
      { ids: result.ids, imported_count: result.ids.length, message: `已导入 ${result.ids.length} 条工作记录。` },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ message: "批量导入失败，请稍后重试。" }, { status: 500 });
  }
}
