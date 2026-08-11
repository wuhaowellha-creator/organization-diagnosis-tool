export const recordTypes = ["employee_interview", "manager_feedback", "team_observation"] as const;

export type RecordType = (typeof recordTypes)[number];

export const recordTypeLabels: Record<RecordType, string> = {
  employee_interview: "员工访谈",
  manager_feedback: "管理者反馈",
  team_observation: "团队观察"
};

export type WorkRecordInput = {
  content: string;
  record_type: RecordType;
  subject_name: string;
  team_name: string;
};

export type WorkRecordValidationResult =
  | {
      data: WorkRecordInput;
      errors: Record<string, never>;
      ok: true;
    }
  | {
      data: null;
      errors: Partial<Record<keyof WorkRecordInput, string>>;
      ok: false;
    };

function isRecordType(value: unknown): value is RecordType {
  return typeof value === "string" && recordTypes.includes(value as RecordType);
}

function readString(payload: Record<string, unknown>, key: keyof WorkRecordInput) {
  const value = payload[key];

  return typeof value === "string" ? value.trim() : "";
}

export function validateWorkRecordInput(payload: Record<string, unknown>): WorkRecordValidationResult {
  const errors: Partial<Record<keyof WorkRecordInput, string>> = {};
  const rawRecordType = payload.record_type;
  const subjectName = readString(payload, "subject_name");
  const teamName = readString(payload, "team_name");
  const content = readString(payload, "content");

  if (!isRecordType(rawRecordType)) {
    errors.record_type = "请选择有效的记录类型。";
  }

  if (!subjectName) {
    errors.subject_name = "请填写涉及员工 / 对象。";
  }

  if (!teamName) {
    errors.team_name = "请填写所属部门 / 团队。";
  }

  if (!content) {
    errors.content = "请填写原始记录内容。";
  }

  if (Object.keys(errors).length > 0) {
    return {
      data: null,
      errors,
      ok: false
    };
  }

  return {
    data: {
      content,
      record_type: rawRecordType as RecordType,
      subject_name: subjectName,
      team_name: teamName
    },
    errors: {},
    ok: true
  };
}
