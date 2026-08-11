"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { downloadCsv } from "../../lib/csv";
import {
  parseWorkRecordImport,
  workRecordImportLimit,
  workRecordImportTemplate
} from "../../lib/work-records/import";
import { recordTypeLabels, type WorkRecordInput } from "../../lib/work-records/validation";
import { Badge, Button, ErrorMessage } from "../common";

type ImportResponse = {
  imported_count?: number;
  message?: string;
  row_errors?: Array<{ errors: Record<string, string>; row: number }>;
};

const maxFileSize = 1024 * 1024;

export function RecordImportPanel() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [records, setRecords] = useState<WorkRecordInput[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  function resetSelection() {
    setFileName("");
    setRecords([]);
    setParseErrors([]);
    setImportError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setImportMessage(null);
    setImportError(null);
    setParseErrors([]);
    setRecords([]);

    if (!file) {
      setFileName("");
      return;
    }

    setFileName(file.name);
    if (!file.name.toLocaleLowerCase().endsWith(".csv")) {
      setParseErrors(["请选择 .csv 格式的文件。"]);
      return;
    }
    if (file.size > maxFileSize) {
      setParseErrors(["CSV 文件不能超过 1 MB。"]);
      return;
    }

    try {
      const result = parseWorkRecordImport(await file.text());
      if (!result.ok) {
        setParseErrors(result.errors);
        return;
      }

      setRecords(result.records);
    } catch {
      setParseErrors(["读取 CSV 文件失败，请重新选择文件。"]);
    }
  }

  async function handleImport() {
    if (records.length === 0) return;

    setIsImporting(true);
    setImportError(null);
    setImportMessage(null);

    try {
      const response = await fetch("/api/records/import", {
        body: JSON.stringify({ records }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      const result = (await response.json()) as ImportResponse;

      if (!response.ok || !result.imported_count) {
        const rowMessage = result.row_errors?.[0]
          ? `第 ${result.row_errors[0].row} 行：${Object.values(result.row_errors[0].errors).join(" ")}`
          : null;
        setImportError(rowMessage ?? result.message ?? "批量导入失败，请稍后重试。");
        return;
      }

      setImportMessage(`已成功导入 ${result.imported_count} 条工作记录。`);
      resetSelection();
      router.refresh();
    } catch {
      setImportError("网络连接异常，请稍后重试。");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <details className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 sm:px-5">
        批量导入工作记录
        <span className="ml-2 font-normal text-slate-500">CSV · 单次最多 {workRecordImportLimit} 条</span>
      </summary>
      <div className="grid gap-4 border-t border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-950">先下载模板，再选择文件</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              支持中文或英文字段名；记录类型支持员工访谈、管理者反馈、团队观察，常见业务分类会自动归类。
              导入前会逐行校验，不通过的文件不会写入数据库。
            </p>
          </div>
          <Button
            onClick={() => downloadCsv("工作记录导入模板.csv", workRecordImportTemplate)}
            size="sm"
            type="button"
            variant="secondary"
          >
            下载 CSV 模板
          </Button>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="work-record-import-file">
            选择 CSV 文件
          </label>
          <input
            accept=".csv,text/csv"
            className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-950 outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
            disabled={isImporting}
            id="work-record-import-file"
            onChange={handleFileChange}
            ref={fileInputRef}
            type="file"
          />
          {fileName ? <p className="text-xs text-slate-500">当前文件：{fileName}</p> : null}
        </div>

        {parseErrors.length > 0 ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <ErrorMessage>{parseErrors[0]}</ErrorMessage>
            {parseErrors.length > 1 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
                {parseErrors.slice(1, 6).map((error) => <li key={error}>{error}</li>)}
              </ul>
            ) : null}
            {parseErrors.length > 6 ? (
              <p className="mt-2 text-xs text-red-700">另有 {parseErrors.length - 6} 条错误，请修正文件后重新选择。</p>
            ) : null}
          </div>
        ) : null}

        {records.length > 0 ? (
          <section className="grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="success">校验通过</Badge>
                <p className="text-sm font-medium text-emerald-900">可导入 {records.length} 条记录</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled={isImporting} onClick={resetSelection} size="sm" type="button" variant="ghost">
                  重新选择
                </Button>
                <Button disabled={isImporting} onClick={handleImport} size="sm" type="button">
                  {isImporting ? "导入中..." : `确认导入 ${records.length} 条`}
                </Button>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-emerald-200 bg-white">
              {records.slice(0, 3).map((record, index) => (
                <div className="grid gap-1 border-b border-emerald-100 px-3 py-2 text-sm last:border-b-0 sm:grid-cols-[120px_1fr_1fr]" key={`${record.subject_name}-${index}`}>
                  <span className="font-medium text-slate-700">{recordTypeLabels[record.record_type]}</span>
                  <span className="text-slate-600">{record.subject_name}</span>
                  <span className="text-slate-500">{record.team_name}</span>
                </div>
              ))}
            </div>
            {records.length > 3 ? <p className="text-xs text-emerald-800">仅预览前 3 条，其余记录将在确认后一起导入。</p> : null}
          </section>
        ) : null}

        <div aria-live="polite">
          {importMessage ? <p className="text-sm font-medium text-emerald-700">{importMessage}</p> : null}
          {importError ? <ErrorMessage>{importError}</ErrorMessage> : null}
        </div>
      </div>
    </details>
  );
}
