import {
  isEditableRiskLevel,
  isRiskType,
  type DiagnosisFormValues,
  type RiskType
} from "./structure";

export type DiagnosisInputErrors = Partial<Record<keyof DiagnosisFormValues, string>>;

type DiagnosisValidationResult =
  | {
      data: DiagnosisFormValues;
      ok: true;
    }
  | {
      errors: DiagnosisInputErrors;
      ok: false;
    };

function readString(payload: Record<string, unknown>, field: keyof DiagnosisFormValues) {
  const value = payload[field];

  return typeof value === "string" ? value.trim() : "";
}

function readRiskTypes(value: unknown): RiskType[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const uniqueRiskTypes = new Set<RiskType>();

  for (const item of value) {
    if (!isRiskType(item)) {
      return null;
    }

    uniqueRiskTypes.add(item);
  }

  return Array.from(uniqueRiskTypes);
}

export function validateDiagnosisInput(payload: Record<string, unknown>): DiagnosisValidationResult {
  const errors: DiagnosisInputErrors = {};
  const riskTypes = readRiskTypes(payload.risk_types);
  const riskLevel = isEditableRiskLevel(payload.risk_level) ? payload.risk_level : null;

  if (riskTypes === null) {
    errors.risk_types = "风险类型只能从固定范围中选择。";
  }

  if (riskLevel === null) {
    errors.risk_level = "风险等级只能选择低、中、高。";
  }

  if (riskTypes === null || riskLevel === null) {
    return {
      errors,
      ok: false
    };
  }

  return {
    data: {
      core_issue: readString(payload, "core_issue"),
      possible_reason: readString(payload, "possible_reason"),
      risk_level: riskLevel,
      risk_types: riskTypes,
      suggested_actions: readString(payload, "suggested_actions"),
      summary: readString(payload, "summary")
    },
    ok: true
  };
}
