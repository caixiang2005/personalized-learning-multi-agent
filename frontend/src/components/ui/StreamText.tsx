/**
 * @file StreamText.tsx
 * @description 打字机效果组件，用于逐字展示流式文本（本地模拟或 SSE 片段拼接后的展示）。
 * @backend 联调后文本来源为 streamChat 的 onChunk，本组件仅负责展示动画
 */
import { useEffect, useState } from "react";

interface Props {
  text: string;
  active?: boolean;
  speed?: number;
  onDone?: () => void;
}

export default function StreamText({ text, active = true, speed = 28, onDone }: Props) {
  const [display, setDisplay] = useState(active ? "" : text);

  useEffect(() => {
    if (!active) {
      setDisplay(text);
      return;
    }
    setDisplay("");
    let i = 0;
    const timer = setInterval(() => {
      i = Math.min(i + 2, text.length);
      setDisplay(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, active, speed, onDone]);

  return <span>{display}</span>;
}
