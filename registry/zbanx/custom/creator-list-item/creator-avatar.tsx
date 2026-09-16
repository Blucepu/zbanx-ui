"use client";

import { Loader } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage } from "@/registry/zbanx/ui/avatar";

interface CreatorAvatarProps {
  /** 头像地址（已处理为可直接加载的 URL；空则直接文字填充） */
  src?: string | null;
  /** 达人/渠道名：加载失败或空地址时取前两字填充 */
  name: string;
  className?: string;
}

export function CreatorAvatar({ src, name, className }: CreatorAvatarProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "failed">(
    src ? "loading" : "failed"
  );
  const [prevSrc, setPrevSrc] = useState(src);
  if (prevSrc !== src) {
    setPrevSrc(src);
    setStatus(src ? "loading" : "failed");
  }

  const fallbackText = name.slice(0, 2) || "达";

  return (
    <Avatar className={cn("bg-muted", className)}>
      {src && status !== "failed" ? (
        <>
          <AvatarImage
            src={src}
            alt={name}
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("failed")}
            className={cn(
              "transition-opacity duration-200",
              status === "loaded" ? "opacity-100" : "opacity-0"
            )}
          />
          {status === "loading" && (
            <span
              className="absolute inset-0 flex items-center justify-center"
              role="status"
              aria-label="头像加载中"
            >
              <Loader className="size-5 animate-spin text-muted-foreground" />
            </span>
          )}
        </>
      ) : (
        <span className="flex size-full items-center justify-center font-medium text-muted-foreground text-sm">
          {fallbackText}
        </span>
      )}
    </Avatar>
  );
}
