import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import type { DiagnosisFormValues, RiskType } from "../lib/diagnoses/structure";

export const aiProviders = ["rules", "deepseek", "openai", "openrouter", "compatible"] as const;
export type AiProvider = (typeof aiProviders)[number];

export const aiProviderSettings = sqliteTable("ai_provider_settings", {
  userId: text("user_id").primaryKey(),
  provider: text("provider", { enum: aiProviders }).notNull().default("rules"),
  model: text("model").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const workRecords = sqliteTable(
  "work_records",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    recordType: text("record_type", {
      enum: ["employee_interview", "manager_feedback", "team_observation"]
    }).notNull(),
    subjectName: text("subject_name").notNull(),
    teamName: text("team_name").notNull(),
    content: text("content").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => [index("work_records_user_created_idx").on(table.userId, table.createdAt)]
);

export const aiDiagnoses = sqliteTable(
  "ai_diagnoses",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    workRecordId: text("work_record_id")
      .notNull()
      .references(() => workRecords.id, { onDelete: "cascade" }),
    riskLevel: text("risk_level", { enum: ["low", "medium", "high"] }).notNull().default("medium"),
    summary: text("summary").notNull().default(""),
    reasoning: text("reasoning").notNull().default(""),
    suggestedActions: text("suggested_actions").notNull().default(""),
    structuredResult: text("structured_result", { mode: "json" })
      .$type<DiagnosisFormValues>()
      .notNull(),
    confirmedByUser: integer("confirmed_by_user", { mode: "boolean" }).notNull().default(false),
    confirmedAt: text("confirmed_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => [
    uniqueIndex("ai_diagnoses_user_record_unique").on(table.userId, table.workRecordId),
    index("ai_diagnoses_user_confirmed_idx").on(table.userId, table.confirmedByUser, table.confirmedAt)
  ]
);

export const followUpItems = sqliteTable(
  "follow_up_items",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    workRecordId: text("work_record_id")
      .notNull()
      .references(() => workRecords.id, { onDelete: "cascade" }),
    aiDiagnosisId: text("ai_diagnosis_id")
      .notNull()
      .references(() => aiDiagnoses.id, { onDelete: "cascade" }),
    subjectName: text("subject_name").notNull().default(""),
    teamName: text("team_name").notNull().default(""),
    riskTypes: text("risk_types", { mode: "json" }).$type<RiskType[]>().notNull(),
    riskLevel: text("risk_level", { enum: ["medium", "high"] }).notNull(),
    title: text("title").notNull(),
    problemDescription: text("problem_description").notNull().default(""),
    suggestedActions: text("suggested_actions").notNull().default(""),
    reviewResult: text("review_result").notNull().default(""),
    status: text("status", {
      enum: ["not_started", "in_progress", "resolved", "under_observation"]
    })
      .notNull()
      .default("not_started"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => [
    uniqueIndex("follow_ups_user_diagnosis_unique").on(table.userId, table.aiDiagnosisId),
    index("follow_ups_user_status_idx").on(table.userId, table.status, table.updatedAt)
  ]
);

export const reportOutputs = sqliteTable(
  "report_outputs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    reportType: text("report_type", { enum: ["diagnosis_summary", "weekly_report"] })
      .notNull()
      .default("diagnosis_summary"),
    content: text("content").notNull(),
    sourceStartDate: text("source_start_date"),
    sourceEndDate: text("source_end_date"),
    metadata: text("metadata", { mode: "json" }).$type<Record<string, number>>().notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => [index("report_outputs_user_created_idx").on(table.userId, table.createdAt)]
);
