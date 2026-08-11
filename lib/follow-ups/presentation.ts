import { isRiskType, riskTypeLabels, type RiskType } from "../diagnoses/structure";
import { formatDateTime } from "../work-records/presentation";
import type { FollowUpStatus } from "./validation";

export type FollowUpRiskLevel = "medium" | "high";

export type FollowUpListItem = {
  created_at: string;
  id: string;
  risk_level: FollowUpRiskLevel;
  status: FollowUpStatus;
  subject_name: string;
  team_name: string;
  title: string;
  updated_at: string;
};

export type FollowUpDetail = FollowUpListItem & {
  ai_diagnosis_id: string;
  problem_description: string;
  review_result: string;
  risk_types: RiskType[];
  suggested_actions: string;
  work_record_id: string;
};

export const followUpRiskLevelLabels: Record<FollowUpRiskLevel, string> = {
  high: "高",
  medium: "中"
};

export function readRiskTypes(value: unknown): RiskType[] {
  if (!Array.isArray(value)) return [];
  return value.filter((riskType): riskType is RiskType => isRiskType(riskType));
}

export function formatFollowUpCreatedAt(value: string) {
  return formatDateTime(value);
}

export function formatRiskTypes(riskTypes: RiskType[]) {
  if (riskTypes.length === 0) return "未标注";
  return riskTypes.map((riskType) => riskTypeLabels[riskType]).join("、");
}
