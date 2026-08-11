import { chatGPTSignInPath, getChatGPTUser } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getChatGPTUser();
  const href = user ? "/records" : chatGPTSignInPath("/records");

  return (
    <main className="landing-grid min-h-screen overflow-hidden bg-slate-950 px-6 py-10 text-white md:px-10">
      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        <span className="font-semibold">组织脉络</span>
        <a className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10" href={href}>
          {user ? "进入工作台" : "使用 ChatGPT 登录"}
        </a>
      </nav>

      <section className="mx-auto grid max-w-7xl items-center gap-12 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-300">Organization intelligence for HRBP</p>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.08] tracking-[-0.04em] md:text-7xl">
            让每一次组织观察，<span className="text-teal-300">都有后续。</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
            从工作记录、辅助诊断、人工确认，到跟进复盘与报告输出。一个为 HRBP 设计的轻量闭环工作台。
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a className="primary-cta" href={href}>{user ? "继续我的工作" : "开始使用"}</a>
            <a className="inline-flex items-center rounded-full px-4 py-3 text-sm font-medium text-slate-300" href="#workflow">查看工作流</a>
          </div>
        </div>

        <div className="relative">
          <div className="relative grid gap-3 rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur md:p-7">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div><p className="text-xs text-slate-400">本周组织信号</p><p className="mt-1 text-lg font-semibold">辅助判断概览</p></div>
              <span className="rounded-full bg-teal-400/15 px-3 py-1 text-xs font-medium text-teal-200">需人工确认</span>
            </div>
            {["目标变化后的协作摩擦", "关键岗位交接风险", "管理反馈闭环不足"].map((label, index) => (
              <div className="flex items-center gap-4 rounded-2xl bg-white/[0.06] p-4" key={label}>
                <div className="min-w-0 flex-1"><p className="text-sm font-medium">{label}</p><p className="mt-1 text-xs text-slate-400">已形成可观察的下一步动作</p></div>
                <span className="text-xs text-slate-500">0{index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-px overflow-hidden rounded-[28px] bg-white/10 md:grid-cols-4" id="workflow">
        {["记录事实", "辅助诊断", "人工确认", "跟进复盘"].map((step, index) => (
          <article className="bg-slate-950 p-6 md:p-7" key={step}>
            <p className="text-xs font-semibold text-teal-300">0{index + 1}</p>
            <h2 className="mt-8 text-xl font-semibold">{step}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{["沉淀访谈、反馈和团队观察", "生成结构化风险判断与动作建议", "保留 HRBP 的最终判断权", "记录状态变化并输出管理摘要"][index]}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
