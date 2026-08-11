import { parseCsv } from "../csv";
import {
  recordTypeLabels,
  validateWorkRecordInput,
  type RecordType,
  type WorkRecordInput
} from "./validation";

export const workRecordImportLimit = 100;
export const workRecordImportTemplate: string[][] = [
  ["记录类型", "涉及对象", "所属团队", "记录内容"],
  ["员工访谈", "张三", "产品团队", "员工反馈近期目标频繁变化，需要进一步确认优先级和资源支持。"],
  ["团队观察", "销售一组", "销售部", "跨区域客户分配存在重复跟进，需要明确负责人和升级机制。"],
  ["管理者反馈", "李经理", "研发团队", "管理者反馈当前任务边界不清晰，需要进一步明确负责人和协作机制。"]
];

const headerAliases: Record<keyof WorkRecordInput, string[]> = {
  content: ["记录内容", "原始记录内容", "content"],
  record_type: ["记录类型", "record_type"],
  subject_name: ["涉及对象", "涉及员工/对象", "涉及员工 / 对象", "subject_name"],
  team_name: ["所属团队", "所属部门/团队", "所属部门 / 团队", "team_name"]
};

function normalizeRecordType(value: string) {
  return value.replace(/[\s\u3000]+/g, "").trim().toLocaleLowerCase();
}

const importedRecordTypes = new Map<string, RecordType>([
  ...Object.entries(recordTypeLabels).map(([value, label]) => [normalizeRecordType(label), value as RecordType] as const),
  ["employee_interview", "employee_interview"],
  ["manager_feedback", "manager_feedback"],
  ["team_observation", "team_observation"],
  ["员工沟通", "employee_interview"],
  ["一对一访谈", "employee_interview"],
  ["绩效辅导", "employee_interview"],
  ["关键人才", "employee_interview"],
  ["试用期跟进", "employee_interview"],
  ["离职风险", "employee_interview"],
  ["管理反馈", "manager_feedback"],
  ["上级反馈", "manager_feedback"],
  ["组织诊断", "team_observation"],
  ["组织观察", "team_observation"],
  ["跨部门协同", "team_observation"],
  ["招聘复盘", "team_observation"]
]);

export type WorkRecordImportParseResult =
  | { errors: string[]; ok: false; records: [] }
  | { errors: []; ok: true; records: WorkRecordInput[] };

function normalizeHeader(value: string) {
  return value.replace(/\s+/g, "").trim();
}

function findColumnIndex(headers: string[], key: keyof WorkRecordInput) {
  const aliases = headerAliases[key].map(normalizeHeader);
  return headers.findIndex((header) => aliases.includes(normalizeHeader(header)));
}

function formatRowErrors(rowNumber: number, errors: Partial<Record<keyof WorkRecordInput, string>>) {
  return `第 ${rowNumber} 行：${Object.values(errors).join(" ")}`;
}

export function parseWorkRecordImport(input: string): WorkRecordImportParseResult {
  let rows: string[][];
  try {
    rows = parseCsv(input);
  } catch (error) {
    return {
      errors: [error instanceof Error ? error.message : "CSV 文件无法解析。"],
      ok: false,
      records: []
    };
  }

  if (rows.length < 2) {
    return { errors: ["CSV 至少需要表头和一条工作记录。"], ok: false, records: [] };
  }

  const headers = rows[0] ?? [];
  const indexes = {
    content: findColumnIndex(headers, "content"),
    record_type: findColumnIndex(headers, "record_type"),
    subject_name: findColumnIndex(headers, "subject_name"),
    team_name: findColumnIndex(headers, "team_name")
  };
  const missingHeaders = (Object.entries(indexes) as Array<[keyof WorkRecordInput, number]>)
    .filter(([, index]) => index < 0)
    .map(([key]) => headerAliases[key][0]);

  if (missingHeaders.length > 0) {
    return {
      errors: [`缺少必需列：${missingHeaders.join("、")}。请下载模板后重试。`],
      ok: false,
      records: []
    };
  }

  const dataRows = rows
    .slice(1)
    .map((row, index) => ({ row, rowNumber: index + 2 }))
    .filter(({ row }) => row.some((cell) => cell.trim()));

  if (dataRows.length === 0) {
    return { errors: ["CSV 中没有可导入的工作记录。"], ok: false, records: [] };
  }

  if (dataRows.length > workRecordImportLimit) {
    return {
      errors: [`单次最多导入 ${workRecordImportLimit} 条，当前文件包含 ${dataRows.length} 条。`],
      ok: false,
      records: []
    };
  }

  const errors: string[] = [];
  const records: WorkRecordInput[] = [];

  for (const { row, rowNumber } of dataRows) {
    const rawRecordType = row[indexes.record_type]?.trim() ?? "";
    const importedType = importedRecordTypes.get(normalizeRecordType(rawRecordType));
    const validation = validateWorkRecordInput({
      content: row[indexes.content] ?? "",
      record_type: importedType ?? rawRecordType,
      subject_name: row[indexes.subject_name] ?? "",
      team_name: row[indexes.team_name] ?? ""
    });

    if (!validation.ok) {
      if (!importedType) {
        validation.errors.record_type = rawRecordType
          ? `无法识别记录类型“${rawRecordType}”。支持员工访谈、管理者反馈、团队观察，也支持模板中的常见业务分类。`
          : "请填写记录类型。";
      }
      errors.push(formatRowErrors(rowNumber, validation.errors));
      continue;
    }

    records.push(validation.data);
  }

  if (errors.length > 0) {
    return { errors, ok: false, records: [] };
  }

  return { errors: [], ok: true, records };
}
