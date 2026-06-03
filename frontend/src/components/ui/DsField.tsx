import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

type BaseProps = {
  label: string;
  hint?: string;
  required?: boolean;
};

type InputProps = InputHTMLAttributes<HTMLInputElement> & BaseProps;
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & BaseProps;

function Shell({ label, hint, required, children }: BaseProps & { children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[#1D2129] dark:text-gray-100">
        {required && <span className="text-red-500 mr-0.5">*</span>}
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-xs text-[#86909C] dark:text-gray-400 leading-relaxed">
          {hint}
        </span>
      )}
    </label>
  );
}

export function DsInput({ label, hint, required, className = "", ...props }: InputProps) {
  return (
    <Shell label={label} hint={hint} required={required}>
      <input className={`input-field ${className}`.trim()} {...props} />
    </Shell>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & BaseProps;

export function DsSelect({ label, hint, required, className = "", children, ...props }: SelectProps) {
  return (
    <Shell label={label} hint={hint} required={required}>
      <select className={`input-field ${className}`.trim()} {...props}>
        {children}
      </select>
    </Shell>
  );
}

export function DsTextarea({
  label,
  hint,
  required,
  className = "",
  rows = 3,
  ...props
}: TextareaProps) {
  return (
    <Shell label={label} hint={hint} required={required}>
      <textarea
        className={`input-field resize-none min-h-[5.5rem] ${className}`.trim()}
        rows={rows}
        {...props}
      />
    </Shell>
  );
}
