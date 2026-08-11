import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../db";
import { aiDiagnoses, workRecords } from "../../db/schema";
import type { RecordType, WorkRecordInput } from "./validation";
import {
  type DiagnosisPreview,
  type WorkRecordDetail,
  type WorkRecordListItem
} from "./presentation";

export type { DiagnosisStatus, RiskLevel, WorkRecordDetail, WorkRecordListItem } from "./presentation";
export { diagnosisStatusLabels, formatDateTime, riskLevelLabels } from "./presentation";

type DiagnosisRow = typeof aiDiagnoses.$inferSelect;

function toDiagnosisPreview(diagnosis?: DiagnosisRow): DiagnosisPreview {
  if (!diagnosis) {
    return {
      form_values: null,
      diagnosis_id: null,
      risk_level: null,
      status: "not_diagnosed"
    };
  }

  return {
    form_values: diagnosis.structuredResult,
    diagnosis_id: diagnosis.id,
    risk_level: diagnosis.riskLevel,
    status: diagnosis.confirmedByUser ? "confirmed" : "pending_confirmation"
  };
}

function toWorkRecord(
  row: typeof workRecords.$inferSelect,
  diagnosis?: DiagnosisRow
): WorkRecordListItem {
  return {
    content: row.content,
    created_at: row.createdAt,
    diagnosis: toDiagnosisPreview(diagnosis),
    id: row.id,
    record_type: row.recordType,
    subject_name: row.subjectName,
    team_name: row.teamName,
    updated_at: row.updatedAt
  };
}

async function getLatestDiagnosesByRecordId(userId: string, recordIds: string[]) {
  if (recordIds.length === 0) return new Map<string, DiagnosisRow>();

  const db = getDb();
  const rows = await db
    .select()
    .from(aiDiagnoses)
    .where(and(eq(aiDiagnoses.userId, userId), inArray(aiDiagnoses.workRecordId, recordIds)))
    .orderBy(desc(aiDiagnoses.createdAt));

  return new Map(rows.map((diagnosis) => [diagnosis.workRecordId, diagnosis]));
}

export async function listWorkRecords(userId: string): Promise<WorkRecordListItem[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(workRecords)
    .where(eq(workRecords.userId, userId))
    .orderBy(desc(workRecords.createdAt));
  const diagnoses = await getLatestDiagnosesByRecordId(
    userId,
    rows.map((row) => row.id)
  );

  return rows.map((row) => toWorkRecord(row, diagnoses.get(row.id)));
}

export async function getWorkRecord(userId: string, recordId: string): Promise<WorkRecordDetail | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(workRecords)
    .where(and(eq(workRecords.id, recordId), eq(workRecords.userId, userId)))
    .limit(1);

  if (!row) return null;
  const diagnoses = await getLatestDiagnosesByRecordId(userId, [row.id]);
  return toWorkRecord(row, diagnoses.get(row.id));
}

export async function createWorkRecord(userId: string, input: WorkRecordInput) {
  const db = getDb();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await db.insert(workRecords).values({
    id,
    userId,
    recordType: input.record_type,
    subjectName: input.subject_name,
    teamName: input.team_name,
    content: input.content,
    createdAt: now,
    updatedAt: now
  });

  return { id };
}

export async function createWorkRecords(userId: string, inputs: WorkRecordInput[]) {
  if (inputs.length === 0) return { ids: [] };

  const db = getDb();
  const now = new Date().toISOString();
  const rows = inputs.map((input) => ({
    content: input.content,
    createdAt: now,
    id: crypto.randomUUID(),
    recordType: input.record_type,
    subjectName: input.subject_name,
    teamName: input.team_name,
    updatedAt: now,
    userId
  }));
  const statements = rows.map((row) => db.insert(workRecords).values(row));

  await db.batch(statements as [typeof statements[number], ...Array<typeof statements[number]>]);

  return { ids: rows.map((row) => row.id) };
}

export async function updateWorkRecord(userId: string, recordId: string, input: WorkRecordInput) {
  const db = getDb();
  const rows = await db
    .update(workRecords)
    .set({
      content: input.content,
      recordType: input.record_type,
      subjectName: input.subject_name,
      teamName: input.team_name,
      updatedAt: new Date().toISOString()
    })
    .where(and(eq(workRecords.id, recordId), eq(workRecords.userId, userId)))
    .returning({ id: workRecords.id });

  return rows[0] ?? null;
}
