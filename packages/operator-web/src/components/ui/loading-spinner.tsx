import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const spinnerVariants = cva(
  "animate-spin rounded-full border-2 border-current border-t-transparent",
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        default: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size, label, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <div className="flex flex-col items-center space-y-2">
          <div
            className={cn(spinnerVariants({ size }), "text-primary")}
            role="status"
            aria-label={label || "Loading"}
          >
            <span className="sr-only">{label || "Loading..."}</span>
          </div>
          {label && (
            <p className="text-sm text-muted-foreground">{label}</p>
          )}
        </div>
      </div>
    )
  }
)

LoadingSpinner.displayName = "LoadingSpinner"

export { LoadingSpinner, spinnerVariants }
