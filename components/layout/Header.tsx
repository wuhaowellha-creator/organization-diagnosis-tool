import type { ChatGPTUser } from "../../app/chatgpt-auth";
import { chatGPTSignOutPath } from "../../app/chatgpt-auth";
import { Badge } from "../common";

export function Header({ user }: { user: ChatGPTUser }) {
  const isLocalPreview = user.userId === "local-preview-user";

  return (
    <header className="app-header flex min-h-[76px] items-center justify-between gap-4 border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur md:min-h-20 md:px-8">
      <div>
        <p className="app-header__eyebrow mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
          Observe · Diagnose · Follow through
        </p>
        <h1 className="app-header__title text-xl font-semibold leading-tight text-slate-950 md:text-2xl">
          组织诊断工作台
        </h1>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Badge variant="success">{user.displayName}</Badge>
        {isLocalPreview ? null : (
          <a
            className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950 sm:inline-flex"
            href={chatGPTSignOutPath("/")}
          >
            退出
          </a>
        )}
      </div>
    </header>
  );
}
