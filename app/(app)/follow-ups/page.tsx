import { requireChatGPTUser } from "../../chatgpt-auth";
import { Badge, Card, EmptyState } from "../../../components/common";
import { FollowUpList } from "../../../components/follow-ups/FollowUpList";
import { listFollowUps } from "../../../lib/follow-ups/data";

export const dynamic = "force-dynamic";

export default async function FollowUpsPage() {
  const user = await requireChatGPTUser("/follow-ups");
  let followUps;

  try {
    followUps = await listFollowUps(user.userId);
  } catch {
    return (
      <Card className="max-w-5xl">
        <Badge>跟进事项</Badge>
        <EmptyState title="跟进事项读取失败" description="请稍后刷新页面重试。" />
      </Card>
    );
  }

  const openCount = followUps.filter((item) => item.status !== "resolved").length;
  const highCount = followUps.filter((item) => item.risk_level === "high").length;
  const resolvedCount = followUps.filter((item) => item.status === "resolved").length;

  return (
    <div className="grid max-w-6xl gap-5">
      <section className="grid grid-cols-3 gap-3">
        {[["待推进", openCount], ["高风险", highCount], ["已解决", resolvedCount]].map(([label, value]) => (
          <article className="metric-card" key={label}>
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
          </article>
        ))}
      </section>
      <Card className="max-w-none">
        <div className="mb-6">
          <Badge>跟进事项</Badge>
          <h2 className="mt-3 text-2xl font-semibold leading-tight text-slate-950">跟进事项</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">集中查看已确认的中高风险诊断，并持续记录推进状态。</p>
        </div>
        <FollowUpList followUps={followUps} />
      </Card>
    </div>
  );
}
