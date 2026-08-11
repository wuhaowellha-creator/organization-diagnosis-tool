import { Badge, Card } from "../../../../components/common";
import { RecordForm } from "../../../../components/records/RecordForm";

export default function NewRecordPage() {
  return (
    <div className="grid max-w-4xl gap-5">
      <div>
        <a className="text-sm font-medium text-slate-500 hover:text-slate-950" href="/records">
          返回工作记录
        </a>
        <div className="mt-4">
          <Badge>新建记录</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">记下一个值得诊断的线索</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            保留尽可能客观的原始信息。保存后，你可以继续生成 AI 诊断并人工确认。
          </p>
        </div>
      </div>
      <Card>
        <RecordForm />
      </Card>
    </div>
  );
}
