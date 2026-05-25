/**
 * @file FlowingMenu.tsx
 * @description 基于 React Bits Flowing Menu 的导航组件（https://www.reactbits.dev/components/flowing-menu）。
 *              悬停时从最近边缘滑入跑马灯效果，用于首页快捷入口等高互动区域。
 * @backend 无直接接口；菜单项 link 指向前端路由，目标页再请求各自 API。
 */

import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import "./FlowingMenu.css";

export interface FlowingMenuItem {
  /** 前端路由路径 */
  link: string;
  text: string;
  /** 跑马灯装饰图，可为图片 URL 或 CSS 渐变 */
  image: string;
}

interface FlowingMenuProps {
  items?: FlowingMenuItem[];
  /** stack：首页横向菜单；dock：右侧竖向 Dock */
  variant?: "stack" | "dock";
  speed?: number;
  textColor?: string;
  bgColor?: string;
  marqueeBgColor?: string;
  marqueeTextColor?: string;
  borderColor?: string;
  className?: string;
  /** dock 模式：点击条目回调（用于打开访客聊天等） */
  onItemClick?: (item: FlowingMenuItem) => void;
}

interface MenuItemProps extends FlowingMenuItem {
  variant: "stack" | "dock";
  speed: number;
  textColor: string;
  marqueeBgColor: string;
  marqueeTextColor: string;
  borderColor: string;
  isFirst: boolean;
  onItemClick?: (item: FlowingMenuItem) => void;
}

