import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "danger";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-sm px-4 text-sm font-medium transition-opacity duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50",
        variant === "primary" && "bg-primary text-primary-fg hover:opacity-90",
        variant === "ghost" && "border border-border bg-bg-elevated text-fg hover:bg-bg-subtle",
        variant === "danger" && "bg-danger text-primary-fg hover:opacity-90",
        className,
      )}
      {...props}
    />
  );
}
