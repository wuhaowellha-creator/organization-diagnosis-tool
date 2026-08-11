"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DiagnosisPanel } from "../diagnoses/DiagnosisPanel";
import { Badge, Button, ErrorMessage, Input, Textarea } from "../common";
import type { DiagnosisFormValues } from "../../lib/diagnoses/structure";
import {
  diagnosisStatusLabels,
  formatDateTime,
  riskLevelLabels,
  type WorkRecordDetail
} from "../../lib/work-records/presentation";
import { recordTypeLabels, validateWorkRecordInput, type WorkRecordInput } from "../../lib/work-records/validation";
import { RecordTypeSelect } from "./RecordTypeSelect";

type RecordDetailProps = {
  record: WorkRecordDetail;
};

type FieldErrors = Partial<Record<keyof WorkRecordInput, string>>;

function getRiskLabel(record: WorkRecordDetail) {
  return record.diagnosis.risk_level ? `${riskLevelLabels[record.diagnosis.risk_level]}风险` : "未诊断";
}

function getRiskVariant(record: WorkRecordDetail) {
  if (record.diagnosis.risk_level === "high") {
    return "danger";
  }

  if (record.diagnosis.risk_level === "medium") {
    return "warning";
  }

  if (record.diagnosis.risk_level === "low") {
    return "success";
  }

  return "neutral";
}

function getInitialDiagnosis(record: WorkRecordDetail): DiagnosisFormValues | null {
  if (!record.diagnosis.diagnosis_id) {
    return null;
  }

  return record.diagnosis.form_values;
}

export function RecordDetail({ record }: RecordDetailProps) {
  const router = useRouter();
  const initialValues = {
    content: record.content,
    record_type: record.record_type,
    subject_name: record.subject_name,
    team_name: record.team_name
  };
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  function updateField(field: keyof typeof values, value: string) {
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

  function cancelEditing() {
    setValues(initialValues);
    setFieldErrors({});
    setFormError(null);
    setSuccessMessage(null);
    setIsEditing(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateWorkRecordInput(values);

    if (!validation.ok) {
      setFieldErrors(validation.errors);
      setFormError("请先补全必填字段。");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/records/${record.id}`, {
        body: JSON.stringify(validation.data),
        headers: {
          "Content-Type": "application/json"
        },
        method: "PATCH"
      });

      const result = (await response.json()) as {
        errors?: FieldErrors;
        message?: string;
      };

      if (!response.ok) {
        setFieldErrors(result.errors ?? {});
        setFormError(result.message ?? "保存工作记录失败，请稍后重试。");
        return;
      }

      setSuccessMessage("工作记录已保存。");
      setIsEditing(false);
      router.refresh();
    } catch {
      setFormError("网络连接异常，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  const diagnosisStepState = record.diagnosis.status === "not_diagnosed" ? "下一步" : "已生成";
  const confirmationStepState = record.diagnosis.status === "confirmed" ? "已完成" : "待处理";

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "记录事实", state: "已完成", variant: "success" as const },
          {
            label: "AI 辅助诊断",
            state: diagnosisStepState,
            variant: record.diagnosis.status === "not_diagnosed" ? ("warning" as const) : ("success" as const)
          },
          {
            label: "人工确认",
            state: confirmationStepState,
            variant: record.diagnosis.status === "confirmed" ? ("success" as const) : ("neutral" as const)
          }
        ].map((step, index) => (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5" key={step.label}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-400">0{index + 1}</span>
              <Badge variant={step.variant}>{step.state}</Badge>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-950">{step.label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge>{diagnosisStatusLabels[record.diagnosis.status]}</Badge>
              <Badge variant={getRiskVariant(record)}>{getRiskLabel(record)}</Badge>
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-950">{record.subject_name}</h2>
            <p className="mt-1 text-sm text-slate-500">{record.team_name} · {recordTypeLabels[record.record_type]}</p>
          </div>
          <Button onClick={() => setIsEditing((current) => !current)} type="button" variant="secondary">
            {isEditing ? "收起编辑" : "编辑记录"}
          </Button>
        </div>

        <div className="mt-5 border-t border-slate-200 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">原始记录</p>
            <span className="text-xs text-slate-400">{formatDateTime(record.created_at)}</span>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{record.content}</p>
        </div>
      </section>

      {isEditing ? (
        <form className="grid gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6" noValidate onSubmit={handleSubmit}>
          <div>
            <h3 className="text-lg font-bold text-slate-950">编辑工作记录</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">修改原始记录不会自动重新生成诊断。</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium leading-6 text-slate-700" htmlFor="record_type">记录类型</label>
              <RecordTypeSelect
                disabled={isSubmitting}
                errorId={fieldErrors.record_type ? "record_type-error" : undefined}
                onChange={(value) => updateField("record_type", value)}
                value={values.record_type}
              />
              {fieldErrors.record_type ? <ErrorMessage id="record_type-error">{fieldErrors.record_type}</ErrorMessage> : null}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium leading-6 text-slate-700" htmlFor="subject_name">涉及员工 / 对象</label>
              <Input
                disabled={isSubmitting}
                id="subject_name"
                name="subject_name"
                onChange={(event) => updateField("subject_name", event.target.value)}
                required
                value={values.subject_name}
              />
              {fieldErrors.subject_name ? <ErrorMessage id="subject_name-error">{fieldErrors.subject_name}</ErrorMessage> : null}
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <label className="text-sm font-medium leading-6 text-slate-700" htmlFor="team_name">所属部门 / 团队</label>
              <Input
                disabled={isSubmitting}
                id="team_name"
                name="team_name"
                onChange={(event) => updateField("team_name", event.target.value)}
                required
                value={values.team_name}
              />
              {fieldErrors.team_name ? <ErrorMessage id="team_name-error">{fieldErrors.team_name}</ErrorMessage> : null}
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium leading-6 text-slate-700" htmlFor="content">原始记录内容</label>
            <Textarea
              className="min-h-52"
              disabled={isSubmitting}
              id="content"
              name="content"
              onChange={(event) => updateField("content", event.target.value)}
              required
              value={values.content}
            />
            {fieldErrors.content ? <ErrorMessage id="content-error">{fieldErrors.content}</ErrorMessage> : null}
          </div>

          {formError ? <ErrorMessage>{formError}</ErrorMessage> : null}
          <div aria-live="polite">{successMessage ? <p className="text-sm font-medium text-emerald-700">{successMessage}</p> : null}</div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
            <Button disabled={isSubmitting} onClick={cancelEditing} type="button" variant="ghost">取消</Button>
            <Button disabled={isSubmitting || !isDirty} type="submit">
              {isSubmitting ? "保存中..." : "保存修改"}
            </Button>
          </div>
        </form>
      ) : null}

      {!isEditing && successMessage ? (
        <p aria-live="polite" className="text-sm font-medium text-emerald-700">{successMessage}</p>
      ) : null}

      <DiagnosisPanel
        diagnosis={getInitialDiagnosis(record)}
        diagnosisId={record.diagnosis.diagnosis_id}
        recordId={record.id}
        status={record.diagnosis.status}
      />
    </div>
  );
}
