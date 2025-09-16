"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Settings } from "lucide-react"
import { DynamicBackground } from "@/components/dynamic-background"
import { CircularProgress } from "@/components/circular-progress"
import { TimerDisplay } from "@/components/timer-display"
import { SettingsPanel } from "@/components/settings-panel"
import { useBinauralBeats } from "@/hooks/useBinauralBeats"
import { Volume2, VolumeX, ChevronLeft, ChevronRight } from "lucide-react"
import { TRACKS } from "@/lib/audio-engine"

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
  const { currentTrack, isPlaying, toggle, muted, setMuted, play, pause } = useBinauralBeats()
  const [selectedIndex, setSelectedIndex] = useState<number>(() => {
    const idx = currentTrack ? TRACKS.findIndex(t => t.name === currentTrack) : 0
    return idx >= 0 ? idx : 0
  })
  const selectedTrack: string = TRACKS[selectedIndex]?.name ?? "Alpha"
  const isClient: boolean = typeof window !== "undefined"

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((time: number): number => time - 1)
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
        setCurrentSession((prev: number): number => prev + 1)
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
    const next = !isActive
    setIsActive(next)
    // Tie audio playback to timer control
    if (next) {
      void play(selectedTrack).catch(() => {})
    } else {
      pause()
    }
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
      <DynamicBackground isActive={isActive} isBreak={isBreak} />

      {/* Top Header */}
      <div className="absolute top-4 left-0 right-0 z-20">
        <h1 className="text-2xl font-bold text-white drop-shadow-lg text-center text-balance">FLOWMO</h1>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-3">
        <div className="p-6 rounded-2xl max-w-sm w-full bg-transparent">
          <div className="text-center space-y-6">
            {/* Timer Circle */}
            <div className="relative flex items-center justify-center">
              <CircularProgress progress={progress} size={240} strokeWidth={6} isActive={isActive} />
              <div className="absolute inset-0 flex items-center justify-center">
                <TimerDisplay
                  timeLeft={timeLeft}
                  isActive={isActive}
                  title={isBreak ? "Break Time" : "Focus"}
                  subtitle={
                    <div className="flex justify-center gap-2" role="progressbar" aria-label="Session progress">
                      {Array.from(
                        { length: settings.sessionsUntilLongBreak },
                        (_: unknown, i: number) => (
                          <div
                            key={i}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                              i < currentSession - 1
                                ? "bg-white/80 shadow-sm scale-110"
                                : i === currentSession - 1 && !isBreak
                                  ? "bg-white/80 animate-pulse shadow-sm scale-110"
                                  : "bg-white/20"
                            }`}
                          />
                        ),
                      )}
                    </div>
                  }
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center gap-3">
                <Button
                  onClick={toggleTimer}
                  size="default"
                  className="bg-white/10 hover:bg-white/20 text-white rounded-full w-14 h-14 p-0 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
                  aria-label={isActive ? "Pause timer" : "Start timer"}
                >
                  {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>

                <Button
                  onClick={resetTimer}
                  variant="outline"
                  size="default"
                  className="rounded-full w-10 h-10 p-0 bg-white/5 hover:bg-white/10 backdrop-blur-sm border-white/20 text-white hover:text-white transition-all duration-300"
                  aria-label="Reset timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>

                <Button
                  onClick={() => setShowSettings(true)}
                  variant="outline"
                  size="default"
                  className="rounded-full w-10 h-10 p-0 bg-white/5 hover:bg-white/10 backdrop-blur-sm border-white/20 text-white hover:text-white transition-all duration-300"
                  aria-label="Open settings"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
              <div className="inline-flex items-stretch text-white border border-white/20 rounded-md bg-black/20 backdrop-blur-sm shadow-md overflow-hidden">
                <button
                  type="button"
                  className="px-2 h-9 flex items-center hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-50"
                  aria-label="Previous track"
                  onClick={() => {
                    const prev = selectedIndex <= 0 ? TRACKS.length - 1 : selectedIndex - 1
                    const name = TRACKS[prev]?.name ?? selectedTrack
                    setSelectedIndex(prev)
                    if (isClient && isPlaying) {
                      void toggle(name).catch(() => {})
                    }
                  }}
                  disabled={TRACKS.length === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div
                  role="status"
                  aria-live="polite"
                  className="px-3 h-9 flex items-center justify-center min-w-[140px] text-center"
                >
                  {selectedTrack}
                </div>

                <button
                  type="button"
                  className="px-2 h-9 flex items-center hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-50"
                  aria-label="Next track"
                  onClick={() => {
                    const next = selectedIndex < 0 || selectedIndex >= TRACKS.length - 1 ? 0 : selectedIndex + 1
                    const name = TRACKS[next]?.name ?? selectedTrack
                    setSelectedIndex(next)
                    if (isClient && isPlaying) {
                      void toggle(name).catch(() => {})
                    }
                  }}
                  disabled={TRACKS.length === 0}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  className="px-2 h-9 flex items-center hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  aria-label={muted ? "Unmute audio" : "Mute audio"}
                  onClick={() => setMuted(!muted)}
                >
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
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
