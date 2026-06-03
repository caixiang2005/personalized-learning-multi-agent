/**
 * 全站背景：柔和 mesh 渐变（Clay 设计系统）。
 */
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

export default function AppMeshBackground() {
  const reduced = usePrefersReducedMotion();

  return (
    <div className="app-mesh" aria-hidden>
      <div className={`app-mesh__orb app-mesh__orb--1${reduced ? " app-mesh__orb--static" : ""}`} />
      <div className={`app-mesh__orb app-mesh__orb--2${reduced ? " app-mesh__orb--static" : ""}`} />
      <div className={`app-mesh__orb app-mesh__orb--3${reduced ? " app-mesh__orb--static" : ""}`} />
      {!reduced && <div className="app-mesh__grid" />}
      <div className="app-mesh__grain" />
    </div>
  );
}
