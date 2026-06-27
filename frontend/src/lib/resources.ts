/**
 * @file resources.ts
 * @description 按 id 在学习路径树中查找资源（辅助函数）。
 *
 * ResourceDetail 优先 `fetchResourceDetail(id)` 拉取详情；
 * 本文件用于在 pathStages 树内定位资源及所属知识点。
 */

import type { MultimodalResource, PathStage } from "../types";

/** 在路径阶段树中按 id 查找资源 */
export function findResourceById(stages: PathStage[], resourceId: string): MultimodalResource | null {
  for (const stage of stages) {
    for (const topic of stage.topics) {
      const found = topic.resources.find((r) => r.id === resourceId);
      if (found) return found;
    }
  }
  return null;
}

/** 查找资源所属知识点名称 */
export function findTopicNameByResourceId(stages: PathStage[], resourceId: string): string {
  for (const stage of stages) {
    for (const topic of stage.topics) {
      if (topic.resources.some((r) => r.id === resourceId)) return topic.name;
    }
  }
  return "";
}
