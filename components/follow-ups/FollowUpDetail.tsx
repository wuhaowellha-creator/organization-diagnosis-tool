"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, ErrorMessage, Input, Textarea } from "../common";
import {
  followUpRiskLevelLabels,
  formatFollowUpCreatedAt,
  formatRiskTypes,
  type FollowUpDetail as FollowUpDetailData
} from "../../lib/follow-ups/presentation";
import {
  followUpStatusLabels,
  validateFollowUpInput,
  type FollowUpInput,
  type FollowUpInputErrors
} from "../../lib/follow-ups/validation";
import { FollowUpStatusSelect } from "./FollowUpStatusSelect";

type FollowUpDetailProps = {
  followUp: FollowUpDetailData;
};

function getRiskVariant(riskLevel: FollowUpDetailData["risk_level"]) {
  return riskLevel === "high" ? "danger" : "warning";
}

function getStatusVariant(status: FollowUpDetailData["status"]) {
  if (status === "resolved") {
    return "success";
  }

  if (status === "in_progress" || status === "under_observation") {
    return "warning";
  }

  return "neutral";
}

export function FollowUpDetail({ followUp }: FollowUpDetailProps) {
  const router = useRouter();
  const [values, setValues] = useState<FollowUpInput>({
    problem_description: followUp.problem_description,
    review_result: followUp.review_result,
    status: followUp.status,
    suggested_actions: followUp.suggested_actions,
    title: followUp.title
  });
  const [fieldErrors, setFieldErrors] = useState<FollowUpInputErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDirty =
    JSON.stringify(values) !==
    JSON.stringify({
      problem_description: followUp.problem_description,
      review_result: followUp.review_result,
      status: followUp.status,
      suggested_actions: followUp.suggested_actions,
      title: followUp.title
    });

  function updateField<K extends keyof FollowUpInput>(field: K, value: FollowUpInput[K]) {
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateFollowUpInput(values);

    if (!validation.ok) {
      setFieldErrors(validation.errors);
      setFormError("请检查跟进事项字段后再保存。");
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/follow-ups/${followUp.id}`, {
        body: JSON.stringify(validation.data),
        headers: {
          "Content-Type": "application/json"
        },
        method: "PATCH"
      });

      const result = (await response.json()) as {
        errors?: FollowUpInputErrors;
        message?: string;
      };

      if (!response.ok) {
        setFieldErrors(result.errors ?? {});
        setFormError(result.message ?? "保存跟进事项失败，请稍后重试。");
        return;
      }

      setSuccessMessage("跟进事项已保存。");
      router.refresh();
    } catch {
      setFormError("网络连接异常，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant={getStatusVariant(followUp.status)}>{followUpStatusLabels[followUp.status]}</Badge>
            <Badge variant={getRiskVariant(followUp.risk_level)}>{followUpRiskLevelLabels[followUp.risk_level]}风险</Badge>
          </div>
          <a
            className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            href={`/records/${followUp.work_record_id}`}
          >
            查看来源记录
          </a>
        </div>

        <div className="grid gap-4 border-t border-slate-200 pt-5 md:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">涉及对象</p>
            <p className="mt-1 font-medium text-slate-950">{followUp.subject_name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">所属团队</p>
            <p className="mt-1 font-medium text-slate-950">{followUp.team_name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">风险类型</p>
            <p className="mt-1 font-medium text-slate-950">{formatRiskTypes(followUp.risk_types)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">创建时间</p>
            <p className="mt-1 font-medium text-slate-950">{formatFollowUpCreatedAt(followUp.created_at)}</p>
          </div>
        </div>
      </section>

      <form className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" noValidate onSubmit={handleSubmit}>
        <div>
          <h3 className="text-lg font-bold text-slate-950">推进与复盘</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">先更新当前状态，再留下关键动作和可验证的结果。</p>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium leading-6 text-slate-700" htmlFor="title">
            问题名称
          </label>
          <Input
            disabled={isSubmitting}
            id="title"
            onChange={(event) => updateField("title", event.target.value)}
            required
            value={values.title}
          />
          {fieldErrors.title ? <ErrorMessage>{fieldErrors.title}</ErrorMessage> : null}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium leading-6 text-slate-700" htmlFor="status">
            跟进状态
          </label>
          <FollowUpStatusSelect
            disabled={isSubmitting}
            onChange={(status) => updateField("status", status)}
            value={values.status}
          />
          {fieldErrors.status ? <ErrorMessage>{fieldErrors.status}</ErrorMessage> : null}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium leading-6 text-slate-700" htmlFor="problem_description">
            问题描述
          </label>
          <Textarea
            disabled={isSubmitting}
            id="problem_description"
            onChange={(event) => updateField("problem_description", event.target.value)}
            value={values.problem_description}
          />
          {fieldErrors.problem_description ? <ErrorMessage>{fieldErrors.problem_description}</ErrorMessage> : null}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium leading-6 text-slate-700" htmlFor="suggested_actions">
            建议动作
          </label>
          <Textarea
            disabled={isSubmitting}
            id="suggested_actions"
            onChange={(event) => updateField("suggested_actions", event.target.value)}
            value={values.suggested_actions}
          />
          {fieldErrors.suggested_actions ? <ErrorMessage>{fieldErrors.suggested_actions}</ErrorMessage> : null}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium leading-6 text-slate-700" htmlFor="review_result">
            复盘结果
          </label>
          <Textarea
            disabled={isSubmitting}
            id="review_result"
            onChange={(event) => updateField("review_result", event.target.value)}
            placeholder="记录跟进后的观察、结果和下一步判断。"
            value={values.review_result}
          />
          {fieldErrors.review_result ? <ErrorMessage>{fieldErrors.review_result}</ErrorMessage> : null}
        </div>

        <div aria-live="polite">
          {formError ? <ErrorMessage>{formError}</ErrorMessage> : null}
          {successMessage ? <p className="text-sm font-medium text-emerald-700">{successMessage}</p> : null}
        </div>

        <div className="flex justify-end border-t border-slate-200 pt-5">
          <Button className="w-full sm:w-auto" disabled={isSubmitting || !isDirty} type="submit">
            {isSubmitting ? "保存中..." : "保存跟进事项"}
          </Button>
        </div>
      </form>
    </div>
  );
}
