import { notFound } from "next/navigation";
import { requireChatGPTUser } from "../../../chatgpt-auth";
import { Badge, Card, EmptyState } from "../../../../components/common";
import { RecordDetail } from "../../../../components/records/RecordDetail";
import { getWorkRecord } from "../../../../lib/work-records/data";

type PageProps = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

export default async function RecordDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireChatGPTUser(`/records/${id}`);
  let record;

  try {
    record = await getWorkRecord(user.userId, id);
  } catch {
    return (
      <Card className="max-w-3xl">
        <Badge>工作记录</Badge>
        <EmptyState title="工作记录读取失败" description="请稍后刷新页面重试。" />
      </Card>
    );
  }

  if (!record) notFound();
  return (
    <Card className="max-w-4xl">
      <div className="mb-6">
        <a className="mb-4 flex w-fit text-sm font-medium text-slate-500 hover:text-slate-950" href="/records">
          返回工作记录
        </a>
        <Badge>工作记录</Badge>
        <h2 className="mt-3 text-2xl font-semibold leading-tight text-slate-950">工作记录详情</h2>
      </div>
      <RecordDetail record={record} />
    </Card>
  );
}
