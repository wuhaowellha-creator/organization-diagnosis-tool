"use client";

import { useMemo, useState } from "react";
import { Badge, Button, EmptyState, Input, Select } from "../common";
import {
  followUpRiskLevelLabels,
  formatFollowUpCreatedAt,
  type FollowUpListItem
} from "../../lib/follow-ups/presentation";
import { followUpStatusLabels, type FollowUpStatus } from "../../lib/follow-ups/validation";

type FollowUpListProps = {
  followUps: FollowUpListItem[];
};

function getRiskVariant(riskLevel: FollowUpListItem["risk_level"]) {
  return riskLevel === "high" ? "danger" : "warning";
}

function getStatusVariant(status: FollowUpListItem["status"]) {
  if (status === "resolved") {
    return "success";
  }

  if (status === "in_progress" || status === "under_observation") {
    return "warning";
  }

  return "neutral";
}

export function FollowUpList({ followUps }: FollowUpListProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | FollowUpStatus>("all");
  const filteredFollowUps = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("zh-CN");

    return followUps.filter((followUp) => {
      const matchesStatus = status === "all" || followUp.status === status;
      const matchesQuery =
        !normalizedQuery ||
        [followUp.title, followUp.subject_name, followUp.team_name].some((value) =>
          value.toLocaleLowerCase("zh-CN").includes(normalizedQuery)
        );

      return matchesStatus && matchesQuery;
    });
  }, [followUps, query, status]);
  const hasFilters = Boolean(query.trim()) || status !== "all";

  if (followUps.length === 0) {
    return (
      <EmptyState
        className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6"
        title="暂无跟进事项"
        description="已确认的中高风险诊断，可以在工作记录详情中直接转为跟进事项。"
      />
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto]">
        <Input
          aria-label="搜索跟进事项"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索问题、对象或团队"
          type="search"
          value={query}
        />
        <Select
          aria-label="按跟进状态筛选"
          onChange={(event) => setStatus(event.target.value as "all" | FollowUpStatus)}
          value={status}
        >
          <option value="all">全部跟进状态</option>
          <option value="not_started">未开始</option>
          <option value="in_progress">跟进中</option>
          <option value="under_observation">持续观察</option>
          <option value="resolved">已解决</option>
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
        显示 {filteredFollowUps.length} / {followUps.length} 项跟进
      </p>

      {filteredFollowUps.length === 0 ? (
        <EmptyState
          className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6"
          title="没有匹配的跟进事项"
          description="试试更换关键词或跟进状态。"
        />
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {filteredFollowUps.map((followUp) => (
              <a
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                href={`/follow-ups/${followUp.id}`}
                key={followUp.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{followUp.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{followUp.subject_name} · {followUp.team_name}</p>
                  </div>
                  <Badge variant={getRiskVariant(followUp.risk_level)}>
                    {followUpRiskLevelLabels[followUp.risk_level]}风险
                  </Badge>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Badge variant={getStatusVariant(followUp.status)}>{followUpStatusLabels[followUp.status]}</Badge>
                  <span className="text-xs text-slate-400">{formatFollowUpCreatedAt(followUp.updated_at)}</span>
                </div>
              </a>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-slate-200 md:block">
            <div className="grid grid-cols-[minmax(240px,1.4fr)_1fr_0.8fr_0.7fr_1fr] gap-4 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>问题名称</span>
              <span>对象与团队</span>
              <span>状态</span>
              <span>风险</span>
              <span>最近更新</span>
            </div>
            <div className="divide-y divide-slate-200 bg-white">
              {filteredFollowUps.map((followUp) => (
                <a
                  className="grid grid-cols-[minmax(240px,1.4fr)_1fr_0.8fr_0.7fr_1fr] items-center gap-4 px-5 py-4 text-sm text-slate-700 transition hover:bg-slate-50"
                  href={`/follow-ups/${followUp.id}`}
                  key={followUp.id}
                >
                  <span className="truncate font-semibold text-slate-950">{followUp.title}</span>
                  <span className="min-w-0">
                    <span className="block truncate">{followUp.subject_name}</span>
                    <span className="mt-1 block truncate text-xs text-slate-500">{followUp.team_name}</span>
                  </span>
                  <span>
                    <Badge variant={getStatusVariant(followUp.status)}>{followUpStatusLabels[followUp.status]}</Badge>
                  </span>
                  <span>
                    <Badge variant={getRiskVariant(followUp.risk_level)}>
                      {followUpRiskLevelLabels[followUp.risk_level]}
                    </Badge>
                  </span>
                  <span className="text-xs text-slate-500">{formatFollowUpCreatedAt(followUp.updated_at)}</span>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
