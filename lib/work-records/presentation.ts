import type { DiagnosisFormValues } from "../diagnoses/structure";
import type { RecordType } from "./validation";

export type DiagnosisStatus = "not_diagnosed" | "pending_confirmation" | "confirmed";
export type RiskLevel = "low" | "medium" | "high";

export type DiagnosisPreview = {
  form_values: DiagnosisFormValues | null;
  diagnosis_id: string | null;
  risk_level: RiskLevel | null;
  status: DiagnosisStatus;
};

export type WorkRecordListItem = {
  content: string;
  created_at: string;
  diagnosis: DiagnosisPreview;
  id: string;
  record_type: RecordType;
  subject_name: string;
  team_name: string;
  updated_at: string;
};

export type WorkRecordDetail = WorkRecordListItem;

export const diagnosisStatusLabels: Record<DiagnosisStatus, string> = {
  confirmed: "已确认",
  not_diagnosed: "未诊断",
  pending_confirmation: "待确认"
};

export const riskLevelLabels: Record<RiskLevel, string> = {
  high: "高",
  low: "低",
  medium: "中"
};

export function formatDateTime(value: string) {
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeZone: "Asia/Shanghai",
    timeStyle: "short"
  }).format(new Date(normalized));
}
