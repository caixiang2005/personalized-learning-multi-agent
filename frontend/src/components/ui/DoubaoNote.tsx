/**
 * @file DoubaoNote.tsx
 * @description 豆包式补充说明 / 提示块（浅底、小字、自动换行）
 */
import type { ReactNode } from "react";
import { Info } from "lucide-react";

interface Props {
  children: ReactNode;
}

export default function DoubaoNote({ children }: Props) {
  return (
    <div className="doubao-note" role="note">
      <Info className="doubao-note__icon" size={14} strokeWidth={2} aria-hidden />
      <div className="doubao-note__body">{children}</div>
    </div>
  );
}

/** 判断围栏代码块是否实为说明文字（非代码） */
export function isProseNote(className: string | undefined, text: string): boolean {
  const lang = className?.replace(/^language-/, "").trim().toLowerCase() ?? "";
  if (lang && lang !== "text") return false;

  const t = text.trim();
  if (!t) return false;

  const codeLine =
    /^\s*(import |from |def |class |function |const |let |var |#include|public |private |package |using |<?php|fn |func |SELECT |INSERT |CREATE |<!DOCTYPE|<html|<\/)/i;
  const lines = t.split("\n");
  const codeLike = lines.filter((l) => codeLine.test(l)).length;
  if (codeLike >= 1 && lines.length <= 3) return false;
  if (codeLike >= 2) return false;

  if (/[\u4e00-\u9fff]/.test(t)) return true;

  return t.length < 160 && !/[{};=`]/.test(t);
}
