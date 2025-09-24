import { useCallback, useEffect, useState } from "react"

export interface Task {
  id: string
  title: string
  pomodorosRequired: number
  pomodorosCompleted: number
  isCompleted: boolean
}

export interface TaskInput {
  title: string
  pomodorosRequired: number
}

export interface UseTaskListResult {
  tasks: Task[]
  addTask: (task: TaskInput) => Task | null
  deleteTask: (taskId: string) => Task | null
  toggleTaskComplete: (taskId: string) => Task | null
  incrementPomodoros: (taskId: string) => Task | null
  getTaskById: (taskId: string) => Task | null
}

const STORAGE_KEY = "pomopulse.tasks"

const isTask = (value: unknown): value is Task => {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const maybeTask = value as Partial<Task>
  return (
    typeof maybeTask.id === "string" &&
    typeof maybeTask.title === "string" &&
    typeof maybeTask.pomodorosRequired === "number" &&
    typeof maybeTask.pomodorosCompleted === "number" &&
    typeof maybeTask.isCompleted === "boolean"
  )
}

const createId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const parseStoredTasks = (rawValue: unknown): Task[] => {
  if (typeof rawValue !== "string") {
    return []
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter(isTask)
      .map((task: Task): Task => ({
        ...task,
        pomodorosRequired: Math.max(1, Math.round(task.pomodorosRequired)),
        pomodorosCompleted: Math.max(0, Math.min(Math.round(task.pomodorosCompleted), Math.max(1, Math.round(task.pomodorosRequired)))),
      }))
  } catch (error) {
    console.error("Failed to parse stored tasks", error)
    return []
  }
}

export function useTaskList(): UseTaskListResult {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return
    }

    const parsedTasks = parseStoredTasks(stored)
    if (parsedTasks.length > 0) {
      setTasks(parsedTasks)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  const addTask = useCallback((task: TaskInput): Task | null => {
    const trimmedTitle = task.title.trim()
    if (trimmedTitle.length === 0) {
      return null
    }

    const required = Number.isFinite(task.pomodorosRequired)
      ? Math.max(1, Math.round(task.pomodorosRequired))
      : 1

    const newTask: Task = {
      id: createId(),
      title: trimmedTitle,
      pomodorosRequired: required,
      pomodorosCompleted: 0,
      isCompleted: false,
    }

    setTasks((previous: Task[]): Task[] => [...previous, newTask])
    return newTask
  }, [])

  const deleteTask = useCallback((taskId: string): Task | null => {
    let removedTask: Task | null = null
    setTasks((previous: Task[]): Task[] => {
      const nextTasks = previous.filter((task: Task): boolean => {
        if (task.id === taskId) {
          removedTask = task
          return false
        }
        return true
      })
      return nextTasks
    })
    return removedTask
  }, [])

  const toggleTaskComplete = useCallback((taskId: string): Task | null => {
    let updatedTask: Task | null = null
    setTasks((previous: Task[]): Task[] =>
      previous.map((task: Task): Task => {
        if (task.id !== taskId) {
          return task
        }
        const isCompleted = !task.isCompleted
        const pomodorosCompleted = isCompleted
          ? task.pomodorosRequired
          : Math.min(task.pomodorosCompleted, task.pomodorosRequired)

        updatedTask = {
          ...task,
          isCompleted,
          pomodorosCompleted,
        }
        return updatedTask
      }),
    )
    return updatedTask
  }, [])

  const incrementPomodoros = useCallback((taskId: string): Task | null => {
    let updatedTask: Task | null = null
    setTasks((previous: Task[]): Task[] =>
      previous.map((task: Task): Task => {
        if (task.id !== taskId) {
          return task
        }

        if (task.pomodorosCompleted >= task.pomodorosRequired) {
          updatedTask = task
          return task
        }

        updatedTask = {
          ...task,
          pomodorosCompleted: Math.min(task.pomodorosRequired, task.pomodorosCompleted + 1),
        }
        return updatedTask
      }),
    )
    return updatedTask
  }, [])

  const getTaskById = useCallback(
    (taskId: string): Task | null => tasks.find((task: Task): boolean => task.id === taskId) ?? null,
    [tasks],
  )

  return {
    tasks,
    addTask,
    deleteTask,
    toggleTaskComplete,
    incrementPomodoros,
    getTaskById,
  }
}
