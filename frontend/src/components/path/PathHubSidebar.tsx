import { Link } from "react-router-dom";
import {
  BrainCircuit,
  Signpost,
  Layers,
  CheckCircle2,
  Circle,
} from "lucide-react";
import AnimeReveal from "../motion/AnimeReveal";
import { PATH_PLAN_PATH, PATH_VIEW_PATH } from "../../lib/pathRoutes";

const CHECKLIST = [
  { icon: BrainCircuit, label: "完成学习画像", doneKey: "profile" as const },
  { icon: Signpost, label: "路径智能体规划", doneKey: "plan" as const },
  { icon: Layers, label: "按阶段学习", doneKey: "learn" as const },
];

type Props = {
  profileReady: boolean;
  hasPath: boolean;
};

export default function PathHubSidebar({ profileReady, hasPath }: Props) {
  const stepDone = (key: (typeof CHECKLIST)[number]["doneKey"]) => {
    if (key === "profile") return profileReady;
    if (key === "plan") return hasPath;
    return hasPath;
  };

  return (
    <>
      <AnimeReveal as="section" className="section-card dash-panel" y={14} delay={110}>
        <h2 className="dash-panel__title">准备清单</h2>
        <ol className="dash-sidebar-steps">
          {CHECKLIST.map((step) => {
            const done = stepDone(step.doneKey);
            return (
              <li key={step.label} className={done ? "dash-sidebar-steps__item--done" : ""}>
                {done ? <CheckCircle2 size={16} aria-hidden /> : <Circle size={16} aria-hidden />}
                <span className="dash-sidebar-steps__head">
                  <step.icon size={14} aria-hidden />
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </AnimeReveal>

      <AnimeReveal as="section" className="section-card dash-panel" y={14} delay={130}>
        <h2 className="dash-panel__title">快捷入口</h2>
        <div className="dash-sidebar-links">
          {hasPath ? (
            <Link to={PATH_VIEW_PATH} className="btn-primary w-full justify-center text-sm no-underline">
              进入我的路径
            </Link>
          ) : (
            <Link to={PATH_PLAN_PATH} className="btn-primary w-full justify-center text-sm no-underline">
              路径智能体规划
            </Link>
          )}
          <Link to="/profile" className="btn-secondary w-full justify-center text-sm no-underline">
            查看学习画像
          </Link>
        </div>
      </AnimeReveal>
    </>
  );
}
