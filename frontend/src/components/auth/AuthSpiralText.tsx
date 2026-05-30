/**
 * 环形文字装饰：绕品牌图标，配色对齐系统主色（#165DFF / #36D399）。
 */
import { useId } from "react";

const RING_OUTER =
  "智慧学习中心 ¶ 个性化学习 ¶ 对话式引导 † 六维动态画像 † 多模态资源 † 自适应路径 † ";
const RING_INNER =
  "PERSONALIZED LEARNING ¶ MULTI-AGENT ¶ HIGHER EDUCATION ¶ LEARNING PATH ¶ ";

type Props = {
  className?: string;
};

export default function AuthSpiralText({ className = "" }: Props) {
  const outerId = useId().replace(/:/g, "");
  const innerId = useId().replace(/:/g, "");
  const outerGrad = `${outerId}-grad`;
  const innerGrad = `${innerId}-grad`;

  return (
    <div className={`auth-spiral auth-spiral--emblem ${className}`.trim()} aria-hidden>
      <svg viewBox="0 0 400 400" className="auth-spiral__svg" role="presentation">
        <defs>
          <path
            id={outerId}
            d="M 200,200 m -148,0 a 148,148 0 1,1 296,0 a 148,148 0 1,1 -296,0"
          />
          <path
            id={innerId}
            d="M 200,200 m -102,0 a 102,102 0 1,0 204,0 a 102,102 0 1,0 -204,0"
          />
          <linearGradient id={outerGrad} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#165dff" />
            <stop offset="55%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#36d399" />
          </linearGradient>
          <linearGradient id={innerGrad} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#36d399" />
            <stop offset="50%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#165dff" />
          </linearGradient>
        </defs>
        <g className="auth-spiral__ring auth-spiral__ring--outer">
          <text className="auth-spiral__text" fill={`url(#${outerGrad})`}>
            <textPath href={`#${outerId}`} startOffset="0%">
              {RING_OUTER.repeat(2)}
            </textPath>
          </text>
        </g>
        <g className="auth-spiral__ring auth-spiral__ring--inner">
          <text className="auth-spiral__text auth-spiral__text--inner" fill={`url(#${innerGrad})`}>
            <textPath href={`#${innerId}`} startOffset="0%">
              {RING_INNER.repeat(2)}
            </textPath>
          </text>
        </g>
      </svg>
    </div>
  );
}
