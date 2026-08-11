import OpenAI from "openai";
import type { DiagnosisPromptRecord } from "../diagnoses/prompt";
import { buildDiagnosisUserPrompt, diagnosisSystemPrompt } from "../diagnoses/prompt";
import type { DiagnosisFormValues, RiskType } from "../diagnoses/structure";
import type { BrowserAiCredential } from "./browser-storage";
import { getAiProviderRuntime, type AiProvider } from "./providers";

export type DiagnosisGenerationResult = {
  output: unknown;
  provider: AiProvider;
  usedFallback: boolean;
};

type DiagnosisGenerationOptions = {
  browserCredential?: BrowserAiCredential | null;
  model: string;
  provider: AiProvider;
};

export async function generateDiagnosis(
  record: DiagnosisPromptRecord,
  options: DiagnosisGenerationOptions
): Promise<DiagnosisGenerationResult> {
  if (options.provider === "rules") {
    return { output: generateRulesBasedDiagnosis(record), provider: "rules", usedFallback: false };
  }

  try {
    const runtime = options.browserCredential
      ? {
          apiKey: options.browserCredential.api_key,
          baseUrl: options.browserCredential.base_url,
          model: options.browserCredential.model,
          provider: options.browserCredential.provider
        }
      : getAiProviderRuntime(options.provider, options.model);
    const client = new OpenAI({
      apiKey: runtime.apiKey,
      baseURL: runtime.baseUrl,
      defaultHeaders: runtime.defaultHeaders
    });
    const completion = await client.chat.completions.create({
      max_tokens: 1200,
      messages: [
        { content: diagnosisSystemPrompt, role: "system" },
        { content: buildDiagnosisUserPrompt(record), role: "user" }
      ],
      model: runtime.model,
      response_format: { type: "json_object" }
    });
    const outputText = completion.choices[0]?.message?.content;
    if (!outputText) throw new Error("AI response did not include message content");
    return { output: JSON.parse(outputText), provider: options.provider, usedFallback: false };
  } catch {
    return { output: generateRulesBasedDiagnosis(record), provider: "rules", usedFallback: true };
  }
}

const riskSignals: Array<{ riskType: RiskType; words: string[] }> = [
  { riskType: "resignation_risk", words: ["离职", "辞职", "外部机会", "去意", "留任"] },
  { riskType: "performance_risk", words: ["绩效", "目标", "业绩", "延期", "交付", "质量"] },
  { riskType: "emotion_risk", words: ["压力", "情绪", "焦虑", "疲惫", "倦怠", "抱怨"] },
  { riskType: "management_risk", words: ["管理者", "主管", "授权", "指令", "管理", "一对一"] },
  { riskType: "collaboration_risk", words: ["协作", "沟通", "跨部门", "冲突", "配合", "信息差"] },
  { riskType: "key_position_risk", words: ["关键岗位", "核心岗位", "交接", "单点", "替补", "继任"] }
];

function generateRulesBasedDiagnosis(record: DiagnosisPromptRecord): DiagnosisFormValues {
  const text = `${record.subject_name} ${record.team_name} ${record.content}`;
  const riskTypes = riskSignals
    .filter((signal) => signal.words.some((word) => text.includes(word)))
    .map((signal) => signal.riskType);
  const selectedRiskTypes = riskTypes.length > 0 ? riskTypes.slice(0, 3) : ["management_risk" as const];
  const highSignals = ["明确离职", "已经辞职", "严重冲突", "连续延期", "核心岗位无人交接"];
  const riskLevel = highSignals.some((word) => text.includes(word))
    ? "high"
    : riskTypes.length > 0
      ? "medium"
      : "low";
  const summaryText = record.content.replace(/\s+/g, " ").trim();
  const summary = summaryText.length > 92 ? `${summaryText.slice(0, 92)}…` : summaryText;

  return {
    summary: summary || `${record.team_name}的一条${record.subject_name}相关工作记录。`,
    core_issue: `${record.team_name}中与${record.subject_name}相关的情况需要进一步核实事实、影响范围与变化趋势。`,
    possible_reason: "当前判断仅来自单条记录，可能与目标预期、协作方式或支持条件有关，需通过后续沟通交叉验证。",
    risk_types: selectedRiskTypes,
    risk_level: riskLevel,
    suggested_actions: [
      `1. 在 3 个工作日内与${record.subject_name}进行一次事实澄清沟通，记录具体事件、时间点和影响。`,
      `2. 与${record.team_name}相关管理者核对目标、资源和协作边界，形成可观察的改进点。`,
      "3. 设定 1—2 周观察周期，按约定节点复盘风险变化并更新跟进状态。"
    ].join("\n")
  };
}
