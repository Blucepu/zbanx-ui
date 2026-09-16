"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ResizableSidebarProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  className?: string;
  onWidthChange?: (width: number) => void;
}

export default function ResizableSidebar({
  children,
  defaultWidth = 308,
  minWidth = 308,
  className,
  onWidthChange,
}: ResizableSidebarProps) {
  const [width, setWidth] = useState(defaultWidth);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      startX.current = e.clientX;
      const actualWidth = containerRef.current?.offsetWidth ?? width;
      startWidth.current = actualWidth;
      if (actualWidth !== width) setWidth(actualWidth);

      const parentWidth =
        containerRef.current?.parentElement?.clientWidth ?? window.innerWidth;
      const maxW = Math.floor(parentWidth * 0.5);

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return;
        const delta = startX.current - e.clientX;
        const newWidth = Math.max(
          minWidth,
          Math.min(maxW, startWidth.current + delta)
        );
        setWidth(newWidth);
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [width, minWidth]
  );

  useEffect(() => {
    onWidthChange?.(width);
  }, [onWidthChange, width]);

  return (
    <div
      ref={containerRef}
      className={cn("relative shrink-0", className)}
      style={{ width, maxWidth: "50%" }}
    >
      <div
        onMouseDown={handleMouseDown}
        className="group absolute top-0 bottom-0 left-0 z-5 w-2 -translate-x-1/2 cursor-col-resize"
      >
        <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-transparent transition-colors group-hover:bg-primary/40 group-active:bg-primary/60" />
      </div>
      {children}
    </div>
  );
}

export { ResizableSidebar };
