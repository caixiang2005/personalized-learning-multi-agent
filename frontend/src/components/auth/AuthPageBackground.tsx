/**
 * 仅认证页使用：书海 + 首页同款氛围光晕（不挂到 App 全站）。
 */
import BookSeaBackground from "../background/BookSeaBackground";
import LandingMotionLayer from "../landing/LandingMotionLayer";

export default function AuthPageBackground() {
  return (
    <>
      <BookSeaBackground />
      <LandingMotionLayer scrollY={0} progress={0} />
    </>
  );
}
