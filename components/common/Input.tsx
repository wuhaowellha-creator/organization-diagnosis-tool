import type { InputHTMLAttributes } from "react";
import { cn } from "./utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
        className
      )}
      {...props}
    />
  );
}
