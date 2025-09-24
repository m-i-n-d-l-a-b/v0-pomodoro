"use client"

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { Task, TaskInput } from "@/hooks/useTaskList"

interface TaskListProps {
  tasks: Task[]
  activeTaskId: string | null
  onSelectTask: (taskId: string) => void
  onAddTask: (input: TaskInput) => Task | null
  onToggleTaskComplete: (taskId: string) => Task | null
  onDeleteTask: (taskId: string) => Task | null
}

export function TaskList({
  tasks,
  activeTaskId,
  onSelectTask,
  onAddTask,
  onToggleTaskComplete,
  onDeleteTask,
}: TaskListProps): JSX.Element {
  const [newTaskTitle, setNewTaskTitle] = useState<string>("")
  const [pomodoroCount, setPomodoroCount] = useState<number>(1)
  const [formMessage, setFormMessage] = useState<string | null>(null)

  const incompleteTaskCount = useMemo<number>(() => tasks.filter((task: Task): boolean => !task.isCompleted).length, [tasks])

  const handleAddTask = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const trimmedTitle = newTaskTitle.trim()
    if (trimmedTitle.length === 0) {
      setFormMessage("Please enter a task name.")
      return
    }

    const sanitizedCount = Number.isFinite(pomodoroCount) ? Math.max(1, Math.round(pomodoroCount)) : 1
    const createdTask = onAddTask({ title: trimmedTitle, pomodorosRequired: sanitizedCount })

    if (!createdTask) {
      setFormMessage("Unable to add task. Please try again.")
      return
    }

    setFormMessage(null)
    setNewTaskTitle("")
    setPomodoroCount(1)
  }

  const handlePomodoroInput = (event: ChangeEvent<HTMLInputElement>): void => {
    const value = Number.parseInt(event.target.value, 10)
    if (Number.isNaN(value)) {
      setPomodoroCount(1)
      return
    }
    setPomodoroCount(Math.max(1, value))
  }

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setNewTaskTitle(event.target.value)
  }

  const handleSelectTask = (taskId: string): void => {
    onSelectTask(taskId)
    setFormMessage(null)
  }

  return (
    <div className="w-full max-w-md text-white bg-black/40 border border-white/10 rounded-2xl p-4 backdrop-blur-lg shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Tasks</h2>
          <p className="text-xs text-white/60">{incompleteTaskCount} task{incompleteTaskCount === 1 ? "" : "s"} remaining</p>
        </div>
      </div>

      <form onSubmit={handleAddTask} className="space-y-3 mb-5" noValidate>
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-white/70" htmlFor="task-title">
            Task name
          </label>
          <Input
            id="task-title"
            value={newTaskTitle}
            onChange={handleTitleChange}
            placeholder="Write article outline"
            className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-white/70" htmlFor="task-pomodoros">
            Pomodoros needed
          </label>
          <Input
            id="task-pomodoros"
            type="number"
            min={1}
            value={pomodoroCount}
            onChange={handlePomodoroInput}
            className="bg-white/5 border-white/20 text-white"
            required
          />
        </div>
        <Button type="submit" className="w-full bg-white/20 hover:bg-white/30 text-white">
          Add task
        </Button>
        {formMessage ? (
          <p className="text-xs text-amber-200/90" role="status" aria-live="polite">
            {formMessage}
          </p>
        ) : null}
      </form>

      <div className="space-y-3" role="list">
        {tasks.length === 0 ? (
          <p className="text-sm text-white/60">No tasks yet. Add one to get started.</p>
        ) : (
          tasks.map((task: Task) => {
            const isActive = task.id === activeTaskId
            const pomodorosRemaining = Math.max(task.pomodorosRequired - task.pomodorosCompleted, 0)
            return (
              <div
                key={task.id}
                className={cn(
                  "border border-white/10 rounded-xl p-3 transition-all duration-200 backdrop-blur-sm bg-white/5",
                  isActive ? "ring-2 ring-white/60 shadow-lg" : "",
                  task.isCompleted ? "opacity-70" : "",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleSelectTask(task.id)}
                    className="text-left flex-1"
                    aria-pressed={isActive}
                  >
                    <p
                      className={cn(
                        "text-sm font-medium",
                        task.isCompleted ? "line-through text-white/60" : "text-white",
                        isActive ? "drop-shadow" : "",
                      )}
                    >
                      {task.title}
                    </p>
                    <p className="text-xs text-white/60">
                      {task.pomodorosCompleted} / {task.pomodorosRequired} pomodoro{task.pomodorosRequired === 1 ? "" : "s"}
                    </p>
                    <p className="text-[0.65rem] text-white/50">{pomodorosRemaining} remaining</p>
                  </button>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={() => onToggleTaskComplete(task.id)}
                    >
                      {task.isCompleted ? "Reopen" : "Done"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="bg-white/5 hover:bg-white/15 text-white"
                      onClick={() => onDeleteTask(task.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
