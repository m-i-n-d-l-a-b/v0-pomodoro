"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Settings } from "lucide-react"
import { DynamicBackground } from "@/components/dynamic-background"
import { CircularProgress } from "@/components/circular-progress"
import { TimerDisplay } from "@/components/timer-display"
import { SettingsPanel } from "@/components/settings-panel"
import { IntroductionPopup } from "@/components/introduction-popup"
import { useBinauralBeats } from "@/hooks/useBinauralBeats"
import { Volume2, VolumeX, ChevronLeft, ChevronRight } from "lucide-react"
import { TRACKS } from "@/lib/audio-engine"
import { TaskList } from "@/components/task-list"
import { useTaskList } from "@/hooks/useTaskList"
import type { Task } from "@/lib/task-types"

const selectInitialActiveTaskId = (taskCollection: Task[]): string | null => {
  const firstIncomplete = taskCollection.find((task: Task) => !task.isCompleted)
  if (firstIncomplete !== undefined) {
    return firstIncomplete.id
  }
  return null
}

const resolveActiveTaskId = (taskCollection: Task[], currentId: string | null): string | null => {
  if (taskCollection.length === 0) {
    return null
  }

  if (currentId !== null) {
    const currentTask = taskCollection.find((task: Task) => task.id === currentId)
    if (currentTask !== undefined && !currentTask.isCompleted) {
      return currentTask.id
    }
  }

  const nextIncomplete = taskCollection.find((task: Task) => !task.isCompleted)
  if (nextIncomplete !== undefined) {
    return nextIncomplete.id
  }

  return null
}

