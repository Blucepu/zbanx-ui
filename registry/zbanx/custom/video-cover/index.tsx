"use client";

import { ImageOff, Loader } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getOssThumbUrl } from "@/lib/oss-image/index";

interface VideoCoverProps {
  /** 封面地址（白名单 OSS 地址自动转缩略图，其余原样加载） */
  src?: string | null;
  alt?: string;
  className?: string;
  imageClassName?: string;
  /** 覆盖层（如标题/播放量浮层，随封面同尺寸定位） */
  children?: ReactNode;
}

type CoverStatus = "loading" | "loaded" | "failed";

/**
 * 视频封面（与红人搜索列表一致）：
 * - 空地址/加载失败渲染同尺寸破图占位，避免 alt 文本撑破边界
 * - 加载中展示旋转加载指示器，加载完成淡入图片
 * - 黑底 + object-contain：竖屏图片（如 Instagram）两侧黑边填充，完整展示不被裁剪
 */
export function VideoCover({
  src,
  alt = "视频封面",
  className,
  imageClassName,
  children,
}: VideoCoverProps) {
  const [status, setStatus] = useState<CoverStatus>("loading");
  const [prevSrc, setPrevSrc] = useState(src);

  // 地址变化时重置状态（render 期调整 state，无需 effect）
  if (prevSrc !== src) {
    setPrevSrc(src);
    setStatus("loading");
  }

  const showImage = src && status !== "failed";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        status === "failed" ? "bg-muted" : "bg-black",
        className
      )}
    >
      {showImage ? (
        <img
          src={getOssThumbUrl(src)}
          alt={alt}
          loading="lazy"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("failed")}
          className={cn(
            "size-full object-contain transition-opacity duration-200",
            status === "loaded" ? "opacity-100" : "opacity-0",
            imageClassName
          )}
        />
      ) : (
        <div className="flex flex-col items-center gap-1">
          <ImageOff className="size-6 shrink-0 text-zinc-400" />
          <span className="text-[10px] text-zinc-500">加载失败</span>
        </div>
      )}
      {src && status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader className="size-5 animate-spin text-zinc-500" />
        </div>
      )}
      {children}
    </div>
  );
}

export default VideoCover;
