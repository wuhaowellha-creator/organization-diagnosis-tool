"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ErrorMessage, Input, Textarea } from "../common";
import { validateWorkRecordInput, type WorkRecordInput } from "../../lib/work-records/validation";
import { RecordTypeSelect } from "./RecordTypeSelect";

type FieldErrors = Partial<Record<keyof WorkRecordInput, string>>;

const initialValues = {
  content: "",
  record_type: "",
  subject_name: "",
  team_name: ""
};

export function RecordForm() {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof typeof initialValues, value: string) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value
    }));
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined
    }));
    setFormError(null);
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

    try {
      const response = await fetch("/api/records", {
        body: JSON.stringify(validation.data),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      const result = (await response.json()) as {
        errors?: FieldErrors;
        id?: string;
        message?: string;
      };

      if (!response.ok || !result.id) {
        setFieldErrors(result.errors ?? {});
        setFormError(result.message ?? "保存工作记录失败，请稍后重试。");
        return;
      }

      router.push(`/records/${result.id}`);
      router.refresh();
    } catch {
      setFormError("网络连接异常，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-6" noValidate onSubmit={handleSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium leading-6 text-slate-700" htmlFor="record_type">
            记录类型
          </label>
          <RecordTypeSelect
            disabled={isSubmitting}
            errorId={fieldErrors.record_type ? "record_type-error" : undefined}
            onChange={(value) => updateField("record_type", value)}
            value={values.record_type}
          />
          {fieldErrors.record_type ? (
            <ErrorMessage id="record_type-error">{fieldErrors.record_type}</ErrorMessage>
          ) : null}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium leading-6 text-slate-700" htmlFor="subject_name">
            涉及员工 / 对象
          </label>
          <Input
            disabled={isSubmitting}
            id="subject_name"
            name="subject_name"
            onChange={(event) => updateField("subject_name", event.target.value)}
            placeholder="例如：张三、销售一组"
            required
            value={values.subject_name}
          />
          {fieldErrors.subject_name ? (
            <ErrorMessage id="subject_name-error">{fieldErrors.subject_name}</ErrorMessage>
          ) : null}
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <label className="text-sm font-medium leading-6 text-slate-700" htmlFor="team_name">
            所属部门 / 团队
          </label>
          <Input
            disabled={isSubmitting}
            id="team_name"
            name="team_name"
            onChange={(event) => updateField("team_name", event.target.value)}
            placeholder="例如：销售部、产品团队"
            required
            value={values.team_name}
          />
          {fieldErrors.team_name ? <ErrorMessage id="team_name-error">{fieldErrors.team_name}</ErrorMessage> : null}
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium leading-6 text-slate-700" htmlFor="content">
            原始记录内容
          </label>
          <span className="text-xs text-slate-400">{values.content.length} 字</span>
        </div>
        <Textarea
          className="min-h-56"
          disabled={isSubmitting}
          id="content"
          name="content"
          onChange={(event) => updateField("content", event.target.value)}
          placeholder="建议记录：发生了什么、谁受到影响、具体言行或数据、当事人的反馈、需要后续验证的假设。"
          required
          value={values.content}
        />
        <p className="text-xs leading-5 text-slate-500">尽量区分事实、转述和你的判断，有助于提高诊断质量。</p>
        {fieldErrors.content ? <ErrorMessage id="content-error">{fieldErrors.content}</ErrorMessage> : null}
      </div>

      {formError ? <ErrorMessage>{formError}</ErrorMessage> : null}

      <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-5">
        <p className="hidden text-xs text-slate-500 sm:block">保存后将自动进入记录详情</p>
        <Button className="w-full sm:w-auto" disabled={isSubmitting} type="submit">
          {isSubmitting ? "保存中..." : "保存工作记录"}
        </Button>
      </div>
    </form>
  );
}
