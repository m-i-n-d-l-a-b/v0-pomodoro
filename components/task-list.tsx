"use client"

import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react"
import { Check, ChevronDown, ChevronUp, Pencil, Trash2, X } from "lucide-react"

import type { Task } from "@/lib/task-types"
import type { UseTaskListResult } from "@/hooks/useTaskList"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type AddTaskHandler = UseTaskListResult["addTask"]
type EditTaskHandler = UseTaskListResult["editTaskLabel"]
type ToggleTaskHandler = UseTaskListResult["toggleTaskComplete"]
type DeleteTaskHandler = UseTaskListResult["deleteTask"]
type ReorderTaskHandler = UseTaskListResult["reorderTasks"]

type EditButtonRefMap = Record<string, HTMLButtonElement | null>

type ActiveTaskChangeHandler = (taskId: string) => void

export interface TaskListProps {
  tasks: Task[]
  activeTaskId: string | null
  onAdd?: AddTaskHandler
  onEditLabel?: EditTaskHandler
  onToggleComplete?: ToggleTaskHandler
  onDelete?: DeleteTaskHandler
  onReorder?: ReorderTaskHandler
  onSelectActiveTask?: ActiveTaskChangeHandler
}

const sanitizeTaskLabel = (input: string): string => {
  return input.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim()
}

