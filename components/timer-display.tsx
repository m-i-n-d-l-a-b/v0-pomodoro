"use client"

interface TimerDisplayProps {
  timeLeft: number
  isActive: boolean
}

export function TimerDisplay({ timeLeft, isActive }: TimerDisplayProps) {
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const formatTime = (time: number) => time.toString().padStart(2, "0")

  return (
    <div className="text-center">
      <div
        className={`text-6xl font-bold font-mono transition-all duration-300 ${isActive ? "scale-105" : "scale-100"}`}
        style={{
          color: "white",
          textShadow: isActive
            ? "0 0 30px rgba(255, 255, 255, 0.8), 0 0 60px rgba(255, 255, 255, 0.4)"
            : "0 0 10px rgba(255, 255, 255, 0.3)",
        }}
      >
        {formatTime(minutes)}:{formatTime(seconds)}
      </div>
      <div className="text-sm text-gray-300 mt-2 font-medium">{isActive ? "Running" : "Paused"}</div>
    </div>
  )
}