export default function PomodoroApp() {
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showIntroduction, setShowIntroduction] = useState(false)
  const [settings, setSettings] = useState({
    workTime: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4,
  })
  const [currentSession, setCurrentSession] = useState(1)
  const { tasks, addTask, deleteTask, toggleTaskComplete, incrementPomodoros, getTaskById } = useTaskList()
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [taskWarning, setTaskWarning] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const { currentTrack, isPlaying, toggle, muted, setMuted, play, pause } = useBinauralBeats()
  const [selectedIndex, setSelectedIndex] = useState<number>(() => {
    const idx = currentTrack ? TRACKS.findIndex(t => t.name === currentTrack) : 0
    return idx >= 0 ? idx : 0
  })
  const selectedTrack: string = TRACKS[selectedIndex]?.name ?? "Alpha"
  const activeTask = useMemo<Task | null>(() => (activeTaskId ? getTaskById(activeTaskId) : null), [activeTaskId, getTaskById])
  const remainingPomodoros: number | null = activeTask
    ? Math.max(activeTask.pomodorosRequired - activeTask.pomodorosCompleted, 0)
    : null
  const isClient: boolean = typeof window !== "undefined"
  const { tasks, addTask, editTaskLabel, toggleTaskComplete, deleteTask, reorderTasks, incrementPomodoros } =
    useTaskList()
  const [activeTaskId, setActiveTaskId] = useState<string | null>(() => selectInitialActiveTaskId(tasks))
  const [startWarning, setStartWarning] = useState<string | null>(null)

  const activeTask = useMemo<Task | null>(() => {
    if (activeTaskId === null) {
      return null
    }
    const match = tasks.find((task: Task) => task.id === activeTaskId)
    return match ?? null
  }, [activeTaskId, tasks])

  const activeTaskStats = useMemo<
    | {
        completedCount: number
        estimatedCount: number | null
        remainingCount: number | null
      }
    | null
  >(() => {
    if (activeTask === null) {
      return null
    }
    const completedCount: number = activeTask.completedPomodoros ?? 0
    const estimatedValue = activeTask.estimatedPomodoros
    const estimatedCount: number | null = typeof estimatedValue === "number" ? Math.max(estimatedValue, 0) : null
    const remainingCount: number | null = estimatedCount !== null ? Math.max(estimatedCount - completedCount, 0) : null
    return {
      completedCount,
      estimatedCount,
      remainingCount,
    }
  }, [activeTask])

  const activeTaskProgressSummary = useMemo<string | null>(() => {
    if (activeTaskStats === null) {
      return null
    }
    if (activeTaskStats.estimatedCount !== null) {
      const remainingCount: number = activeTaskStats.remainingCount ?? 0
      const remainingLabel = remainingCount === 1 ? "pomodoro" : "pomodoros"
      return `${remainingCount} ${remainingLabel} remaining (${activeTaskStats.completedCount}/${activeTaskStats.estimatedCount})`
    }
    const completedLabel = activeTaskStats.completedCount === 1 ? "pomodoro" : "pomodoros"
    return `${activeTaskStats.completedCount} ${completedLabel} completed`
  }, [activeTaskStats])

  useEffect(() => {
    setActiveTaskId((previous: string | null): string | null => {
      const resolved = resolveActiveTaskId(tasks, previous)
      return resolved === previous ? previous : resolved
    })
  }, [tasks])

  useEffect(() => {
    if (startWarning !== null && activeTask !== null && !activeTask.isCompleted) {
      setStartWarning(null)
    }
  }, [activeTask, startWarning])

  useEffect(() => {
    if (!isActive) {
      return
    }

    if (activeTask !== null && activeTaskId !== null && !activeTask.isCompleted) {
      return
    }

    setIsActive(false)
    pause()
    setStartWarning("Select a task to focus on before starting the timer.")
  }, [activeTask, activeTaskId, isActive, pause])

  // Show introduction popup on first visit
  useEffect(() => {
    if (isClient) {
      const hasSeenIntroduction = localStorage.getItem('pomopulse-intro-seen')
      if (!hasSeenIntroduction) {
        setShowIntroduction(true)
      }
    }
  }, [isClient])

  useEffect(() => {
    if (tasks.length === 0) {
      setActiveTaskId(null)
      return
    }

    setActiveTaskId((previous: string | null): string | null => {
      if (!previous) {
        return deriveDefaultActiveTaskId()
      }

      const existingTask = tasks.find((task: Task): boolean => task.id === previous)
      if (!existingTask) {
        return deriveDefaultActiveTaskId()
      }

      if (existingTask.isCompleted) {
        const nextIncomplete = tasks.find((task: Task): boolean => !task.isCompleted && task.id !== existingTask.id)
        return nextIncomplete?.id ?? null
      }

      return previous
    })
  }, [tasks, deriveDefaultActiveTaskId])

  useEffect(() => {
    if (!taskWarning || !isClient) {
      return
    }

    const timeout = window.setTimeout(() => {
      setTaskWarning(null)
    }, 2500)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [taskWarning, isClient])

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((time: number): number => time - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      const completedFocusSession = !isBreak
      // Timer finished - play notification sound
      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/JdSYE",
      )
      audio.volume = 0.3
      audio.play().catch(() => {}) // Ignore errors if audio can't play

      setIsActive(false)
      if (completedFocusSession && activeTaskId) {
        const updatedTask = incrementPomodoros(activeTaskId)
        if (!updatedTask) {
          setActiveTaskId(null)
        } else {
          const goalReached = updatedTask.pomodorosCompleted >= updatedTask.pomodorosRequired
          if (goalReached && !updatedTask.isCompleted) {
            const completedTask = toggleTaskComplete(updatedTask.id)
            if (completedTask?.id === activeTaskId) {
              setActiveTaskId(null)
            }
          }
        }
      }
      if (isBreak) {
        setIsBreak(false)
        setTimeLeft(settings.workTime * 60)
      } else {
        if (activeTaskId !== null && activeTask !== null) {
          const completedBefore: number = activeTask.completedPomodoros ?? 0
          const nextCompleted: number = completedBefore + 1
          incrementPomodoros(activeTaskId)
          if (!activeTask.isCompleted) {
            const estimatedValue = activeTask.estimatedPomodoros
            const sanitizedEstimate: number | null =
              typeof estimatedValue === "number" ? Math.max(estimatedValue, 0) : null
            const shouldComplete: boolean =
              sanitizedEstimate === null ? true : nextCompleted >= sanitizedEstimate
            if (shouldComplete) {
              toggleTaskComplete(activeTaskId)
            }
          }
        }

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
  }, [
    activeTask,
    activeTaskId,
    incrementPomodoros,
    isActive,
    isBreak,
    settings,
    currentSession,
    timeLeft,
    toggleTaskComplete,
  ])

  const toggleTimer = (): void => {
    if (!isActive) {
      if (activeTaskId === null || activeTask === null || activeTask.isCompleted) {
        setStartWarning("Select a task to focus on before starting the timer.")
        return
      }
      setStartWarning(null)
    }

    const next = !isActive
    if (next) {
      const targetTask = activeTaskId ? getTaskById(activeTaskId) : null
      if (!targetTask) {
        setTaskWarning("Please select a task before starting the timer.")
        return
      }
      if (targetTask.isCompleted) {
        setTaskWarning("The selected task is already complete. Choose another task to start focusing.")
        return
      }
    }

    setTaskWarning(null)
    setIsActive(next)
    // Tie audio playback to timer control
    if (next) {
      void play(selectedTrack).catch(() => {})
    } else {
      pause()
    }
  }

  const resetTimer = (): void => {
    setIsActive(false)
    setIsBreak(false)
    setTimeLeft(settings.workTime * 60)
    setCurrentSession(1)
    setStartWarning(null)
    pause()
  }

  const handleCloseIntroduction = (): void => {
    setShowIntroduction(false)
    if (isClient) {
      localStorage.setItem('pomopulse-intro-seen', 'true')
    }
  }

  const handleAddTask = useCallback(
    (label: string): void => {
      addTask(label)
    },
    [addTask],
  )

  const handleEditTask = useCallback(
    (taskId: string, nextLabel: string): void => {
      editTaskLabel(taskId, nextLabel)
    },
    [editTaskLabel],
  )

  const handleToggleTask = useCallback(
    (taskId: string): void => {
      toggleTaskComplete(taskId)
    },
    [toggleTaskComplete],
  )

  const handleDeleteTask = useCallback(
    (taskId: string): void => {
      deleteTask(taskId)
    },
    [deleteTask],
  )

  const handleReorderTask = useCallback(
    (startIndex: number, endIndex: number): void => {
      reorderTasks(startIndex, endIndex)
    },
    [reorderTasks],
  )

  const handleSelectActiveTask = useCallback(
    (taskId: string): void => {
      const candidate = tasks.find((task: Task) => task.id === taskId)
      if (candidate === undefined) {
        return
      }
      if (candidate.isCompleted) {
        setStartWarning("Mark the task as incomplete before focusing on it.")
        return
      }
      setActiveTaskId(candidate.id)
      setStartWarning(null)
    },
    [tasks],
  )

  const totalTime = isBreak
    ? (currentSession % settings.sessionsUntilLongBreak === 0 ? settings.longBreak : settings.shortBreak) * 60
    : settings.workTime * 60

  const progress = totalTime > 0 ? Math.min(100, Math.max(0, ((totalTime - timeLeft) / totalTime) * 100)) : 0

  return (
    <div className="min-h-screen relative overflow-hidden">
      <DynamicBackground isActive={isActive} isBreak={isBreak} />

      {/* Top Header */}
      <div className="absolute top-4 left-0 right-0 z-20">
        <h1 className="text-2xl font-bold text-white drop-shadow-lg text-center text-balance">POMOPULSE</h1>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-3">
        <div className="flex w-full max-w-5xl flex-col gap-6 lg:flex-row lg:items-start">
          <div className="p-6 rounded-2xl w-full max-w-sm bg-transparent">
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
                    <div className="flex flex-col items-center gap-2" aria-live="polite">
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
                      <div className="text-xs text-white/80">
                        {activeTask !== null ? `Working on: ${activeTask.label}` : "Select a task to begin"}
                      </div>
                      {activeTaskProgressSummary !== null ? (
                        <div className="text-[11px] text-white/60">{activeTaskProgressSummary}</div>
                      ) : null}
                    </div>
                  }
                />
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
              {startWarning !== null ? (
                <div
                  className="rounded-full border border-amber-400/30 bg-amber-500/15 px-3 py-1 text-xs text-amber-100 shadow-sm"
                  role="status"
                  aria-live="polite"
                >
                  {startWarning}
                </div>
              ) : null}
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
                  className="px-3 py-2 h-9 flex items-center justify-center min-w-[140px] text-center"
                >
                  {selectedTrack}
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
                    className="px-3 py-2 h-9 flex items-center justify-center min-w-[140px] text-center"
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
                {taskWarning ? (
                  <p className="text-xs text-amber-200/90 text-center" role="status" aria-live="polite">
                    {taskWarning}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          <div className="w-full flex-1">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-sm">
              <TaskList
                tasks={tasks}
                activeTaskId={activeTaskId}
                onAdd={handleAddTask}
                onEditLabel={handleEditTask}
                onToggleComplete={handleToggleTask}
                onDelete={handleDeleteTask}
                onReorder={handleReorderTask}
                onSelectActiveTask={handleSelectActiveTask}
              />
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

      <IntroductionPopup
        isOpen={showIntroduction}
        onClose={handleCloseIntroduction}
      />
    </div>
  )
}
