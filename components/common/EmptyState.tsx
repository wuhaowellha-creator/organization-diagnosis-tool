import type { ReactNode } from "react";
import { cn } from "./utils";

type EmptyStateProps = {
  action?: ReactNode;
  className?: string;
  description?: string;
  title: string;
};

export function EmptyState({ action, className, description, title }: EmptyStateProps) {
  return (
    <div className={cn("flex max-w-2xl flex-col items-start gap-2", className)}>
      <h2 className="text-2xl font-bold tracking-tight text-slate-950">{title}</h2>
      {description ? <p className="text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{description}</p> : null}
      {action ? <div className="mt-2 flex flex-wrap gap-3">{action}</div> : null}
    </div>
  );
}
