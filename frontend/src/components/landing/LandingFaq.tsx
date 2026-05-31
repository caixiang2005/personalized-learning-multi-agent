/**
 * 门户常见问题手风琴。
 */
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import LandingReveal from "./LandingReveal";

const faqs = [
  {
    q: "未登录可以使用哪些功能？",
    a: "可在门户页体验访客智能助手，进行学习方向相关的简短对话。完整的多轮画像构建、资源生成与学习路径需登录后使用。",
  },
  {
    q: "支持哪些登录方式？",
    a: "支持邮箱密码、邮箱验证码与用户名密码登录。新用户可在注册页通过邮箱验证码完成注册。",
  },
  {
    q: "什么是学习画像？",
    a: "系统通过对话抽取专业背景、学习目标、薄弱点等 6 维特征，并随学习过程动态更新，用于个性化推荐与路径规划。",
  },
  {
    q: "登录后如何开始学习？",
    a: "登录进入学习中心后，与智能体描述你的学习背景，系统将生成画像并推送阶段性学习路径与配套资源。",
  },
];

export default function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <LandingReveal as="section" className="landing-faq landing-section-frame" delay={120}>
      <h2 className="landing-faq__title">常见问题</h2>
      <ul className="landing-faq__list">
        {faqs.map((item, i) => {
          const open = openIndex === i;
          const id = `landing-faq-panel-${i}`;
          const btnId = `landing-faq-trigger-${i}`;

          return (
            <li key={item.q} className="landing-faq__item landing-glass-card">
              <button
                type="button"
                id={btnId}
                className="landing-faq__trigger"
                aria-expanded={open}
                aria-controls={id}
                onClick={() => setOpenIndex(open ? null : i)}
              >
                <span>{item.q}</span>
                <ChevronDown
                  size={18}
                  strokeWidth={1.75}
                  className={`landing-faq__chevron${open ? " landing-faq__chevron--open" : ""}`}
                  aria-hidden
                />
              </button>
              <div
                id={id}
                role="region"
                aria-labelledby={btnId}
                className={`landing-faq__panel${open ? " landing-faq__panel--open" : ""}`}
              >
                <div className="landing-faq__panel-inner">
                  <p className="landing-faq__answer">{item.a}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </LandingReveal>
  );
}
