import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  loadingLabel,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const classes = ["btn", `btn-${variant}`, size !== "md" ? `btn-${size}` : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      className={classes}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
    >
      {isLoading && <span className="button-spinner" aria-hidden="true" />}
      {isLoading ? (loadingLabel ?? children) : children}
    </button>
  );
}