/**
 * @file BilibiliVideoCard.tsx
 * @description 对话区 B 站风格视频推荐卡片（封面 + 播放量 + 标题 + UP主）
 */
import { useEffect, useState, type KeyboardEvent } from "react";
import { Play } from "lucide-react";
import type { BilibiliVideoMeta } from "../../lib/parseBilibiliVideos";
import {
  fetchBilibiliCover,
  formatDuration,
  formatPlayCount,
  isHotVideo,
} from "../../lib/bilibiliMeta";

interface Props {
  video: BilibiliVideoMeta;
}

export default function BilibiliVideoCard({ video }: Props) {
  const [cover, setCover] = useState<string | null>(null);
  const hot = isHotVideo(video.playCountText);
  const coverLabel =
    video.title.length > 16 ? `${video.title.slice(0, 16)}…` : video.title;

  useEffect(() => {
    let cancelled = false;
    fetchBilibiliCover(video.bvid).then((pic) => {
      if (!cancelled && pic) setCover(pic);
    });
    return () => {
      cancelled = true;
    };
  }, [video.bvid]);

  const open = () => window.open(video.url, "_blank", "noopener,noreferrer");

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  };

  return (
    <article
      className="bili-video-card"
      onClick={open}
      onKeyDown={onKeyDown}
      role="link"
      tabIndex={0}
      aria-label={`在 B 站打开：${video.title}`}
    >
      <div className="bili-video-card__cover">
        {cover ? (
          <img
            src={cover}
            alt=""
            className="bili-video-card__img"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="bili-video-card__fallback" aria-hidden>
            <span>{coverLabel}</span>
          </div>
        )}

        {hot && <span className="bili-video-card__badge">热门推荐</span>}

        {video.tag && <span className="bili-video-card__pill">{video.tag}</span>}

        <div className="bili-video-card__bar">
          <span className="bili-video-card__stat">
            <Play size={11} fill="currentColor" aria-hidden />
            {formatPlayCount(video.playCountText)}
          </span>
          {video.durationText && (
            <span className="bili-video-card__duration">
              {formatDuration(video.durationText)}
            </span>
          )}
        </div>
      </div>

      <h4 className="bili-video-card__title">{video.title}</h4>

      {video.uploader && (
        <p className="bili-video-card__meta">
          <span className="bili-video-card__avatar" aria-hidden />
          <span className="bili-video-card__uploader">{video.uploader}</span>
        </p>
      )}
    </article>
  );
}
