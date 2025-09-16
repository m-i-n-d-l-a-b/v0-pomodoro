"use client"

import type { ReactNode } from "react"

interface TimerDisplayProps {
  timeLeft: number
  isActive: boolean
  title?: string
  subtitle?: ReactNode
}

export function TimerDisplay({ timeLeft, isActive, title, subtitle }: TimerDisplayProps) {
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const formatTime = (time: number) => time.toString().padStart(2, "0")

  return (
    <div className="text-center">
      {title ? (
        <div
          className={`text-white/90 text-base sm:text-lg font-semibold mb-1.5 drop-shadow transition-opacity duration-300 ${
            isActive ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={!isActive}
        >
          {title}
        </div>
      ) : null}
      <div
        className={`text-5xl sm:text-6xl font-bold font-mono transition-all duration-300 ${isActive ? "scale-105" : "scale-100"}`}
        style={{
          color: "white",
          textShadow: isActive
            ? "0 0 15px rgba(255, 255, 255, 0.4), 0 0 20px rgba(255, 255, 255, 0.25)"
            : "0 0 10px rgba(255, 255, 255, 0.3)",
        }}
      >
        {formatTime(minutes)}:{formatTime(seconds)}
      </div>
      {subtitle ? (
        <div className="mt-1.5">
          {subtitle}
        </div>
      ) : null}
    </div>
  )
}
