import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusIndicatorVariants = cva(
  "status-indicator",
  {
    variants: {
      status: {
        operational: "status-operational",
        warning: "status-warning",
        alarm: "status-alarm",
        offline: "status-offline",
        maintenance: "status-maintenance",
      },
      size: {
        sm: "w-2 h-2",
        default: "w-3 h-3",
        lg: "w-4 h-4",
      },
    },
    defaultVariants: {
      status: "offline",
      size: "default",
    },
  }
)

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusIndicatorVariants> {
  label?: string
  showLabel?: boolean
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ className, status, size, label, showLabel = false, ...props }, ref) => {
    const statusLabels = {
      operational: 'Operational',
      warning: 'Warning',
      alarm: 'Alarm',
      offline: 'Offline',
      maintenance: 'Maintenance',
    }

    const displayLabel = label || (status ? statusLabels[status] : 'Unknown')

    if (showLabel) {
      return (
        <div className="flex items-center space-x-2" ref={ref} {...props}>
          <div className={cn(statusIndicatorVariants({ status, size }), className)} />
          <span className="text-sm font-medium">{displayLabel}</span>
        </div>
      )
    }

    return (
      <div
        className={cn(statusIndicatorVariants({ status, size }), className)}
        ref={ref}
        title={displayLabel}
        {...props}
      />
    )
  }
)

StatusIndicator.displayName = "StatusIndicator"

export { StatusIndicator, statusIndicatorVariants }
