import { cn } from "./utils";

type LoadingStateProps = {
  className?: string;
  label?: string;
};

export function LoadingState({ className, label = "加载中..." }: LoadingStateProps) {
  return (
    <div
      className={cn("inline-flex items-center gap-2 text-sm leading-6 text-slate-600", className)}
      role="status"
    >
      <span className="h-2 w-2 rounded-full bg-slate-500" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
