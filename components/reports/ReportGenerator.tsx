"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, EmptyState, ErrorMessage, Input } from "../common";
import type { RecentReportOutput } from "../../lib/reports/presentation";
import {
  validateReportSummaryInput,
  type ReportSummaryInput,
  type ReportSummaryInputErrors
} from "../../lib/reports/validation";
import { ReportHistoryList } from "./ReportHistoryList";

type ReportGeneratorProps = {
  recentReports: RecentReportOutput[];
};

type ReportResponse = {
  empty?: boolean;
  errors?: ReportSummaryInputErrors;
  message?: string;
  report?: RecentReportOutput;
};

function getTodayDate() {
  return formatLocalDate(new Date());
}

function getSevenDaysAgoDate() {
  const date = new Date();
  date.setDate(date.getDate() - 6);

  return formatLocalDate(date);
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonthStartDate() {
  const date = new Date();
  date.setDate(1);

  return formatLocalDate(date);
}

function getThirtyDaysAgoDate() {
  const date = new Date();
  date.setDate(date.getDate() - 29);

  return formatLocalDate(date);
}

export function ReportGenerator({ recentReports }: ReportGeneratorProps) {
  const router = useRouter();
  const [values, setValues] = useState<ReportSummaryInput>({
    end_date: getTodayDate(),
    start_date: getSevenDaysAgoDate()
  });
  const [fieldErrors, setFieldErrors] = useState<ReportSummaryInputErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
  const [generatedReport, setGeneratedReport] = useState<RecentReportOutput | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof ReportSummaryInput, value: string) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value
    }));
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined
    }));
    setFormError(null);
    setEmptyMessage(null);
    setCopyMessage(null);
  }

  function applyDateRange(startDate: string, endDate = getTodayDate()) {
    setValues({
      end_date: endDate,
      start_date: startDate
    });
    setFieldErrors({});
    setFormError(null);
    setEmptyMessage(null);
    setCopyMessage(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateReportSummaryInput(values);

    if (!validation.ok) {
      setFieldErrors(validation.errors);
      setFormError("请检查报告时间范围。");
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    setEmptyMessage(null);
    setGeneratedReport(null);
    setCopyMessage(null);

    try {
      const response = await fetch("/api/reports/summary", {
        body: JSON.stringify(validation.data),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      const result = (await response.json()) as ReportResponse;

      if (!response.ok) {
        setFieldErrors(result.errors ?? {});
        setFormError(result.message ?? "生成报告失败，请稍后重试。");
        return;
      }

      if (result.empty) {
        setEmptyMessage(result.message ?? "当前时间范围暂无可生成内容。");
        return;
      }

      if (!result.report) {
        setFormError("报告生成结果为空，请稍后重试。");
        return;
      }

      setGeneratedReport(result.report);
      router.refresh();
    } catch {
      setFormError("网络连接异常，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!generatedReport) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedReport.content);
      setCopyMessage("报告文本已复制。");
    } catch {
      setCopyMessage("复制失败，请手动选择报告文本。");
    }
  }

  return (
    <div className="grid gap-8">
      <form className="grid gap-5 rounded-xl bg-slate-50 p-4 sm:p-5" noValidate onSubmit={handleSubmit}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-950">选择报告范围</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">仅统计已经人工确认的诊断和相关跟进进展。</p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="常用时间范围">
            <Button onClick={() => applyDateRange(getSevenDaysAgoDate())} size="sm" type="button" variant="secondary">
              近 7 天
            </Button>
            <Button onClick={() => applyDateRange(getThirtyDaysAgoDate())} size="sm" type="button" variant="secondary">
              近 30 天
            </Button>
            <Button onClick={() => applyDateRange(getMonthStartDate())} size="sm" type="button" variant="secondary">
              本月
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium leading-6 text-slate-700" htmlFor="start_date">
              开始日期
            </label>
            <Input
              disabled={isSubmitting}
              id="start_date"
              onChange={(event) => updateField("start_date", event.target.value)}
              type="date"
              value={values.start_date}
            />
            {fieldErrors.start_date ? <ErrorMessage>{fieldErrors.start_date}</ErrorMessage> : null}
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium leading-6 text-slate-700" htmlFor="end_date">
              结束日期
            </label>
            <Input
              disabled={isSubmitting}
              id="end_date"
              onChange={(event) => updateField("end_date", event.target.value)}
              type="date"
              value={values.end_date}
            />
            {fieldErrors.end_date ? <ErrorMessage>{fieldErrors.end_date}</ErrorMessage> : null}
          </div>
        </div>

        {formError ? <ErrorMessage>{formError}</ErrorMessage> : null}

        <div className="flex justify-end border-t border-slate-200 pt-5">
          <Button className="w-full sm:w-auto" disabled={isSubmitting} type="submit">
            {isSubmitting ? "生成中..." : "生成报告"}
          </Button>
        </div>
      </form>

      {emptyMessage ? <EmptyState title={emptyMessage} /> : null}

      {generatedReport ? (
        <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">报告预览</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">生成后已保存到报告历史记录。</p>
            </div>
            <Button disabled={!generatedReport} onClick={handleCopy} type="button" variant="secondary">
              复制报告
            </Button>
          </div>
          <div aria-live="polite">{copyMessage ? <p className="text-sm font-medium text-emerald-700">{copyMessage}</p> : null}</div>
          <pre className="max-h-[520px] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 whitespace-pre-wrap text-sm leading-7 text-slate-800">
            {generatedReport.content}
          </pre>
        </section>
      ) : null}

      <section className="grid gap-4 border-t border-slate-200 pt-6">
        <div>
          <h3 className="text-lg font-bold text-slate-950">最近生成</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">可以复制单份报告，或勾选多份批量导出 CSV。</p>
        </div>
        <ReportHistoryList reports={recentReports} />
      </section>
    </div>
  );
}
