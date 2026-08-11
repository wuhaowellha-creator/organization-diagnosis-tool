import type { ReactNode } from "react";
import type { ChatGPTUser } from "../../app/chatgpt-auth";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

type AppShellProps = {
  children: ReactNode;
  user: ChatGPTUser;
};

export function AppShell({ children, user }: AppShellProps) {
  return (
    <div className="app-shell min-h-screen bg-slate-50 text-slate-800 md:flex">
      <Sidebar />
      <div className="app-shell__body flex min-w-0 flex-1 flex-col">
        <Header user={user} />
        <main className="app-shell__main flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
