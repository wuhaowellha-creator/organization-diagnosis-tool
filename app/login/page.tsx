import { redirect } from "next/navigation";
import { chatGPTSignInPath, getChatGPTUser } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getChatGPTUser();
  if (user) redirect("/records");

  return (
    <main className="landing-grid grid min-h-screen place-items-center bg-slate-950 px-6 py-12 text-white">
      <section className="w-full max-w-xl rounded-[32px] border border-white/10 bg-white/5 p-8 text-center backdrop-blur md:p-12">
        <p className="text-sm font-semibold text-teal-300">组织脉络</p>
        <h1 className="mt-4 text-3xl font-semibold">使用 ChatGPT 继续</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">你的工作记录、诊断和跟进事项将只与你当前的 ChatGPT 身份关联。</p>
        <a className="primary-cta mt-7 w-full justify-center" href={chatGPTSignInPath("/records")}>登录并进入工作台</a>
      </section>
    </main>
  );
}
