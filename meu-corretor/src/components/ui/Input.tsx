import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

const baseClass = "w-full rounded-xl border border-base bg-surface text-primary placeholder:text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-brand-yellow-DEFAULT focus:border-transparent";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-secondary">{label}</label>}
      <input
        ref={ref}
        className={clsx(baseClass, "px-4 py-2.5 text-sm", error && "border-red-500", className)}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-secondary">{label}</label>}
      <textarea
        ref={ref}
        className={clsx(baseClass, "px-4 py-3 text-sm resize-y min-h-[120px]", error && "border-red-500", className)}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";
