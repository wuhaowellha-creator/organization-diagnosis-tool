import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../db";
import { followUpItems } from "../../db/schema";
import { getWorkRecord } from "../work-records/data";
import type { FollowUpInput } from "./validation";
import {
  type FollowUpDetail,
  type FollowUpListItem,
  readRiskTypes
} from "./presentation";

export type { FollowUpDetail, FollowUpListItem, FollowUpRiskLevel } from "./presentation";
export { followUpRiskLevelLabels, formatFollowUpCreatedAt, formatRiskTypes } from "./presentation";

type FollowUpRow = typeof followUpItems.$inferSelect;

function toListItem(row: FollowUpRow): FollowUpListItem {
  return {
    created_at: row.createdAt,
    id: row.id,
    risk_level: row.riskLevel,
    status: row.status,
    subject_name: row.subjectName,
    team_name: row.teamName,
    title: row.title,
    updated_at: row.updatedAt
  };
}

function toDetail(row: FollowUpRow): FollowUpDetail {
  return {
    ...toListItem(row),
    ai_diagnosis_id: row.aiDiagnosisId,
    problem_description: row.problemDescription,
    review_result: row.reviewResult,
    risk_types: readRiskTypes(row.riskTypes),
    suggested_actions: row.suggestedActions,
    work_record_id: row.workRecordId
  };
}

export async function listFollowUps(userId: string): Promise<FollowUpListItem[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(followUpItems)
    .where(eq(followUpItems.userId, userId))
    .orderBy(desc(followUpItems.updatedAt));
  return rows.map(toListItem);
}

export async function getFollowUp(userId: string, followUpId: string): Promise<FollowUpDetail | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(followUpItems)
    .where(and(eq(followUpItems.id, followUpId), eq(followUpItems.userId, userId)))
    .limit(1);
  return row ? toDetail(row) : null;
}

export async function updateFollowUp(userId: string, followUpId: string, input: FollowUpInput) {
  const db = getDb();
  const rows = await db
    .update(followUpItems)
    .set({
      problemDescription: input.problem_description,
      reviewResult: input.review_result,
      status: input.status,
      suggestedActions: input.suggested_actions,
      title: input.title,
      updatedAt: new Date().toISOString()
    })
    .where(and(eq(followUpItems.id, followUpId), eq(followUpItems.userId, userId)))
    .returning({ id: followUpItems.id });
  return rows[0] ?? null;
}

export async function createFollowUpFromRecord(userId: string, recordId: string, title: string) {
  const record = await getWorkRecord(userId, recordId);

  if (!record) {
    return { message: "未找到工作记录。", ok: false as const, status: 404 };
  }
  if (!record.diagnosis.diagnosis_id || !record.diagnosis.form_values) {
    return { message: "该工作记录尚未生成 AI 诊断，不能创建跟进事项。", ok: false as const, status: 400 };
  }
  if (record.diagnosis.status !== "confirmed") {
    return { message: "AI 诊断尚未人工确认，不能创建跟进事项。", ok: false as const, status: 400 };
  }
  if (record.diagnosis.risk_level !== "medium" && record.diagnosis.risk_level !== "high") {
    return { message: "低风险诊断不创建跟进事项。", ok: false as const, status: 400 };
  }

  const db = getDb();
  const [existing] = await db
    .select({ id: followUpItems.id })
    .from(followUpItems)
    .where(
      and(
        eq(followUpItems.userId, userId),
        eq(followUpItems.aiDiagnosisId, record.diagnosis.diagnosis_id)
      )
    )
    .limit(1);

  if (existing) return { id: existing.id, ok: true as const, existed: true as const };

  const diagnosis = record.diagnosis.form_values;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.insert(followUpItems).values({
    id,
    userId,
    aiDiagnosisId: record.diagnosis.diagnosis_id,
    workRecordId: record.id,
    problemDescription: diagnosis.core_issue || diagnosis.summary,
    reviewResult: "",
    riskLevel: record.diagnosis.risk_level,
    riskTypes: diagnosis.risk_types,
    status: "not_started",
    subjectName: record.subject_name,
    suggestedActions: diagnosis.suggested_actions,
    teamName: record.team_name,
    title,
    createdAt: now,
    updatedAt: now
  });

  return { id, ok: true as const, existed: false as const };
}
