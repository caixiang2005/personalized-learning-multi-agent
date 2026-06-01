import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  fullWidth?: boolean;
};

const variantCls = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-[0.625rem] px-4 py-2 text-sm font-medium text-[#4E5969] transition-colors hover:text-primary hover:bg-primary/5 cursor-pointer dark:text-gray-300 dark:hover:text-blue-300",
  danger:
    "inline-flex items-center justify-center gap-2 rounded-[0.625rem] px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors cursor-pointer dark:bg-red-950/30 dark:border-red-900/40 dark:text-red-400",
};

const sizeCls = {
  sm: "!py-2 !px-3 !text-xs",
  md: "",
};

export default function DsButton({
  children,
  variant = "primary",
  size = "md",
  fullWidth,
  className = "",
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={[
        variantCls[variant],
        sizeCls[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
