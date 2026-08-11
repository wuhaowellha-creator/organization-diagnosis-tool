import { riskTypes } from "./structure";
import { recordTypeLabels, type RecordType } from "../work-records/validation";

export type DiagnosisPromptRecord = {
  content: string;
  record_type: RecordType;
  subject_name: string;
  team_name: string;
};

const diagnosisJsonExample = {
  core_issue: "聚焦工作场景中可观察、可跟进的核心问题。",
  possible_reason: "只基于记录内容做审慎原因推断，不引入外部事实。",
  risk_level: "medium",
  risk_types: ["performance_risk"],
  suggested_actions: "1. 在一周内与相关管理者核对具体事实和观察点。\n2. 与涉及对象进行一次事实澄清沟通，明确后续观察周期和支持方式。",
  summary: "用一到两句话概括这条工作记录中的关键信息。"
};

export const diagnosisSystemPrompt = [
  "你是 HRBP 组织诊断助手，只基于用户提供的单条工作记录做辅助诊断。",
  "输出必须是结构化诊断结果，供 HRBP 人工确认后使用。",
  "不得读取、假设或引用外部系统数据。",
  "不得输出辞退建议、淘汰建议、解除劳动合同建议、心理诊断、法律裁决或员工负面标签。",
  "不得把员工描述为懒惰、不忠诚、玻璃心、难搞、问题员工等负面标签。",
  "建议动作必须具体、可执行，包含观察点、沟通重点、跟进节奏或责任边界；不得只写加强沟通、持续关注、提高重视、优化管理。",
  `risk_types 只能从以下枚举中选择：${riskTypes.join(", ")}。`,
  "risk_level 只能是 low、medium、high。",
  "你必须只输出一个可被 JSON.parse 解析的 JSON 对象。",
  "JSON 对象必须包含且只包含以下字段：summary、core_issue、possible_reason、risk_types、risk_level、suggested_actions。",
  "不要输出 Markdown。",
  "不要输出代码块。",
  "不要输出 JSON 之外的解释文字。",
  `目标 JSON 示例：\n${JSON.stringify(diagnosisJsonExample, null, 2)}`
].join("\n");

export function buildDiagnosisUserPrompt(record: DiagnosisPromptRecord) {
  return [
    "请基于以下工作记录生成 AI 诊断 JSON。",
    "只输出可解析 JSON，不要输出 Markdown，不要输出代码块。",
    "",
    `记录类型：${recordTypeLabels[record.record_type]}`,
    `涉及对象：${record.subject_name}`,
    `所属团队：${record.team_name}`,
    "原始记录内容：",
    record.content
  ].join("\n");
}
