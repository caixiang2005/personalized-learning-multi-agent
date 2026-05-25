/**
 * @file Skeleton.tsx
 * @description 加载占位骨架屏，用于对话等待、列表加载等场景。
 * @backend 无；在真实请求 pending 时显示，数据返回后隐藏
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

/** 对话消息加载中的骨架布局 */
export function MessageSkeleton() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
