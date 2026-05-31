/**
 * 账号信息列表（MOOC 风格：标签 · 值 · 右侧操作）。
 */
import { Link2, Pencil, RefreshCw } from "lucide-react";

export type AccountInfoRow = {
  label: string;
  value: string;
  valueMuted?: boolean;
  action?: {
    label: string;
    icon?: "edit" | "refresh" | "unlink";
    onClick?: () => void;
    disabled?: boolean;
    href?: string;
  };
};

type Props = {
  title?: string;
  rows: AccountInfoRow[];
  dense?: boolean;
  className?: string;
};

const iconMap = {
  edit: Pencil,
  refresh: RefreshCw,
  unlink: Link2,
} as const;

export default function AccountInfoSection({
  title = "账号信息",
  rows,
  dense = false,
  className = "",
}: Props) {
  return (
    <section className={className}>
      <h2
        className={`font-semibold text-gray-900 dark:text-gray-100 ${dense ? "text-sm mb-4" : "text-base mb-8"}`}
      >
        {title}
      </h2>
      <ul className={dense ? "space-y-4" : "space-y-7"}>
        {rows.map((row) => (
          <li
            key={row.label}
            className={`grid items-center gap-6 ${dense ? "grid-cols-[4.5rem_1fr_auto] text-xs" : "grid-cols-[5.5rem_minmax(0,1fr)_auto] text-sm"}`}
          >
            <span className="text-gray-700 dark:text-gray-300">{row.label}</span>
            <span
              className={`${row.valueMuted ? "text-gray-400" : "text-gray-800 dark:text-gray-200"}`}
            >
              {row.value}
            </span>
            {row.action ? <ActionButton {...row.action} dense={dense} /> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ActionButton({
  label,
  icon = "edit",
  onClick,
  disabled,
  href,
  dense,
}: NonNullable<AccountInfoRow["action"]> & { dense?: boolean }) {
  const Icon = iconMap[icon];
  const cls = `inline-flex items-center gap-1 justify-self-end font-medium text-primary hover:text-primary/80 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors whitespace-nowrap ${dense ? "text-xs" : "text-sm"}`;

  if (href && !disabled) {
    return (
      <a href={href} className={cls}>
        <Icon size={dense ? 13 : 14} strokeWidth={1.75} />
        {label}
      </a>
    );
  }

  return (
    <button type="button" disabled={disabled} onClick={onClick} className={cls}>
      <Icon size={dense ? 13 : 14} strokeWidth={1.75} />
      {label}
    </button>
  );
}

export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length <= 2) return `${local[0]}***${domain}`;
  return `${local[0]}${"*".repeat(Math.min(local.length - 2, 5))}${local.slice(-1)}${domain}`;
}
