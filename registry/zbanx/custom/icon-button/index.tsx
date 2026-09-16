"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/registry/zbanx/ui/tooltip";

const iconButtonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      size: {
        sm: "p-1.5 [&_svg]:size-3.5",
        md: "p-2 [&_svg]:size-4",
        lg: "p-2 [&_svg]:size-5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  tooltip?: string;
  tooltipSide?: "top" | "bottom" | "left" | "right";
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { className, size, tooltip, tooltipSide = "top", children, ...props },
    ref
  ) => {
    const button = (
      <button
        ref={ref}
        type="button"
        className={cn(iconButtonVariants({ size }), className)}
        {...props}
      >
        {children}
      </button>
    );

    if (!tooltip) return button;

    return (
      <Tooltip>
        <TooltipTrigger render={button} />
        <TooltipContent side={tooltipSide}>{tooltip}</TooltipContent>
      </Tooltip>
    );
  }
);

IconButton.displayName = "IconButton";

export { IconButton, iconButtonVariants };
