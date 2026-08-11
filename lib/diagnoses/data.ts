import { and, eq } from "drizzle-orm";
import { getDb } from "../../db";
import { aiDiagnoses } from "../../db/schema";
import type { DiagnosisFormValues } from "./structure";

function diagnosisFields(diagnosis: DiagnosisFormValues) {
  return {
    confirmedAt: null,
    confirmedByUser: false,
    reasoning: diagnosis.possible_reason,
    riskLevel: diagnosis.risk_level,
    structuredResult: diagnosis,
    suggestedActions: diagnosis.suggested_actions,
    summary: diagnosis.summary,
    updatedAt: new Date().toISOString()
  };
}

export async function saveGeneratedDiagnosis(
  userId: string,
  workRecordId: string,
  diagnosis: DiagnosisFormValues
) {
  const db = getDb();
  const [existing] = await db
    .select({ id: aiDiagnoses.id })
    .from(aiDiagnoses)
    .where(and(eq(aiDiagnoses.userId, userId), eq(aiDiagnoses.workRecordId, workRecordId)))
    .limit(1);

  if (existing) {
    await db
      .update(aiDiagnoses)
      .set(diagnosisFields(diagnosis))
      .where(and(eq(aiDiagnoses.id, existing.id), eq(aiDiagnoses.userId, userId)));
    return existing;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.insert(aiDiagnoses).values({
    id,
    userId,
    workRecordId,
    ...diagnosisFields(diagnosis),
    createdAt: now,
    updatedAt: now
  });

  return { id };
}

export async function updateDiagnosis(userId: string, diagnosisId: string, diagnosis: DiagnosisFormValues) {
  const db = getDb();
  const rows = await db
    .update(aiDiagnoses)
    .set({
      reasoning: diagnosis.possible_reason,
      riskLevel: diagnosis.risk_level,
      structuredResult: diagnosis,
      suggestedActions: diagnosis.suggested_actions,
      summary: diagnosis.summary,
      updatedAt: new Date().toISOString()
    })
    .where(and(eq(aiDiagnoses.id, diagnosisId), eq(aiDiagnoses.userId, userId)))
    .returning({ id: aiDiagnoses.id });
  return rows[0] ?? null;
}

export async function confirmDiagnosis(userId: string, diagnosisId: string) {
  const db = getDb();
  const now = new Date().toISOString();
  const rows = await db
    .update(aiDiagnoses)
    .set({ confirmedAt: now, confirmedByUser: true, updatedAt: now })
    .where(and(eq(aiDiagnoses.id, diagnosisId), eq(aiDiagnoses.userId, userId)))
    .returning({ id: aiDiagnoses.id });
  return rows[0] ?? null;
}
