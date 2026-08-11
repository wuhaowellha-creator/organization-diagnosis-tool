"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readBrowserDiagnosisConfig } from "../../lib/ai/browser-storage";
import { canUseDiagnosisForFollowUp, canUseDiagnosisForReport } from "../../lib/diagnoses/guards";
import {
  emptyDiagnosisValues,
  riskTypeLabels,
  type DiagnosisFormValues,
  type RiskType
} from "../../lib/diagnoses/structure";
import { editableRiskLevelLabels } from "../../lib/diagnoses/structure";
import type { DiagnosisInputErrors } from "../../lib/diagnoses/validation";
import type { FollowUpCreateInputErrors } from "../../lib/follow-ups/validation";
import { diagnosisStatusLabels, type DiagnosisStatus } from "../../lib/work-records/presentation";
import { Badge, Button, ErrorMessage, Input, Textarea } from "../common";
import { DiagnosisConfirmBar } from "./DiagnosisConfirmBar";
import { RiskLevelSelect } from "./RiskLevelSelect";
import { RiskTypeSelect } from "./RiskTypeSelect";

type DiagnosisPanelProps = {
  diagnosis: DiagnosisFormValues | null;
  diagnosisId: string | null;
  recordId: string;
  status: DiagnosisStatus;
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium leading-6 text-slate-700">{children}</label>;
}

