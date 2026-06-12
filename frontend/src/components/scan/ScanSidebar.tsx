import { Link } from "react-router-dom";
import { Camera, Image, Sun, MessageSquare, HelpCircle } from "lucide-react";
import AnimeReveal from "../motion/AnimeReveal";

const TIPS = [
  { icon: Sun, text: "光线充足、避免反光，题目占画面主体" },
  { icon: Camera, text: "尽量平拍，保持文字水平不倾斜" },
  { icon: Image, text: "支持印刷体与手写公式，模糊图识别率会下降" },
];

const FAQ = [
  "单题识别效果最佳，一图一题",
  "支持 JPG、PNG 格式，建议 2MB 以内",
  "识别后可保存解析到今日计划",
];

export default function ScanSidebar() {
  return (
    <>
      <AnimeReveal as="section" className="section-card dash-panel" y={14} delay={110}>
        <h2 className="dash-panel__title">拍照技巧</h2>
        <ul className="dash-sidebar-tips">
          {TIPS.map(({ icon: Icon, text }) => (
            <li key={text}>
              <Icon size={14} aria-hidden />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </AnimeReveal>

      <AnimeReveal as="section" className="section-card dash-panel" y={14} delay={130}>
        <h2 className="dash-panel__title">
          <HelpCircle size={14} className="inline mr-1" aria-hidden />
          常见问题
        </h2>
        <ul className="dash-sidebar-notes">
          {FAQ.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </AnimeReveal>

      <AnimeReveal as="section" className="section-card dash-panel" y={14} delay={150}>
        <h2 className="dash-panel__title">识别完成后</h2>
        <p className="dash-panel__desc">
          解析结果会展示知识点、分步思路与同类练习题，可继续提问或加入今日计划。
        </p>
        <div className="dash-sidebar-links mt-3">
          <Link to="/chat" className="btn-primary w-full justify-center text-sm no-underline">
            <MessageSquare size={15} /> 继续智能辅导
          </Link>
          <Link to="/plan" className="btn-secondary w-full justify-center text-sm no-underline">
            查看今日计划
          </Link>
        </div>
      </AnimeReveal>
    </>
  );
}
