import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md";
  hover?: boolean;
};

const padCls = {
  none: "p-0",
  sm: "!p-4",
  md: "",
};

export default function DsCard({ children, className = "", padding = "md", hover }: Props) {
  return (
    <div
      className={[
        "section-card",
        padCls[padding],
        hover ? "card-hover" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
