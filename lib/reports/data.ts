import { and, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { getDb } from "../../db";
import { aiDiagnoses, followUpItems, reportOutputs, workRecords } from "../../db/schema";
import { isRiskType, riskTypeLabels, type DiagnosisFormValues, type RiskType } from "../diagnoses/structure";
import { followUpRiskLevelLabels, type FollowUpRiskLevel } from "../follow-ups/data";
import { followUpStatusLabels, type FollowUpStatus } from "../follow-ups/validation";
import { riskLevelLabels, type RiskLevel } from "../work-records/presentation";
import { getDateRangeBounds, type ReportSummaryInput } from "./validation";
import type { RecentReportOutput } from "./presentation";

export type { RecentReportOutput } from "./presentation";
export { formatReportCreatedAt } from "./presentation";

type WorkRecordRef = { id: string; subject_name: string; team_name: string };
type DiagnosisReportItem = {
  core_issue: string;
  diagnosis_id: string;
  possible_reason: string;
  risk_level: RiskLevel;
  risk_types: RiskType[];
  subject_name: string;
  suggested_actions: string;
  summary: string;
  team_name: string;
};
type FollowUpReportItem = {
  ai_diagnosis_id: string;
  problem_description: string;
  review_result: string;
  risk_level: FollowUpRiskLevel;
  risk_types: RiskType[];
  status: FollowUpStatus;
  subject_name: string;
  suggested_actions: string;
  team_name: string;
  title: string;
};
type ReportSourceData = { diagnoses: DiagnosisReportItem[]; followUps: FollowUpReportItem[] };

function readStructuredString(value: DiagnosisFormValues, key: keyof DiagnosisFormValues) {
  const fieldValue = value[key];
  return typeof fieldValue === "string" ? fieldValue : "";
}

function readRiskTypes(value: unknown): RiskType[] {
  if (!Array.isArray(value)) return [];
  return value.filter((riskType): riskType is RiskType => isRiskType(riskType));
}

function formatRiskTypes(riskTypes: RiskType[]) {
  return riskTypes.length === 0 ? "未标注" : riskTypes.map((riskType) => riskTypeLabels[riskType]).join("、");
}

function formatTextList(items: string[]) {
  return items.length === 0 ? "无。" : items.map((item) => `- ${item}`).join("\n");
}

function withSentenceEnd(value: string) {
  const text = value.trim();

  if (!text) return text;
  return /[。！？.!?]$/.test(text) ? text : `${text}。`;
}

function formatDiagnosisSubject(item: DiagnosisReportItem) {
  return `${item.subject_name} / ${item.team_name}`;
}

function formatFollowUpSubject(item: FollowUpReportItem) {
  return `${item.title}（${item.subject_name} / ${item.team_name}）`;
}

function buildNextPlan(data: ReportSourceData) {
  const openFollowUps = data.followUps.filter((followUp) => followUp.status !== "resolved");
  if (openFollowUps.length > 0) {
    return openFollowUps.map(
      (followUp) =>
        `${formatFollowUpSubject(followUp)}：按“${followUpStatusLabels[followUp.status]}”状态继续推进，下一步聚焦 ${withSentenceEnd(followUp.suggested_actions || "补充具体跟进动作")}`
    );
  }
  return data.diagnoses.map(
    (diagnosis) =>
      `${formatDiagnosisSubject(diagnosis)}：围绕“${diagnosis.core_issue || diagnosis.summary}”安排下一轮沟通和观察，确认风险变化后再决定是否转入跟进事项。`
  );
}

function buildReportContent(input: ReportSummaryInput, data: ReportSourceData) {
  const followedDiagnosisIds = new Set(data.followUps.map((item) => item.ai_diagnosis_id));
  const diagnosesWithoutFollowUp = data.diagnoses.filter(
    (item) => !followedDiagnosisIds.has(item.diagnosis_id)
  );
  const highCount =
    diagnosesWithoutFollowUp.filter((item) => item.risk_level === "high").length +
    data.followUps.filter((item) => item.risk_level === "high").length;
  const mediumCount =
    diagnosesWithoutFollowUp.filter((item) => item.risk_level === "medium").length +
    data.followUps.filter((item) => item.risk_level === "medium").length;
  const lowCount = diagnosesWithoutFollowUp.filter((item) => item.risk_level === "low").length;

  const focusItems = [
    ...diagnosesWithoutFollowUp.map((item) => `${formatDiagnosisSubject(item)}：${item.core_issue || item.summary}`),
    ...data.followUps.map((item) => `${formatFollowUpSubject(item)}：${item.problem_description}`)
  ];
  const riskItems = [
    `高风险 ${highCount} 项，中风险 ${mediumCount} 项，低风险 ${lowCount} 项。`,
    ...diagnosesWithoutFollowUp.map(
      (item) =>
        `${formatDiagnosisSubject(item)}：${riskLevelLabels[item.risk_level]}风险，类型：${formatRiskTypes(item.risk_types)}。`
    ),
    ...data.followUps.map(
      (item) =>
        `${formatFollowUpSubject(item)}：${followUpRiskLevelLabels[item.risk_level]}风险，当前状态：${followUpStatusLabels[item.status]}。`
    )
  ];
  const actionItems = [
    ...diagnosesWithoutFollowUp.map(
      (item) => `${formatDiagnosisSubject(item)}：${item.suggested_actions || "需补充建议动作"}`
    ),
    ...data.followUps.map(
      (item) => `${formatFollowUpSubject(item)}：${item.suggested_actions || "需补充建议动作"}`
    )
  ];
  const followUpItemsText = data.followUps.map(
    (item) =>
      `${formatFollowUpSubject(item)}：${followUpStatusLabels[item.status]}；复盘结果：${withSentenceEnd(item.review_result || "暂无复盘结果")}`
  );

  return [
    "诊断摘要报告",
    `时间范围：${input.start_date} 至 ${input.end_date}`,
    "",
    "一、本次重点问题",
    formatTextList(focusItems),
    "",
    "二、风险判断",
    formatTextList(riskItems),
    "",
    "三、建议动作",
    formatTextList(actionItems),
    "",
    "四、当前跟进状态",
    formatTextList(followUpItemsText),
    "",
    "五、下一步计划",
    formatTextList(buildNextPlan(data))
  ].join("\n");
}

async function loadReportSourceData(userId: string, input: ReportSummaryInput): Promise<ReportSourceData> {
  const db = getDb();
  const bounds = getDateRangeBounds(input);
  const diagnoses = await db
    .select()
    .from(aiDiagnoses)
    .where(
      and(
        eq(aiDiagnoses.userId, userId),
        eq(aiDiagnoses.confirmedByUser, true),
        gte(aiDiagnoses.confirmedAt, bounds.start),
        lt(aiDiagnoses.confirmedAt, bounds.endExclusive)
      )
    )
    .orderBy(desc(aiDiagnoses.confirmedAt));

  let workRecordRefs: WorkRecordRef[] = [];
  if (diagnoses.length > 0) {
    const rows = await db
      .select({ id: workRecords.id, subject_name: workRecords.subjectName, team_name: workRecords.teamName })
      .from(workRecords)
      .where(
        and(
          eq(workRecords.userId, userId),
          inArray(
            workRecords.id,
            diagnoses.map((diagnosis) => diagnosis.workRecordId)
          )
        )
      );
    workRecordRefs = rows;
  }
  const workRecordMap = new Map(workRecordRefs.map((record) => [record.id, record]));

  const followUps = await db
    .select()
    .from(followUpItems)
    .where(
      and(
        eq(followUpItems.userId, userId),
        gte(followUpItems.createdAt, bounds.start),
        lt(followUpItems.createdAt, bounds.endExclusive)
      )
    )
    .orderBy(desc(followUpItems.createdAt));

  return {
    diagnoses: diagnoses.map((diagnosis) => {
      const record = workRecordMap.get(diagnosis.workRecordId);
      return {
        core_issue: readStructuredString(diagnosis.structuredResult, "core_issue"),
        diagnosis_id: diagnosis.id,
        possible_reason:
          readStructuredString(diagnosis.structuredResult, "possible_reason") || diagnosis.reasoning,
        risk_level: diagnosis.riskLevel,
        risk_types: readRiskTypes(diagnosis.structuredResult.risk_types),
        subject_name: record?.subject_name ?? "未记录对象",
        suggested_actions:
          readStructuredString(diagnosis.structuredResult, "suggested_actions") || diagnosis.suggestedActions,
        summary: readStructuredString(diagnosis.structuredResult, "summary") || diagnosis.summary,
        team_name: record?.team_name ?? "未记录团队"
      };
    }),
    followUps: followUps.map((followUp) => ({
      ai_diagnosis_id: followUp.aiDiagnosisId,
      problem_description: followUp.problemDescription,
      review_result: followUp.reviewResult,
      risk_level: followUp.riskLevel,
      risk_types: readRiskTypes(followUp.riskTypes),
      status: followUp.status,
      subject_name: followUp.subjectName,
      suggested_actions: followUp.suggestedActions,
      team_name: followUp.teamName,
      title: followUp.title
    }))
  };
}

function toRecentReport(row: typeof reportOutputs.$inferSelect): RecentReportOutput {
  return {
    content: row.content,
    created_at: row.createdAt,
    id: row.id,
    source_end_date: row.sourceEndDate,
    source_start_date: row.sourceStartDate,
    title: row.title
  };
}

export async function listRecentReports(userId: string): Promise<RecentReportOutput[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(reportOutputs)
    .where(and(eq(reportOutputs.userId, userId), eq(reportOutputs.reportType, "diagnosis_summary")))
    .orderBy(desc(reportOutputs.createdAt))
    .limit(50);
  return rows.map(toRecentReport);
}

export async function generateAndSaveSummaryReport(userId: string, input: ReportSummaryInput) {
  const sourceData = await loadReportSourceData(userId, input);
  if (sourceData.diagnoses.length === 0 && sourceData.followUps.length === 0) {
    return { empty: true as const, message: "当前时间范围暂无可生成内容。" };
  }

  const content = buildReportContent(input, sourceData);
  const title = `诊断摘要 ${input.start_date} 至 ${input.end_date}`;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const db = getDb();
  const [row] = await db
    .insert(reportOutputs)
    .values({
      id,
      userId,
      content,
      metadata: {
        confirmed_diagnosis_count: sourceData.diagnoses.length,
        follow_up_count: sourceData.followUps.length
      },
      reportType: "diagnosis_summary",
      sourceEndDate: input.end_date,
      sourceStartDate: input.start_date,
      title,
      createdAt: now,
      updatedAt: now
    })
    .returning();

  return { empty: false as const, report: toRecentReport(row) };
}
