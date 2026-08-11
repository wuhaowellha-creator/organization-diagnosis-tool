import type { ButtonHTMLAttributes } from "react";
import { cn } from "./utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: ButtonSize;
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-slate-950 text-white shadow-sm hover:bg-slate-800 active:bg-slate-900",
  secondary: "border border-slate-300 bg-white text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-50",
  ghost: "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm"
};

export function Button({
  className,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-semibold outline-none transition-all focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      type={type}
      {...props}
    />
  );
}
