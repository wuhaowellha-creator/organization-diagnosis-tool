import { Badge, Card, LoadingState } from "../../../../components/common";

export default function RecordDetailLoading() {
  return (
    <Card className="max-w-4xl">
      <div className="mb-6">
        <Badge>工作记录</Badge>
        <h2 className="mt-3 text-2xl font-semibold leading-tight text-slate-950">工作记录详情</h2>
      </div>
      <LoadingState label="正在加载工作记录详情..." />
    </Card>
  );
}
