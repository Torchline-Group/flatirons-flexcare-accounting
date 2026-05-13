import * as React from "react"

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "outline" }
>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
      variant === "outline"
        ? "border border-slate-300 bg-white text-slate-900"
        : "bg-blue-100 text-blue-900"
    } ${className || ""}`}
    {...props}
  />
))
Badge.displayName = "Badge"

export { Badge }
