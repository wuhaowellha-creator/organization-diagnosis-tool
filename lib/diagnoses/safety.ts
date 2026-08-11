import type { DiagnosisFormValues } from "./structure";
import { validateDiagnosisInput } from "./validation";

type DiagnosisSafetyResult =
  | {
      data: DiagnosisFormValues;
      ok: true;
    }
  | {
      message: string;
      ok: false;
    };

const forbiddenTerms = [
  "辞退",
  "淘汰",
  "解除劳动合同",
  "开除",
  "裁员",
  "心理诊断",
  "法律裁决",
  "违法",
  "人格障碍",
  "抑郁症",
  "焦虑症",
  "懒惰",
  "不忠诚",
  "玻璃心",
  "难搞",
  "问题员工"
];

const genericActionPhrases = new Set(["加强沟通", "持续关注", "提高重视", "优化管理"]);

function normalizeAction(value: string) {
  return value.replace(/^[\d.\-、\s]+/, "").replace(/[。；;，,\s]/g, "");
}

function hasForbiddenTerms(diagnosis: DiagnosisFormValues) {
  const combinedText = [
    diagnosis.summary,
    diagnosis.core_issue,
    diagnosis.possible_reason,
    diagnosis.suggested_actions
  ].join("\n");

  return forbiddenTerms.some((term) => combinedText.includes(term));
}

function hasSpecificSuggestedActions(value: string) {
  const normalized = normalizeAction(value);

  if (!normalized) {
    return false;
  }

  if (genericActionPhrases.has(normalized)) {
    return false;
  }

  const actionParts = value
    .split(/\n|[；;，,、。]/)
    .map((part) => normalizeAction(part))
    .filter(Boolean);

  if (actionParts.length === 0) {
    return false;
  }

  return actionParts.some((part) => !genericActionPhrases.has(part));
}

export function validateGeneratedDiagnosis(payload: unknown): DiagnosisSafetyResult {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      message: "AI 输出不是有效的诊断对象。",
      ok: false
    };
  }

  const validation = validateDiagnosisInput(payload as Record<string, unknown>);

  if (!validation.ok) {
    return {
      message: "AI 输出字段不符合固定结构。",
      ok: false
    };
  }

  if (hasForbiddenTerms(validation.data)) {
    return {
      message: "AI 输出包含 v0.1 禁止的诊断或建议内容。",
      ok: false
    };
  }

  if (!hasSpecificSuggestedActions(validation.data.suggested_actions)) {
    return {
      message: "AI 输出的建议动作过于空泛。",
      ok: false
    };
  }

  return {
    data: validation.data,
    ok: true
  };
}
