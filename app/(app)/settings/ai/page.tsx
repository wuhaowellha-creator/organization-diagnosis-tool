import { requireChatGPTUser } from "../../../chatgpt-auth";
import { AiSettingsForm } from "../../../../components/ai/AiSettingsForm";
import { Badge, Card, EmptyState } from "../../../../components/common";
import { getAiProviderOptions } from "../../../../lib/ai/providers";
import { getAiProviderSetting } from "../../../../lib/ai/settings";

export const dynamic = "force-dynamic";

export default async function AiSettingsPage() {
  const user = await requireChatGPTUser("/settings/ai");
  let setting;

  try {
    setting = await getAiProviderSetting(user.userId);
  } catch {
    return (
      <Card className="max-w-5xl">
        <Badge>AI 接口</Badge>
        <EmptyState title="AI 接口设置读取失败" description="请稍后刷新页面重试。" />
      </Card>
    );
  }

  return (
    <div className="grid max-w-6xl gap-5">
      <section className="hero-panel overflow-hidden rounded-[28px] px-7 py-7 text-white shadow-lg md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">AI provider control</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">选择诊断使用的 AI 接口</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          DeepSeek、OpenAI、OpenRouter 与其他兼容接口均可自行填写密钥。密钥只保存在当前浏览器，调用时临时发送给本站服务端，不写入业务数据库。
        </p>
      </section>
      <Card className="max-w-none">
        <div className="mb-6">
          <Badge>接口设置</Badge>
          <h2 className="mt-3 text-2xl font-semibold leading-tight text-slate-950">诊断生成来源</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            可以使用站点已有的服务端配置，也可以在当前浏览器保存自己的密钥；接口调用失败时会安全回退到内置规则。
          </p>
        </div>
        <AiSettingsForm initialSetting={setting} providers={getAiProviderOptions()} />
      </Card>
    </div>
  );
}
