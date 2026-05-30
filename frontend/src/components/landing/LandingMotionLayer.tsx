/**
 * 门户氛围光晕 + 顶部阅读进度条（轻量，不遮挡书海）。
 */
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

type Props = {
  scrollY: number;
  progress: number;
};

export default function LandingMotionLayer({ scrollY, progress }: Props) {
  const reduced = usePrefersReducedMotion();

  if (reduced) return null;

  return (
    <>
      <div
        className="landing-scroll-progress"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden
      />
      <div className="landing-ambience" aria-hidden>
        <span
          className="landing-ambience__orb landing-ambience__orb--blue"
          style={{ transform: `translate3d(0, ${scrollY * 0.14}px, 0)` }}
        />
        <span
          className="landing-ambience__orb landing-ambience__orb--cyan"
          style={{ transform: `translate3d(0, ${scrollY * -0.09}px, 0)` }}
        />
        <span
          className="landing-ambience__orb landing-ambience__orb--green"
          style={{ transform: `translate3d(0, ${scrollY * 0.06}px, 0)` }}
        />
      </div>
    </>
  );
}
