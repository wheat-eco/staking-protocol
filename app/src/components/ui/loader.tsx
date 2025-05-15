"use client"

import { cn } from "@/lib/utils"

type LoaderProps = {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function Loader({ size = "md", className }: LoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-3",
  }

  return (
    <div className="flex justify-center items-center">
      <div
        className={cn(
          "animate-spin rounded-full border-solid border-white border-t-transparent",
          sizeClasses[size],
          className,
        )}
      />
    </div>
  )
}
