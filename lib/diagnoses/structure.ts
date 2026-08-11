import type { RiskLevel } from "../work-records/presentation";

export const riskTypes = [
  "resignation_risk",
  "performance_risk",
  "emotion_risk",
  "management_risk",
  "collaboration_risk",
  "key_position_risk"
] as const;

export type RiskType = (typeof riskTypes)[number];
export type EditableRiskLevel = "low" | "medium" | "high";

export type DiagnosisFormValues = {
  core_issue: string;
  possible_reason: string;
  risk_level: RiskLevel;
  risk_types: RiskType[];
  suggested_actions: string;
  summary: string;
};

export const riskTypeLabels: Record<RiskType, string> = {
  collaboration_risk: "协作风险",
  emotion_risk: "情绪风险",
  key_position_risk: "关键岗位风险",
  management_risk: "管理风险",
  performance_risk: "绩效风险",
  resignation_risk: "离职风险"
};

export const editableRiskLevelLabels: Record<RiskLevel, string> = {
  high: "高",
  low: "低",
  medium: "中"
};

export const emptyDiagnosisValues: DiagnosisFormValues = {
  core_issue: "",
  possible_reason: "",
  risk_level: "medium",
  risk_types: [],
  suggested_actions: "",
  summary: ""
};

export function isRiskType(value: unknown): value is RiskType {
  return typeof value === "string" && riskTypes.includes(value as RiskType);
}

export function isEditableRiskLevel(value: unknown): value is EditableRiskLevel {
  return value === "low" || value === "medium" || value === "high";
}
