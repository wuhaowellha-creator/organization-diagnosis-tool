import type { HTMLAttributes } from "react";
import { cn } from "./utils";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6", className)}
      {...props}
    />
  );
}
