/**
 * @file resources.ts
 * @description 按 id 在学习路径树中查找资源（Mock 阶段用）。
 *
 * 【当前 Mock】仅遍历 store.pathStages，找不到则详情页显示「未找到」。
 * 【待同步后端】ResourceDetail 应直接 fetchResourceDetail(id)，本文件可删除或作缓存辅助。
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
