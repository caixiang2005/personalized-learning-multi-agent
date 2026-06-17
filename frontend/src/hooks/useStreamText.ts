/**
 * @file useStreamText.ts
 * @description 统一的打字机流式文字 Hook — 让 AI 回复逐字打出，提升用户体验
 */
import { useCallback, useEffect, useRef, useState } from "react";

interface UseStreamTextOptions {
  /** 初始文字（非流式部分） */
  initialText?: string;
  /** 每个字的延迟（ms），默认 30 */
  speed?: number;
  /** 完成后是否保留完整文字 */
  keepFull?: boolean;
}

interface UseStreamTextReturn {
  /** 当前显示的文字（逐渐增加） */
  displayText: string;
  /** 是否正在流式输出 */
  isStreaming: boolean;
  /** 是否已完成 */
  isDone: boolean;
  /** 开始流式输出 */
  start: (text: string) => void;
  /** 追加流式输出 */
  append: (chunk: string) => void;
  /** 立即完成 */
  complete: () => void;
  /** 重置 */
  reset: () => void;
}

export function useStreamText(options: UseStreamTextOptions = {}): UseStreamTextReturn {
  const { initialText = "", speed = 30, keepFull = true } = options;
  const [displayText, setDisplayText] = useState(initialText);
  const [targetText, setTargetText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDone, setIsDone] = useState(true);
  const indexRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback((text: string) => {
    clearTimer();
    setTargetText(text);
    indexRef.current = 0;
    setIsStreaming(true);
    setIsDone(false);
    setDisplayText("");

    timerRef.current = window.setInterval(() => {
      indexRef.current += 1;
      const currentIndex = indexRef.current;

      if (currentIndex >= text.length) {
        clearTimer();
        setIsStreaming(false);
        setIsDone(true);
        setDisplayText(text);
        return;
      }

      setDisplayText(text.slice(0, currentIndex));
    }, speed);
  }, [clearTimer, speed]);

  const append = useCallback((chunk: string) => {
    setTargetText(prev => {
      const newTarget = prev + chunk;
      // 如果当前不在流式输出，立即显示
      if (!isStreaming) {
        setDisplayText(newTarget);
      }
      return newTarget;
    });
  }, [isStreaming]);

  const complete = useCallback(() => {
    clearTimer();
    if (keepFull && targetText) {
      setDisplayText(targetText);
    }
    setIsStreaming(false);
    setIsDone(true);
  }, [clearTimer, keepFull, targetText]);

  const reset = useCallback(() => {
    clearTimer();
    setDisplayText(initialText);
    setTargetText("");
    indexRef.current = 0;
    setIsStreaming(false);
    setIsDone(true);
  }, [clearTimer, initialText]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    displayText,
    isStreaming,
    isDone,
    start,
    append,
    complete,
    reset,
  };
}
