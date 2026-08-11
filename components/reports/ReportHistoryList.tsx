"use client";

import { useState } from "react";
import { downloadCsv } from "../../lib/csv";
import { Badge, Button, EmptyState } from "../common";
import { formatReportCreatedAt, type RecentReportOutput } from "../../lib/reports/presentation";

type ReportHistoryListProps = {
  reports: RecentReportOutput[];
};

function formatSourceRange(report: RecentReportOutput) {
  if (!report.source_start_date || !report.source_end_date) {
    return "未记录时间范围";
  }

  return `${report.source_start_date} 至 ${report.source_end_date}`;
}

export function ReportHistoryList({ reports }: ReportHistoryListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const selectedReports = reports.filter((report) => selectedIds.has(report.id));
  const allSelected = reports.length > 0 && selectedReports.length === reports.length;

  async function copyReport(report: RecentReportOutput) {
    try {
      await navigator.clipboard.writeText(report.content);
      setCopiedId(report.id);
    } catch {
      setCopiedId(null);
    }
  }

  function toggleReport(reportId: string) {
    setSelectedIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(reportId)) nextIds.delete(reportId);
      else nextIds.add(reportId);
      return nextIds;
    });
    setExportMessage(null);
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(reports.map((report) => report.id)));
    setExportMessage(null);
  }

  function exportSelectedReports() {
    if (selectedReports.length === 0) return;

    const now = new Date();
    const timestamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      "_",
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0")
    ].join("");

    downloadCsv(`组织诊断报告_${timestamp}.csv`, [
      ["报告标题", "数据开始日期", "数据结束日期", "生成时间", "报告内容"],
      ...selectedReports.map((report) => [
        report.title,
        report.source_start_date,
        report.source_end_date,
        report.created_at,
        report.content
      ])
    ]);
    setExportMessage(`已导出 ${selectedReports.length} 份报告。`);
  }

  if (reports.length === 0) {
    return <EmptyState title="暂无历史报告" description="生成后，最近报告会在这里保留。" />;
  }

  return (
    <div className="grid gap-3">
      <p aria-live="polite" className="sr-only">{copiedId ? "报告文本已复制" : ""}</p>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:px-4">
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-slate-700">
          <input
            checked={allSelected}
            className="size-4 rounded border-slate-300 accent-slate-950"
            onChange={toggleAll}
            type="checkbox"
          />
          全选 {reports.length} 份报告
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-500">已选 {selectedReports.length} 份</span>
          <Button disabled={selectedReports.length === 0} onClick={exportSelectedReports} size="sm" type="button" variant="secondary">
            批量导出 CSV
          </Button>
        </div>
      </div>
      <div aria-live="polite">
        {exportMessage ? <p className="text-sm font-medium text-emerald-700">{exportMessage}</p> : null}
      </div>
      {reports.map((report) => (
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300" key={report.id}>
          <div className="flex items-start gap-3">
            <input
              aria-label={`选择报告：${report.title}`}
              checked={selectedIds.has(report.id)}
              className="mt-1 size-4 shrink-0 rounded border-slate-300 accent-slate-950"
              onChange={() => toggleReport(report.id)}
              type="checkbox"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-950">{report.title}</h3>
                    <Badge>{formatSourceRange(report)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">生成于 {formatReportCreatedAt(report.created_at)}</p>
                </div>
                <Button onClick={() => copyReport(report)} size="sm" type="button" variant="secondary">
                  {copiedId === report.id ? "已复制" : "复制"}
                </Button>
              </div>
              <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{report.content}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
