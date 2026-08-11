import type { HTMLAttributes } from "react";
import { cn } from "./utils";

type ErrorMessageProps = HTMLAttributes<HTMLParagraphElement>;

export function ErrorMessage({ className, ...props }: ErrorMessageProps) {
  return (
    <p
      className={cn("text-sm font-medium leading-6 text-red-700", className)}
      role="alert"
      {...props}
    />
  );
}
