"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Settings } from "lucide-react"
import { DynamicBackground } from "@/components/dynamic-background"
import { CircularProgress } from "@/components/circular-progress"
import { TimerDisplay } from "@/components/timer-display"
import { SettingsPanel } from "@/components/settings-panel"

export default function PomodoroApp() {
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState({
    workTime: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4,
  })
  const [currentSession, setCurrentSession] = useState(1)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((time) => time - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      // Timer finished - play notification sound
      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYE",
      )
      audio.volume = 0.3
      audio.play().catch(() => {}) // Ignore errors if audio can't play

      setIsActive(false)
      if (isBreak) {
        setIsBreak(false)
        setTimeLeft(settings.workTime * 60)
      } else {
        setIsBreak(true)
        const isLongBreak = currentSession % settings.sessionsUntilLongBreak === 0
        setTimeLeft((isLongBreak ? settings.longBreak : settings.shortBreak) * 60)
        setCurrentSession((prev) => prev + 1)
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, timeLeft, isBreak, settings, currentSession])

  const toggleTimer = () => {
    setIsActive(!isActive)
  }

  const resetTimer = () => {
    setIsActive(false)
    setIsBreak(false)
    setTimeLeft(settings.workTime * 60)
    setCurrentSession(1)
  }

  const totalTime = isBreak
    ? (currentSession % settings.sessionsUntilLongBreak === 0 ? settings.longBreak : settings.shortBreak) * 60
    : settings.workTime * 60

  const progress = totalTime > 0 ? Math.min(100, Math.max(0, ((totalTime - timeLeft) / totalTime) * 100)) : 0

  return (
    <div className="min-h-screen relative overflow-hidden">
      <DynamicBackground />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="p-8 rounded-3xl max-w-md w-full bg-transparent">
          <div className="text-center space-y-8">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white drop-shadow-lg text-balance">
                {isBreak ? "Break Time" : "Focus"}
              </h1>
              <p className="text-gray-300 drop-shadow-md text-pretty">
                Session {currentSession} • {isBreak ? "Take a break" : "Stay sharp"}
              </p>
            </div>

            {/* Timer Circle */}
            <div className="relative flex items-center justify-center">
              <CircularProgress progress={progress} size={280} strokeWidth={8} isActive={isActive} />
              <div className="absolute inset-0 flex items-center justify-center">
                <TimerDisplay timeLeft={timeLeft} isActive={isActive} />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={toggleTimer}
                size="lg"
                className="bg-white/10 hover:bg-white/20 text-white rounded-full w-16 h-16 p-0 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                aria-label={isActive ? "Pause timer" : "Start timer"}
              >
                {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>

              <Button
                onClick={resetTimer}
                variant="outline"
                size="lg"
                className="rounded-full w-12 h-12 p-0 bg-white/5 hover:bg-white/10 backdrop-blur-sm border-white/20 text-white hover:text-white transition-all duration-300 hover:scale-105"
                aria-label="Reset timer"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>

              <Button
                onClick={() => setShowSettings(true)}
                variant="outline"
                size="lg"
                className="rounded-full w-12 h-12 p-0 bg-white/5 hover:bg-white/10 backdrop-blur-sm border-white/20 text-white hover:text-white transition-all duration-300 hover:scale-105"
                aria-label="Open settings"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>

            {/* Progress Indicator */}
            <div className="space-y-2">
              <div className="flex justify-center gap-2" role="progressbar" aria-label="Session progress">
                {Array.from({ length: settings.sessionsUntilLongBreak }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      i < currentSession - 1
                        ? "bg-white/80 shadow-sm scale-110"
                        : i === currentSession - 1 && !isBreak
                          ? "bg-white/80 animate-pulse shadow-sm scale-110"
                          : "bg-white/20"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-400">
                {Math.max(0, settings.sessionsUntilLongBreak - (currentSession - 1))} sessions until long break
              </p>
            </div>
          </div>
        </div>
      </div>

      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={setSettings}
        onReset={resetTimer}
      />
    </div>
  )
}