export default function FlowingMenu({
  items = [],
  variant = "stack",
  speed = 15,
  textColor = "#1d2129",
  bgColor = "transparent",
  marqueeBgColor = "#165dff",
  marqueeTextColor = "#ffffff",
  borderColor = "rgba(22, 93, 255, 0.15)",
  className = "",
  onItemClick,
}: FlowingMenuProps) {
  return (
    <div
      className={`menu-wrap menu-wrap--${variant} ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      <nav className="menu">
        {items.map((item, idx) => (
          <MenuItem
            key={`${item.link}-${item.text}`}
            {...item}
            variant={variant}
            speed={speed}
            textColor={textColor}
            marqueeBgColor={marqueeBgColor}
            marqueeTextColor={marqueeTextColor}
            borderColor={borderColor}
            isFirst={idx === 0}
            onItemClick={onItemClick}
          />
        ))}
      </nav>
    </div>
  );
}

function DockMenuItem({
  link,
  text,
  textColor,
  borderColor,
  image,
  onItemClick,
}: Pick<MenuItemProps, "link" | "text" | "textColor" | "borderColor" | "image" | "onItemClick">) {
  const itemData = { link, text, image };
  const inner = onItemClick ? (
    <button
      type="button"
      className="dock-item__btn"
      style={{ color: textColor }}
      onClick={() => onItemClick(itemData)}
    >
      {text}
    </button>
  ) : (
    <Link className="dock-item__btn" to={link} style={{ color: textColor }}>
      {text}
    </Link>
  );

  return (
    <div className="dock-item" style={{ borderColor }}>
      {inner}
      <span className="dock-item__shine" style={{ background: image }} aria-hidden />
    </div>
  );
}

function MenuItem({
  link,
  text,
  image,
  variant,
  speed,
  textColor,
  marqueeBgColor,
  marqueeTextColor,
  borderColor,
  isFirst,
  onItemClick,
}: MenuItemProps) {
  if (variant === "dock") {
    return (
      <DockMenuItem
        link={link}
        text={text}
        image={image}
        textColor={textColor}
        borderColor={borderColor}
        onItemClick={onItemClick}
      />
    );
  }

  const itemRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const [repetitions, setRepetitions] = useState(4);

  const animationDefaults: gsap.TweenVars = { duration: 0.55, ease: "expo.out" };

  const distMetric = (x: number, y: number, x2: number, y2: number) => {
    const xDiff = x - x2;
    const yDiff = y - y2;
    return xDiff * xDiff + yDiff * yDiff;
  };

  const findClosestEdge = (
    mouseX: number,
    mouseY: number,
    width: number,
    height: number
  ): "top" | "bottom" => {
    const topEdgeDist = distMetric(mouseX, mouseY, width / 2, 0);
    const bottomEdgeDist = distMetric(mouseX, mouseY, width / 2, height);
    return topEdgeDist < bottomEdgeDist ? "top" : "bottom";
  };

  const marqueeEnter = (edge: "top" | "bottom") => {
    if (!marqueeRef.current || !marqueeInnerRef.current) return;
    const fromMain = edge === "top" ? "-101%" : "101%";
    const fromInner = edge === "top" ? "101%" : "-101%";
    gsap
      .timeline({ defaults: animationDefaults })
      .set(marqueeRef.current, { y: fromMain, x: "0%" }, 0)
      .set(marqueeInnerRef.current, { y: fromInner, x: "0%" }, 0)
      .to([marqueeRef.current, marqueeInnerRef.current], { x: "0%", y: "0%" }, 0);
  };

  const marqueeLeave = (edge: "top" | "bottom") => {
    if (!marqueeRef.current || !marqueeInnerRef.current) return;
    const toMain = edge === "top" ? "-101%" : "101%";
    const toInner = edge === "top" ? "101%" : "-101%";
    gsap
      .timeline({ defaults: animationDefaults })
      .to(marqueeRef.current, { y: toMain }, 0)
      .to(marqueeInnerRef.current, { y: toInner }, 0);
  };

  useEffect(() => {
    const calculateRepetitions = () => {
      if (!marqueeInnerRef.current) return;
      const part = marqueeInnerRef.current.querySelector(".marquee__part") as HTMLElement;
      if (!part) return;
      const contentWidth = part.offsetWidth;
      const needed = Math.ceil(window.innerWidth / contentWidth) + 2;
      setRepetitions(Math.max(4, needed));
    };
    calculateRepetitions();
    window.addEventListener("resize", calculateRepetitions);
    return () => window.removeEventListener("resize", calculateRepetitions);
  }, [text, image]);

  useEffect(() => {
    const setupMarquee = () => {
      if (!marqueeInnerRef.current) return;
      const part = marqueeInnerRef.current.querySelector(".marquee__part") as HTMLElement;
      if (!part || part.offsetWidth === 0) return;
      animationRef.current?.kill();
      animationRef.current = gsap.to(marqueeInnerRef.current, {
        x: -part.offsetWidth,
        duration: speed,
        ease: "none",
        repeat: -1,
      });
    };
    const timer = setTimeout(setupMarquee, 50);
    return () => {
      clearTimeout(timer);
      animationRef.current?.kill();
    };
  }, [text, image, repetitions, speed]);

  const handleMouseEnter = (ev: React.MouseEvent) => {
    if (!itemRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    marqueeEnter(findClosestEdge(x, y, rect.width, rect.height));
  };

  const handleMouseLeave = (ev: React.MouseEvent) => {
    if (!itemRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    marqueeLeave(findClosestEdge(x, y, rect.width, rect.height));
  };

  const itemData = { link, text, image };

  return (
    <div
      className="menu__item"
      ref={itemRef}
      style={{ borderColor, borderTopWidth: isFirst ? 0 : undefined }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {onItemClick ? (
        <button
          type="button"
          className="menu__item-link menu__item-btn"
          style={{ color: textColor }}
          onClick={() => onItemClick(itemData)}
        >
          {text}
        </button>
      ) : (
        <Link className="menu__item-link" to={link} style={{ color: textColor }}>
          {text}
        </Link>
      )}
      <div className="marquee" ref={marqueeRef} style={{ backgroundColor: marqueeBgColor }}>
        <div className="marquee__inner-wrap">
          <div className="marquee__inner" ref={marqueeInnerRef}>
            {[...Array(repetitions)].map((_, idx) => (
              <div className="marquee__part" key={idx}>
                <span style={{ color: marqueeTextColor }}>{text}</span>
                <div className="marquee__img" style={{ backgroundImage: image }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
