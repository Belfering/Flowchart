import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-sm font-bold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-border-soft bg-surface-2 text-text",
        secondary:
          "border-border bg-surface text-text",
        accent:
          "border-accent-border bg-accent-bg text-accent-text",
        destructive:
          "border-red-300 bg-red-50 text-danger dark:border-red-800 dark:bg-red-950",
        outline:
          "border-border text-text",
        muted:
          "border-border-soft bg-surface-2 text-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
