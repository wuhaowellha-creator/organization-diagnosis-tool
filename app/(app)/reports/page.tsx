import { requireChatGPTUser } from "../../chatgpt-auth";
import { Badge, Card, EmptyState } from "../../../components/common";
import { ReportGenerator } from "../../../components/reports/ReportGenerator";
import { listRecentReports } from "../../../lib/reports/data";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await requireChatGPTUser("/reports");
  let recentReports;

  try {
    recentReports = await listRecentReports(user.userId);
  } catch {
    return (
      <Card className="max-w-5xl">
        <Badge>报告生成</Badge>
        <EmptyState title="报告记录读取失败" description="请稍后刷新页面重试。" />
      </Card>
    );
  }

  return (
    <div className="grid w-full max-w-none gap-5">
      <section className="rounded-[28px] bg-gradient-to-br from-teal-700 to-slate-950 px-7 py-7 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200">Executive-ready output</p>
        <h2 className="mt-3 text-3xl font-semibold">把已确认判断，变成清晰的管理摘要</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-teal-50/80">按时间范围汇总重点问题、风险判断、建议动作、跟进状态和下一步计划。</p>
      </section>
      <Card className="max-w-none">
        <div className="mb-6">
          <Badge>报告生成</Badge>
          <h2 className="mt-3 text-2xl font-semibold leading-tight text-slate-950">生成诊断摘要</h2>
        </div>
        <ReportGenerator recentReports={recentReports} />
      </Card>
    </div>
  );
}
