import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, hasError = false, ...props },
  ref,
) {
  const classes = ["input", hasError ? "has-error" : "", className].filter(Boolean).join(" ");
  return <input {...props} ref={ref} className={classes} />;
});

export interface FormFieldProps {
  id: string;
  label: string;
  helperText?: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ id, label, helperText, error, children }: FormFieldProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="field-error" role="alert">{error}</p>}
      {!error && helperText && <p id={`${id}-help`} className="field-hint">{helperText}</p>}
    </div>
  );
}