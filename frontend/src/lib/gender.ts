/**
 * 性别枚举 · 与 user_info 表 / getProfile 一致
 * 0 未知 · 1 男 · 2 女（数据库存 int2，非中文）
 */
export const GENDER_OPTIONS = [
  { value: "", label: "未设置" },
  { value: "0", label: "未知" },
  { value: "1", label: "男" },
  { value: "2", label: "女" },
] as const;

export function genderToFormValue(gender: number | null | undefined): string {
  if (gender == null) return "";
  return String(gender);
}

export function genderFromFormValue(value: string): number | null {
  if (value === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 2) return null;
  return n;
}

export function genderLabel(gender: number | null | undefined): string {
  if (gender == null) return "未设置";
  const found = GENDER_OPTIONS.find((o) => o.value === String(gender));
  return found?.label ?? "未设置";
}
