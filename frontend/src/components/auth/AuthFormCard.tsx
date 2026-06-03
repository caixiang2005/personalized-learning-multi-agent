import type { ReactNode } from "react";

type AuthFormCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  tip?: { text: string; success: boolean };
};

export function AuthFormCard({ title, subtitle, children, footer, tip }: AuthFormCardProps) {
  return (
    <div className="login-glass-card scholar-auth-card landing-enter">
      <header className="login-glass-card__head">
        <h2 className="login-glass-card__title">{title}</h2>
        <p className="login-glass-card__sub">{subtitle}</p>
      </header>
      {children}
      {tip?.text && (
        <p
          className={`login-form-tip ${tip.success ? "login-form-tip--success" : "login-form-tip--error"}`}
          role="status"
        >
          {tip.text}
        </p>
      )}
      {footer && <div className="login-card-foot">{footer}</div>}
    </div>
  );
}

type AuthModeTabsProps<T extends string> = {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
  compact?: boolean;
};

export function AuthModeTabs<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  compact,
}: AuthModeTabsProps<T>) {
  const activeIndex = Math.max(0, options.findIndex((o) => o.value === value));

  return (
    <div
      className={`login-mode-tabs${compact ? " login-mode-tabs--compact" : ""}${options.length === 3 ? " login-mode-tabs--triple" : ""}`}
      role="tablist"
      aria-label={ariaLabel}
      data-active-index={activeIndex}
      data-tab-count={options.length}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          className={`login-mode-tabs__btn${value === opt.value ? " login-mode-tabs__btn--active" : ""}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
      <span className="login-mode-tabs__slider" aria-hidden />
    </div>
  );
}
