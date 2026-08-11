"use client";

import { usePathname } from "next/navigation";

const navItems = [
  { href: "/records", index: "01", label: "工作记录", hint: "捕捉事实" },
  { href: "/follow-ups", index: "02", label: "跟进事项", hint: "推动行动" },
  { href: "/reports", index: "03", label: "报告生成", hint: "沉淀结论" }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="sidebar border-b border-slate-800 bg-slate-950 px-4 py-4 text-white md:min-h-screen md:w-[252px] md:border-b-0 md:border-r md:py-6"
      aria-label="主导航"
    >
      <a className="sidebar__brand mb-5 flex items-center px-2 md:mb-9" href="/records">
        <span>
          <span className="block text-base font-semibold">组织脉络</span>
          <span className="block text-[11px] tracking-[0.16em] text-slate-400">HRBP COPILOT</span>
        </span>
      </a>
      <nav className="sidebar__nav grid grid-cols-3 gap-2 md:grid-cols-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <a
              aria-current={isActive ? "page" : undefined}
              className={`sidebar__link group rounded-xl px-3 py-2.5 transition md:flex md:items-center md:gap-3 ${
                isActive ? "bg-white text-slate-950 shadow-sm" : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
              href={item.href}
              key={item.href}
            >
              <span className={`hidden text-xs font-semibold md:block ${isActive ? "text-teal-700" : "text-slate-500"}`}>
                {item.index}
              </span>
              <span className="block text-center md:text-left">
                <span className="block text-sm font-medium">{item.label}</span>
                <span className={`hidden text-xs md:block ${isActive ? "text-slate-500" : "text-slate-500"}`}>
                  {item.hint}
                </span>
              </span>
            </a>
          );
        })}
      </nav>
      <div className="mt-10 hidden rounded-2xl border border-white/10 bg-white/5 p-4 md:block">
        <p className="text-xs font-semibold text-teal-300">判断原则</p>
        <p className="mt-2 text-xs leading-5 text-slate-400">记录事实，审慎诊断，人工确认，持续复盘。</p>
      </div>
    </aside>
  );
}
