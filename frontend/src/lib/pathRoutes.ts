/** 学习路径模块路由（赛题 3：路径规划 + 资源推送） */
export const PATH_HUB_PATH = "/path";
export const PATH_PLAN_PATH = "/path/plan";
export const PATH_VIEW_PATH = "/path/view";

export type PathPlanLocationState = {
  /** 从学习路径入口被引导至画像构建 */
  fromPathGate?: boolean;
};
