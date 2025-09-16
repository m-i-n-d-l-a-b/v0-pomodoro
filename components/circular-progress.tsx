"use client"

interface CircularProgressProps {
  progress: number
  size: number
  strokeWidth: number
  isActive: boolean
}

export function CircularProgress({ progress, size, strokeWidth, isActive }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ overflow: "visible" }}
      >
        <defs>
          <filter
            id="progress-glow"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            colorInterpolationFilters="sRGB"
            filterUnits="userSpaceOnUse"
          >
            {/* Subtle layered glow to avoid harsh edges and clipping */}
            <feDropShadow dx="0" dy="0" stdDeviation={isActive ? 4 : 2} floodColor="#ffffff" floodOpacity={isActive ? 0.5 : 0.3} />
            <feDropShadow dx="0" dy="0" stdDeviation={isActive ? 8 : 4} floodColor="#ffffff" floodOpacity={isActive ? 0.25 : 0.15} />
          </filter>
        </defs>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-white/10"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`text-white transition-all duration-1000 ease-out`}
          filter="url(#progress-glow)"
        />
      </svg>
    </div>
  )
}