export function DiagnosisPanel({ diagnosis, diagnosisId, recordId, status }: DiagnosisPanelProps) {
  const router = useRouter();
  const [values, setValues] = useState<DiagnosisFormValues>(diagnosis ?? emptyDiagnosisValues);
  const [fieldErrors, setFieldErrors] = useState<DiagnosisInputErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [followUpTitle, setFollowUpTitle] = useState("");
  const [followUpFieldErrors, setFollowUpFieldErrors] = useState<FollowUpCreateInputErrors>({});
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCreatingFollowUp, setIsCreatingFollowUp] = useState(false);
  const hasDiagnosis = Boolean(diagnosis && diagnosisId);
  const isConfirmed = status === "confirmed";
  const isDirty = hasDiagnosis && JSON.stringify(values) !== JSON.stringify(diagnosis);
  const isBusy = isDiagnosing || isSaving || isConfirming || isCreatingFollowUp;
  const canEnterFollowUp = canUseDiagnosisForFollowUp(status);
  const canEnterReport = canUseDiagnosisForReport(status);
  const canCreateFollowUp = canEnterFollowUp && (values.risk_level === "medium" || values.risk_level === "high");

  useEffect(() => {
    setValues(diagnosis ?? emptyDiagnosisValues);
    setFieldErrors({});
    setFollowUpFieldErrors({});
    setFollowUpTitle(diagnosis?.core_issue || diagnosis?.summary || "");
    setFormError(null);
    setSuccessMessage(null);
  }, [diagnosis, diagnosisId]);

  function updateTextField(field: keyof Omit<DiagnosisFormValues, "risk_level" | "risk_types">, value: string) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value
    }));
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined
    }));
    setFormError(null);
    setSuccessMessage(null);
  }

  function updateFollowUpTitle(value: string) {
    setFollowUpTitle(value);
    setFollowUpFieldErrors({});
    setFormError(null);
    setSuccessMessage(null);
  }

  function updateRiskTypes(riskTypes: RiskType[]) {
    setValues((currentValues) => ({
      ...currentValues,
      risk_types: riskTypes
    }));
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      risk_types: undefined
    }));
    setFormError(null);
    setSuccessMessage(null);
  }

  function updateRiskLevel(riskLevel: DiagnosisFormValues["risk_level"]) {
    setValues((currentValues) => ({
      ...currentValues,
      risk_level: riskLevel
    }));
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      risk_level: undefined
    }));
    setFormError(null);
    setSuccessMessage(null);
  }

  async function persistDiagnosis() {
    if (!diagnosisId) {
      return false;
    }

    const response = await fetch(`/api/diagnoses/${diagnosisId}`, {
      body: JSON.stringify(values),
      headers: {
        "Content-Type": "application/json"
      },
      method: "PATCH"
    });

    const result = (await response.json()) as {
      errors?: DiagnosisInputErrors;
      message?: string;
    };

    if (!response.ok) {
      setFieldErrors(result.errors ?? {});
      setFormError(result.message ?? "保存诊断结果失败，请稍后重试。");
      return false;
    }

    return true;
  }

  async function handleSave() {
    setIsSaving(true);
    setFieldErrors({});
    setFormError(null);
    setSuccessMessage(null);

    try {
      const saved = await persistDiagnosis();

      if (!saved) {
        return;
      }

      setSuccessMessage(isConfirmed ? "诊断修改已保存。" : "诊断草稿已保存，仍需人工确认。");
      router.refresh();
    } catch {
      setFormError("网络连接异常，请稍后重试。");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleGenerateDiagnosis() {
    if (isDirty && !window.confirm("重新生成会覆盖尚未保存的诊断修改，确定继续吗？")) {
      return;
    }

    setIsDiagnosing(true);
    setFieldErrors({});
    setFormError(null);
    setSuccessMessage(null);

    try {
      const providerConfig = readBrowserDiagnosisConfig();
      const response = await fetch(`/api/records/${recordId}/diagnose`, {
        body: providerConfig ? JSON.stringify({ provider_config: providerConfig }) : undefined,
        headers: providerConfig ? { "Content-Type": "application/json" } : undefined,
        method: "POST"
      });

      const result = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setFormError(result.message ?? "AI 诊断生成失败，请稍后重试。");
        return;
      }

      setSuccessMessage(result.message ?? "AI 诊断已生成，需人工确认后才能进入后续流程。");
      router.refresh();
    } catch {
      setFormError("网络连接异常，请稍后重试。");
    } finally {
      setIsDiagnosing(false);
    }
  }

  async function handleConfirm() {
    if (!diagnosisId || isConfirmed) {
      return;
    }

    setIsConfirming(true);
    setFormError(null);
    setSuccessMessage(null);

    try {
      const saved = await persistDiagnosis();

      if (!saved) {
        return;
      }

      const response = await fetch(`/api/diagnoses/${diagnosisId}/confirm`, {
        method: "POST"
      });

      const result = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setFormError(result.message ?? "确认诊断结果失败，请稍后重试。");
        return;
      }

      setSuccessMessage("诊断已保存并完成人工确认。");
      router.refresh();
    } catch {
      setFormError("网络连接异常，请稍后重试。");
    } finally {
      setIsConfirming(false);
    }
  }

  async function handleCreateFollowUp() {
    setIsCreatingFollowUp(true);
    setFollowUpFieldErrors({});
    setFormError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/records/${recordId}/create-follow-up`, {
        body: JSON.stringify({
          title: followUpTitle
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      const result = (await response.json()) as {
        errors?: FollowUpCreateInputErrors;
        id?: string;
        message?: string;
      };

      if (!response.ok || !result.id) {
        setFollowUpFieldErrors(result.errors ?? {});
        setFormError(result.message ?? "创建跟进事项失败，请稍后重试。");
        return;
      }

      router.push(`/follow-ups/${result.id}`);
      router.refresh();
    } catch {
      setFormError("网络连接异常，请稍后重试。");
    } finally {
      setIsCreatingFollowUp(false);
    }
  }

  return (
    <section className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-slate-950">AI 辅助诊断</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">先校对 AI 结果，再由你完成人工确认。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            className="inline-flex h-11 items-center rounded-xl px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            href="/settings/ai"
          >
            AI 接口设置
          </a>
          <Button disabled={isBusy} onClick={handleGenerateDiagnosis} type="button" variant={hasDiagnosis ? "secondary" : "primary"}>
            {isDiagnosing ? "生成中..." : hasDiagnosis ? "重新生成诊断" : "生成诊断"}
          </Button>
        </div>
      </div>

      <DiagnosisConfirmBar />

      {!hasDiagnosis ? (
        <div className="grid gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
          <div>
            <p className="text-sm font-semibold text-slate-950">尚未生成诊断</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">AI 会基于原始记录生成摘要、核心问题、风险和建议动作。</p>
          </div>
          {formError ? <ErrorMessage>{formError}</ErrorMessage> : null}
          {successMessage ? <p className="text-sm font-medium text-emerald-700">{successMessage}</p> : null}
        </div>
      ) : null}

      {hasDiagnosis ? (
        <div className="grid gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{diagnosisStatusLabels[status]}</Badge>
            <Badge variant={isConfirmed ? "success" : "warning"}>
              {canEnterFollowUp && canEnterReport ? "可进入后续流程" : "仅供确认前查看"}
            </Badge>
          </div>
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            {isConfirmed
              ? "此诊断已人工确认，可作为后续跟进事项和报告生成的数据来源。"
              : "未确认诊断不能创建跟进事项，也不能进入报告生成数据源。"}
          </p>

          <div className="grid gap-2">
            <FieldLabel>记录摘要</FieldLabel>
            <Textarea
              disabled={isBusy}
              onChange={(event) => updateTextField("summary", event.target.value)}
              placeholder="用一段话概括已确认的事实与背景"
              value={values.summary}
            />
            {fieldErrors.summary ? <ErrorMessage>{fieldErrors.summary}</ErrorMessage> : null}
          </div>

          <div className="grid gap-2">
            <FieldLabel>核心问题</FieldLabel>
            <Textarea
              disabled={isBusy}
              onChange={(event) => updateTextField("core_issue", event.target.value)}
              placeholder="需要被关注和处理的核心问题"
              value={values.core_issue}
            />
            {fieldErrors.core_issue ? <ErrorMessage>{fieldErrors.core_issue}</ErrorMessage> : null}
          </div>

          <div className="grid gap-2">
            <FieldLabel>可能原因</FieldLabel>
            <Textarea
              disabled={isBusy}
              onChange={(event) => updateTextField("possible_reason", event.target.value)}
              placeholder="可能成因与尚待验证的假设"
              value={values.possible_reason}
            />
            {fieldErrors.possible_reason ? <ErrorMessage>{fieldErrors.possible_reason}</ErrorMessage> : null}
          </div>

          <div className="grid gap-2">
            <FieldLabel>风险类型</FieldLabel>
            <RiskTypeSelect disabled={isBusy} onChange={updateRiskTypes} value={values.risk_types} />
            <div className="flex flex-wrap gap-2">
              {values.risk_types.length > 0 ? (
                values.risk_types.map((riskType) => <Badge key={riskType}>{riskTypeLabels[riskType]}</Badge>)
              ) : (
                <Badge>未选择</Badge>
              )}
            </div>
            {fieldErrors.risk_types ? <ErrorMessage>{fieldErrors.risk_types}</ErrorMessage> : null}
          </div>

          <div className="grid gap-2">
            <FieldLabel>风险等级</FieldLabel>
            <RiskLevelSelect
              disabled={isBusy}
              onChange={updateRiskLevel}
              value={values.risk_level}
            />
            <div>
              <Badge>{editableRiskLevelLabels[values.risk_level]}</Badge>
            </div>
            {fieldErrors.risk_level ? <ErrorMessage>{fieldErrors.risk_level}</ErrorMessage> : null}
          </div>

          <div className="grid gap-2">
            <FieldLabel>建议动作</FieldLabel>
            <Textarea
              disabled={isBusy}
              onChange={(event) => updateTextField("suggested_actions", event.target.value)}
              placeholder="下一步可执行、可观察的行动"
              value={values.suggested_actions}
            />
            {fieldErrors.suggested_actions ? <ErrorMessage>{fieldErrors.suggested_actions}</ErrorMessage> : null}
          </div>

          <div aria-live="polite">
            {formError ? <ErrorMessage>{formError}</ErrorMessage> : null}
            {successMessage ? <p className="text-sm font-medium text-emerald-700">{successMessage}</p> : null}
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
            {!isConfirmed ? (
              <>
                <Button disabled={isBusy || !isDirty} onClick={handleSave} type="button" variant="secondary">
                  {isSaving ? "保存中..." : "仅保存草稿"}
                </Button>
                <Button disabled={isBusy} onClick={handleConfirm} type="button">
                  {isConfirming ? "保存并确认中..." : "保存并确认"}
                </Button>
              </>
            ) : (
              <Button disabled={isBusy || !isDirty} onClick={handleSave} type="button">
                {isSaving ? "保存中..." : "保存诊断修改"}
              </Button>
            )}
          </div>

          {isConfirmed ? (
            <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div>
                <h4 className="text-sm font-semibold text-slate-950">转为跟进事项</h4>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {canCreateFollowUp
                    ? "已确认的中高风险诊断可以创建跟进事项。"
                    : "低风险诊断不强制创建跟进事项。"}
                </p>
              </div>
              {canCreateFollowUp ? (
                <div className="grid gap-2">
                  <label className="text-sm font-medium leading-6 text-slate-700" htmlFor="follow_up_title">
                    问题名称
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      disabled={isBusy}
                      id="follow_up_title"
                      onChange={(event) => updateFollowUpTitle(event.target.value)}
                      placeholder="请输入跟进事项的问题名称"
                      value={followUpTitle}
                    />
                    <Button disabled={isBusy} onClick={handleCreateFollowUp} type="button">
                      {isCreatingFollowUp ? "创建中..." : "创建跟进事项"}
                    </Button>
                  </div>
                  {followUpFieldErrors.title ? <ErrorMessage>{followUpFieldErrors.title}</ErrorMessage> : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