export function TaskList({
  tasks,
  activeTaskId,
  onAdd,
  onEditLabel,
  onToggleComplete,
  onDelete,
  onReorder,
  onSelectActiveTask,
}: TaskListProps): JSX.Element {
  const [newTaskLabel, setNewTaskLabel] = useState<string>("")
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState<string>("")

  // Refs to keep keyboard focus predictable after transitions
  const addInputRef = useRef<HTMLInputElement | null>(null)
  const editingInputRef = useRef<HTMLInputElement | null>(null)
  const editButtonRefs = useRef<EditButtonRefMap>({})
  const pendingFocusTaskIdRef = useRef<string | null>(null)

  const headingId = useId()
  const addInputId = useId()
  const activeName = useId()

  const canAddTask = typeof onAdd === "function"
  const canEditTask = typeof onEditLabel === "function"
  const canToggleTask = typeof onToggleComplete === "function"
  const canDeleteTask = typeof onDelete === "function"
  const canReorderTask = typeof onReorder === "function" && tasks.length > 1
  const canSelectActive = typeof onSelectActiveTask === "function"

  const sanitizedNewTaskLabel = useMemo<string>(() => {
    return sanitizeTaskLabel(newTaskLabel)
  }, [newTaskLabel])

  // When entering edit mode, move focus to the inline input so keyboard users stay in context.
  useEffect(() => {
    if (editingTaskId !== null && editingInputRef.current !== null) {
      editingInputRef.current.focus()
      editingInputRef.current.select()
    }
  }, [editingTaskId])

  // After exiting edit mode, return focus to the originating edit button for continuity.
  useEffect(() => {
    if (editingTaskId !== null) {
      return
    }

    const pendingId = pendingFocusTaskIdRef.current
    if (pendingId === null) {
      return
    }

    const button = editButtonRefs.current[pendingId]
    if (button !== undefined && button !== null) {
      button.focus()
    }
    pendingFocusTaskIdRef.current = null
  }, [editingTaskId])

  // Clean up stored button references whenever the task collection changes to avoid stale nodes.
  useEffect(() => {
    const knownIds = new Set<string>(tasks.map((task: Task) => task.id))
    for (const key of Object.keys(editButtonRefs.current)) {
      if (!knownIds.has(key)) {
        delete editButtonRefs.current[key]
      }
    }

    if (editingTaskId !== null && !knownIds.has(editingTaskId)) {
      setEditingTaskId(null)
      setEditingLabel("")
    }
  }, [tasks, editingTaskId])

  const focusAddInput = (): void => {
    if (addInputRef.current !== null) {
      addInputRef.current.focus()
    }
  }

  const handleNewTaskChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setNewTaskLabel(event.target.value.replace(/[\r\n]+/g, " "))
  }

  const handleAddSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const label = sanitizeTaskLabel(newTaskLabel)
    if (label.length === 0) {
      setNewTaskLabel("")
      focusAddInput()
      return
    }

    if (onAdd) {
      onAdd(label)
      setNewTaskLabel("")
    }

    focusAddInput()
  }

  const exitEditingMode = (taskId: string): void => {
    setEditingTaskId(null)
    setEditingLabel("")
    pendingFocusTaskIdRef.current = taskId
  }

  const handleEditButtonClick = (task: Task): void => {
    if (!canEditTask) {
      return
    }
    setEditingTaskId(task.id)
    setEditingLabel(task.label)
  }

  const handleEditChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setEditingLabel(event.target.value)
  }

  const commitEdit = (task: Task): void => {
    const nextLabel = sanitizeTaskLabel(editingLabel)
    if (nextLabel.length === 0) {
      exitEditingMode(task.id)
      return
    }

    if (canEditTask && nextLabel !== task.label && onEditLabel) {
      onEditLabel(task.id, nextLabel)
    }

    exitEditingMode(task.id)
  }

  const handleEditFormSubmit = (event: FormEvent<HTMLFormElement>, task: Task): void => {
    event.preventDefault()
    commitEdit(task)
  }

  const handleEditKeyDown = (event: KeyboardEvent<HTMLInputElement>, task: Task): void => {
    if (event.key === "Escape") {
      event.preventDefault()
      exitEditingMode(task.id)
    }
    if (event.key === "Enter") {
      event.preventDefault()
      commitEdit(task)
    }
  }

  const handleToggleTask = (taskId: string): void => {
    if (!canToggleTask || !onToggleComplete) {
      return
    }
    onToggleComplete(taskId)
  }

  const handleDeleteTask = (taskId: string): void => {
    if (!canDeleteTask || !onDelete) {
      return
    }
    onDelete(taskId)
  }

  const handleReorder = (startIndex: number, endIndex: number): void => {
    if (!canReorderTask || !onReorder) {
      return
    }

    if (startIndex < 0 || startIndex >= tasks.length || endIndex < 0 || endIndex >= tasks.length) {
      return
    }

    onReorder(startIndex, endIndex)
  }

  const handleSelectActive = (taskId: string): void => {
    if (!canSelectActive || !onSelectActiveTask) {
      return
    }
    onSelectActiveTask(taskId)
  }

  const isAddDisabled = !canAddTask || sanitizedNewTaskLabel.length === 0

  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id={headingId} className="text-lg font-semibold text-white">
          Tasks
        </h2>
        <span className="text-xs text-white/70" aria-live="polite">
          {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
        </span>
      </div>

      <form
        aria-label="Add a new task"
        className="flex gap-2"
        onSubmit={handleAddSubmit}
      >
        <Input
          id={addInputId}
          ref={addInputRef}
          type="text"
          value={newTaskLabel}
          onChange={handleNewTaskChange}
          placeholder="Add a task"
          aria-label="Task name"
          aria-invalid={sanitizedNewTaskLabel.length === 0 && newTaskLabel.length > 0}
          disabled={!canAddTask}
        />
        <Button type="submit" disabled={isAddDisabled}>
          Add
        </Button>
      </form>

      <ul aria-label="Task list" className="space-y-2">
        {tasks.length === 0 ? (
          <li className="rounded-lg border border-dashed border-white/20 px-4 py-6 text-center text-sm text-white/70">
            No tasks yet. Add your first focus item above.
          </li>
        ) : (
          tasks.map((task: Task, index: number) => {
            const isActive = task.id === activeTaskId
            const isEditing = editingTaskId === task.id
            const checkboxId = `task-checkbox-${task.id}`
            const labelId = `task-label-${task.id}`
            const editInputId = `task-edit-${task.id}`
            const activeControlId = `task-active-${task.id}`

            const canMoveUp = canReorderTask && index > 0
            const canMoveDown = canReorderTask && index < tasks.length - 1

            return (
              <li
                key={task.id}
                className="group rounded-lg border border-white/10 bg-black/30 px-3 py-3 backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-3 pt-1">
                    <input
                      id={activeControlId}
                      type="radio"
                      name={activeName}
                      className="h-4 w-4 cursor-pointer rounded-full border border-white/40 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-40"
                      checked={isActive}
                      onChange={() => handleSelectActive(task.id)}
                      disabled={!canSelectActive}
                      aria-label={isActive ? "Active task" : "Mark task as active"}
                    />
                    <label className="sr-only" htmlFor={activeControlId}>
                      {isActive ? "Active task" : "Select as active task"}
                    </label>

                    <input
                      id={checkboxId}
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer rounded border border-white/40 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-40"
                      checked={task.isCompleted}
                      onChange={() => handleToggleTask(task.id)}
                      disabled={!canToggleTask}
                      aria-labelledby={labelId}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    {isEditing ? (
                      <form onSubmit={(event) => handleEditFormSubmit(event, task)} className="flex items-start gap-2">
                        <Input
                          id={editInputId}
                          ref={editingInputRef}
                          type="text"
                          value={editingLabel}
                          onChange={handleEditChange}
                          onKeyDown={(event) => handleEditKeyDown(event, task)}
                          aria-label="Edit task label"
                          aria-describedby={labelId}
                        />
                        <div className="flex items-center gap-1">
                          <Button type="submit" size="icon" variant="ghost" aria-label="Save task label">
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => exitEditingMode(task.id)}
                            aria-label="Cancel editing"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col">
                          <label
                            id={labelId}
                            htmlFor={checkboxId}
                            className={cn(
                              "text-sm text-white transition-colors",
                              task.isCompleted ? "line-through text-white/60" : "text-white",
                            )}
                          >
                            {task.label}
                          </label>
                          <span className="text-xs text-white/50">
                            {task.completedPomodoros ?? 0} / {task.estimatedPomodoros ?? "-"} pomodoros
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {canMoveUp ? (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => handleReorder(index, index - 1)}
                              aria-label="Move task up"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {canMoveDown ? (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => handleReorder(index, index + 1)}
                              aria-label="Move task down"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            disabled={!canEditTask}
                            ref={(node) => {
                              editButtonRefs.current[task.id] = node
                            }}
                            onClick={() => handleEditButtonClick(task)}
                            aria-label="Edit task label"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            disabled={!canDeleteTask}
                            onClick={() => handleDeleteTask(task.id)}
                            aria-label="Delete task"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            )
          })
        )}
      </ul>
    </section>
  )
}
