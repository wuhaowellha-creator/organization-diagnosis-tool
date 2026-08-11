import { notFound } from "next/navigation";
import { requireChatGPTUser } from "../../../chatgpt-auth";
import { Badge, Card, EmptyState } from "../../../../components/common";
import { FollowUpDetail } from "../../../../components/follow-ups/FollowUpDetail";
import { getFollowUp } from "../../../../lib/follow-ups/data";

type PageProps = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

export default async function FollowUpDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireChatGPTUser(`/follow-ups/${id}`);
  let followUp;

  try {
    followUp = await getFollowUp(user.userId, id);
  } catch {
    return (
      <Card className="max-w-3xl">
        <Badge>跟进事项</Badge>
        <EmptyState title="跟进事项读取失败" description="请稍后刷新页面重试。" />
      </Card>
    );
  }

  if (!followUp) notFound();
  return (
    <Card className="max-w-4xl">
      <div className="mb-6">
        <a className="mb-4 flex w-fit text-sm font-medium text-slate-500 hover:text-slate-950" href="/follow-ups">
          返回跟进事项
        </a>
        <Badge>跟进事项</Badge>
        <h2 className="mt-3 text-2xl font-semibold leading-tight text-slate-950">跟进事项详情</h2>
      </div>
      <FollowUpDetail followUp={followUp} />
    </Card>
  );
}
