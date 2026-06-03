/**
 * 统一页头 · 委托 Scholar 比赛版组件
 */
import type { ReactNode } from "react";
import ScholarPageHeader from "../scholar/ScholarPageHeader";

interface Props {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: ReactNode;
}

export default function PageHeader(props: Props) {
  return <ScholarPageHeader {...props} />;
}
