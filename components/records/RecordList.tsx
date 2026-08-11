"use client";

import { useMemo, useState } from "react";
import { Badge, Button, EmptyState, Input, Select } from "../common";
import {
  diagnosisStatusLabels,
  formatDateTime,
  riskLevelLabels,
  type DiagnosisStatus,
  type WorkRecordListItem
} from "../../lib/work-records/presentation";
import { recordTypeLabels } from "../../lib/work-records/validation";

type RecordListProps = {
  records: WorkRecordListItem[];
};

function getRiskLabel(record: WorkRecordListItem) {
  return record.diagnosis.risk_level ? riskLevelLabels[record.diagnosis.risk_level] : "未诊断";
}

function getRiskVariant(record: WorkRecordListItem) {
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

function getStatusVariant(status: DiagnosisStatus) {
  if (status === "confirmed") {
    return "success";
  }

  if (status === "pending_confirmation") {
    return "warning";
  }

  return "neutral";
}

export function RecordList({ records }: RecordListProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | DiagnosisStatus>("all");
  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("zh-CN");

    return records.filter((record) => {
      const matchesStatus = status === "all" || record.diagnosis.status === status;
      const matchesQuery =
        !normalizedQuery ||
        [record.subject_name, record.team_name, record.content, recordTypeLabels[record.record_type]].some((value) =>
          value.toLocaleLowerCase("zh-CN").includes(normalizedQuery)
        );

      return matchesStatus && matchesQuery;
    });
  }, [query, records, status]);
  const hasFilters = Boolean(query.trim()) || status !== "all";

  if (records.length === 0) {
    return (
      <EmptyState
        className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6"
        title="还没有工作记录"
        description="先记下一次访谈、管理者反馈或团队观察，再进行结构化诊断。"
        action={
          <a
            className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            href="/records/new"
          >
            新建第一条记录
          </a>
        }
      />
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto]">
        <Input
          aria-label="搜索工作记录"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索对象、团队或记录内容"
          type="search"
          value={query}
        />
        <Select
          aria-label="按诊断状态筛选"
          onChange={(event) => setStatus(event.target.value as "all" | DiagnosisStatus)}
          value={status}
        >
          <option value="all">全部诊断状态</option>
          <option value="not_diagnosed">未诊断</option>
          <option value="pending_confirmation">待确认</option>
          <option value="confirmed">已确认</option>
        </Select>
        {hasFilters ? (
          <Button
            onClick={() => {
              setQuery("");
              setStatus("all");
            }}
            type="button"
            variant="ghost"
          >
            清除筛选
          </Button>
        ) : null}
      </div>

      <p aria-live="polite" className="text-xs text-slate-500">
        显示 {filteredRecords.length} / {records.length} 条记录
      </p>

      {filteredRecords.length === 0 ? (
        <EmptyState
          className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6"
          title="没有匹配的记录"
          description="试试更换关键词或诊断状态。"
        />
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {filteredRecords.map((record) => (
              <a
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                href={`/records/${record.id}`}
                key={record.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{record.subject_name}</p>
                    <p className="mt-1 text-sm text-slate-500">{record.team_name} · {recordTypeLabels[record.record_type]}</p>
                  </div>
                  <Badge variant={getRiskVariant(record)}>{getRiskLabel(record)}风险</Badge>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{record.content}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Badge variant={getStatusVariant(record.diagnosis.status)}>
                    {diagnosisStatusLabels[record.diagnosis.status]}
                  </Badge>
                  <span className="text-xs text-slate-400">{formatDateTime(record.created_at)}</span>
                </div>
              </a>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-slate-200 md:block">
            <div className="grid grid-cols-[minmax(220px,1.5fr)_0.8fr_0.8fr_0.7fr_1fr] gap-4 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>记录对象</span>
              <span>类型</span>
              <span>诊断状态</span>
              <span>风险</span>
              <span>更新时间</span>
            </div>
            <div className="divide-y divide-slate-200 bg-white">
              {filteredRecords.map((record) => (
                <a
                  className="grid grid-cols-[minmax(220px,1.5fr)_0.8fr_0.8fr_0.7fr_1fr] items-center gap-4 px-5 py-4 text-sm text-slate-700 transition hover:bg-slate-50"
                  href={`/records/${record.id}`}
                  key={record.id}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-slate-950">{record.subject_name}</span>
                    <span className="mt-1 block truncate text-xs text-slate-500">{record.team_name}</span>
                  </span>
                  <span>{recordTypeLabels[record.record_type]}</span>
                  <span>
                    <Badge variant={getStatusVariant(record.diagnosis.status)}>
                      {diagnosisStatusLabels[record.diagnosis.status]}
                    </Badge>
                  </span>
                  <span>
                    <Badge variant={getRiskVariant(record)}>{getRiskLabel(record)}</Badge>
                  </span>
                  <span className="text-xs text-slate-500">{formatDateTime(record.updated_at)}</span>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
