import { requireChatGPTUser } from "../../chatgpt-auth";
import { Badge, Card, EmptyState } from "../../../components/common";
import { RecordImportPanel } from "../../../components/records/RecordImportPanel";
import { RecordList } from "../../../components/records/RecordList";
import { listWorkRecords } from "../../../lib/work-records/data";

export const dynamic = "force-dynamic";

export default async function RecordsPage() {
  const user = await requireChatGPTUser("/records");
  let records;

  try {
    records = await listWorkRecords(user.userId);
  } catch {
    return (
      <Card className="max-w-5xl">
        <Badge>工作记录</Badge>
        <EmptyState title="工作记录读取失败" description="请稍后刷新页面重试。" />
      </Card>
    );
  }

  const pendingCount = records.filter((record) => record.diagnosis.status === "pending_confirmation").length;
  const confirmedCount = records.filter((record) => record.diagnosis.status === "confirmed").length;
  const highRiskCount = records.filter((record) => record.diagnosis.risk_level === "high").length;

  return (
    <div className="grid max-w-6xl gap-5">
      <section className="hero-panel overflow-hidden rounded-[28px] bg-slate-950 px-6 py-7 text-white shadow-xl shadow-slate-200/60 md:px-8 md:py-8">
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">Workspace overview</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">从零散观察，到可推进的组织判断</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
              记录访谈与反馈，生成辅助诊断，人工确认后转入跟进，最后沉淀为可复制的管理摘要。
            </p>
          </div>
          <a className="primary-cta" href="/records/new">新建工作记录</a>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="工作台概览">
        {[
          ["全部记录", records.length, "累计事实输入"],
          ["待人工确认", pendingCount, "请优先复核"],
          ["已确认诊断", confirmedCount, "可进入后续流程"],
          ["高风险事项", highRiskCount, "建议及时跟进"]
        ].map(([label, value, hint]) => (
          <article className="metric-card" key={label}>
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
            <p className="mt-1 text-xs text-slate-400">{hint}</p>
          </article>
        ))}
      </section>

      <Card className="max-w-none">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge>工作记录</Badge>
            <h2 className="mt-3 text-2xl font-semibold leading-tight text-slate-950">最近记录</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">搜索、筛选并继续处理你的组织观察。</p>
          </div>
        </div>
        <RecordImportPanel />
        <RecordList records={records} />
      </Card>
    </div>
  );
}
