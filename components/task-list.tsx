"use client"

import {
  useEffect,
  useId,
  useRef,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import type { CheckedState } from '@radix-ui/react-checkbox'
import { Check, Pencil, PlayCircle, Trash2, X } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface Task {
  readonly id: string
  readonly title: string
  readonly isCompleted: boolean
}

export interface TaskListProps {
  readonly tasks: Task[]
  readonly activeTaskId: string | null
  readonly onAdd?: (title: string) => Promise<void> | void
  readonly onToggleComplete?: (taskId: string, nextCompleted: boolean) => Promise<void> | void
  readonly onRename?: (taskId: string, nextTitle: string) => Promise<void> | void
  readonly onDelete?: (taskId: string) => Promise<void> | void
  readonly onSetActive?: (taskId: string | null) => Promise<void> | void
  readonly isAddDisabled?: boolean
  readonly isToggleDisabled?: boolean
  readonly isRenameDisabled?: boolean
  readonly isDeleteDisabled?: boolean
  readonly isActiveSelectionDisabled?: boolean
}

const sanitizeTaskTitle = (value: string): string => {
  const withoutControlCharacters: string = value.replace(/[\r\n\t]+/g, ' ')
  const collapsedWhitespace: string = withoutControlCharacters.replace(/\s+/g, ' ')
  const trimmed: string = collapsedWhitespace.trim()
  const strippedUnsafe: string = trimmed.replace(/[<>]/g, '')
  return strippedUnsafe
}

export function TaskList({
  tasks,
  activeTaskId,
  onAdd,
  onToggleComplete,
  onRename,
  onDelete,
  onSetActive,
  isAddDisabled = false,
  isToggleDisabled = false,
  isRenameDisabled = false,
  isDeleteDisabled = false,
  isActiveSelectionDisabled = false,
}: TaskListProps): JSX.Element {
  const [newTaskTitle, setNewTaskTitle] = useState<string>('')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState<string>('')

  const addInputRef = useRef<HTMLInputElement | null>(null)
  const editingInputRef = useRef<HTMLInputElement | null>(null)

  const listHeadingId = useId()
  const activeRadioGroupName: string = `${listHeadingId}-active-task`

  const safeTasks: Task[] = useMemo(() => {
    return tasks.filter((taskItem): taskItem is Task => taskItem !== null && taskItem !== undefined)
  }, [tasks])

  const sanitizedNewTaskTitle: string = sanitizeTaskTitle(newTaskTitle)
  const sanitizedEditingTitle: string = sanitizeTaskTitle(editingTitle)

  const addUnavailable: boolean = isAddDisabled || typeof onAdd !== 'function'
  const toggleUnavailable: boolean = isToggleDisabled || typeof onToggleComplete !== 'function'
  const renameUnavailable: boolean = isRenameDisabled || typeof onRename !== 'function'
  const deleteUnavailable: boolean = isDeleteDisabled || typeof onDelete !== 'function'
  const activeSelectionUnavailable: boolean =
    isActiveSelectionDisabled || typeof onSetActive !== 'function'

  useEffect((): void => {
    if (editingTaskId !== null && editingInputRef.current) {
      editingInputRef.current.focus()
      editingInputRef.current.select()
    }
  }, [editingTaskId])

  useEffect((): void => {
    if (editingTaskId !== null && safeTasks.every((task) => task.id !== editingTaskId)) {
      // When the task list updates without the edited task (e.g., deletion), clear edit mode gracefully.
      setEditingTaskId(null)
      setEditingTitle('')
      editingInputRef.current = null
    }
  }, [editingTaskId, safeTasks])

  const handleNewTaskChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setNewTaskTitle(event.target.value)
  }

  const handleAddTask = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()

    const sanitizedValue: string = sanitizeTaskTitle(newTaskTitle)
    if (sanitizedValue.length === 0) {
      setNewTaskTitle(sanitizedValue)
      return
    }

    if (typeof onAdd !== 'function' || isAddDisabled) {
      return
    }

    try {
      await onAdd(sanitizedValue)
      setNewTaskTitle('')
      addInputRef.current?.focus()
    } catch (error) {
      console.error('Failed to add task', error)
    }
  }

  const handleToggleCompleted = async (
    task: Task,
    checkedState: CheckedState,
  ): Promise<void> => {
    if (typeof onToggleComplete !== 'function' || isToggleDisabled) {
      return
    }

    const nextCompleted: boolean = checkedState === true

    try {
      await onToggleComplete(task.id, nextCompleted)
    } catch (error) {
      console.error('Failed to toggle task completion', error)
    }
  }

  const handleStartEditing = (task: Task): void => {
    if (renameUnavailable) {
      return
    }

    // Preserve which task is being edited so keyboard users can cancel/confirm without losing context.
    setEditingTaskId(task.id)
    setEditingTitle(task.title)
  }

  const exitEditing = (): void => {
    setEditingTaskId(null)
    setEditingTitle('')
    editingInputRef.current = null
  }

  const commitRename = async (): Promise<void> => {
    if (editingTaskId === null) {
      return
    }

    const sanitizedValue: string = sanitizeTaskTitle(editingTitle)
    if (sanitizedValue.length === 0) {
      setEditingTitle(sanitizedValue)
      return
    }

    if (typeof onRename !== 'function' || isRenameDisabled) {
      return
    }

    try {
      await onRename(editingTaskId, sanitizedValue)
      exitEditing()
      addInputRef.current?.focus()
    } catch (error) {
      console.error('Failed to rename task', error)
    }
  }

  const handleEditInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setEditingTitle(event.target.value)
  }

  const handleEditKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault()
      exitEditing()
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      void commitRename()
    }
  }

  const handleDeleteTask = async (taskId: string): Promise<void> => {
    if (typeof onDelete !== 'function' || isDeleteDisabled) {
      return
    }

    try {
      await onDelete(taskId)
      if (editingTaskId === taskId) {
        exitEditing()
      }
    } catch (error) {
      console.error('Failed to delete task', error)
    }
  }

  const handleSetActiveTask = async (taskId: string): Promise<void> => {
    if (typeof onSetActive !== 'function' || isActiveSelectionDisabled) {
      return
    }

    if (taskId === activeTaskId) {
      return
    }

    try {
      await onSetActive(taskId)
    } catch (error) {
      console.error('Failed to set active task', error)
    }
  }

  return (
    <section
      aria-labelledby={listHeadingId}
      className="space-y-4 rounded-2xl border border-white/15 bg-black/40 p-4 text-white backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id={listHeadingId} className="text-lg font-semibold">
          Task List
        </h2>
        <span className="text-sm text-white/60" aria-live="polite">
          {safeTasks.length} {safeTasks.length === 1 ? 'task' : 'tasks'}
        </span>
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={handleAddTask}
        noValidate
        aria-label="Add a new task"
      >
        <Input
          ref={addInputRef}
          id={`${listHeadingId}-new-task`}
          value={newTaskTitle}
          onChange={handleNewTaskChange}
          placeholder="Add a focus task"
          aria-invalid={sanitizedNewTaskTitle.length === 0 && newTaskTitle.length > 0}
          aria-describedby={`${listHeadingId}-hint`}
          disabled={isAddDisabled}
          autoComplete="off"
          spellCheck
        />
        <Button
          type="submit"
          className="sm:w-auto"
          disabled={sanitizedNewTaskTitle.length === 0 || addUnavailable}
        >
          Add Task
        </Button>
      </form>
      <p id={`${listHeadingId}-hint`} className="sr-only">
        Task names must include at least one visible character.
      </p>

      <ul role="list" className="space-y-3" aria-describedby={`${listHeadingId}-hint`}>
        {safeTasks.length === 0 ? (
          <li className="rounded-xl border border-dashed border-white/15 bg-black/20 p-4 text-sm text-white/60">
            No tasks yet. Add a focus item to get started.
          </li>
        ) : (
          safeTasks.map((task) => {
            const isEditing: boolean = editingTaskId === task.id
            const isActive: boolean = task.id === activeTaskId
            const displayTitle: string = task.title.trim().length > 0 ? task.title : 'Untitled task'

            return (
              <li
                key={task.id}
                className="rounded-xl border border-white/10 bg-black/30 p-3 shadow-sm transition-colors focus-within:border-white/30"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`${listHeadingId}-${task.id}-checkbox`}
                      checked={task.isCompleted}
                      aria-label={
                        task.isCompleted
                          ? `Mark ${displayTitle} as incomplete`
                          : `Mark ${displayTitle} as complete`
                      }
                      disabled={toggleUnavailable}
                      onCheckedChange={(checked) => {
                        void handleToggleCompleted(task, checked)
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <Input
                            ref={(node) => {
                              if (isEditing) {
                                editingInputRef.current = node
                              }
                            }}
                            value={editingTitle}
                            onChange={handleEditInputChange}
                            onKeyDown={handleEditKeyDown}
                            aria-label={`Edit ${displayTitle}`}
                            disabled={renameUnavailable}
                            autoComplete="off"
                            spellCheck
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                void commitRename()
                              }}
                              disabled={sanitizedEditingTitle.length === 0 || renameUnavailable}
                              className="gap-1"
                            >
                              <Check className="size-4" aria-hidden />
                              <span>Save</span>
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={exitEditing}
                              className="gap-1"
                            >
                              <X className="size-4" aria-hidden />
                              <span>Cancel</span>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p
                          className={cn(
                            'text-sm font-medium text-white',
                            task.isCompleted ? 'line-through text-white/50' : 'text-white',
                          )}
                        >
                          {displayTitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {!isEditing && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEditing(task)}
                        disabled={renameUnavailable}
                        className="gap-1"
                      >
                        <Pencil className="size-4" aria-hidden />
                        <span>Edit</span>
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        void handleDeleteTask(task.id)
                      }}
                      disabled={deleteUnavailable}
                      className="gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" aria-hidden />
                      <span>Delete</span>
                    </Button>
                    <label
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'sm' }),
                        'gap-1 border border-transparent px-3 text-xs transition',
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'text-white/70 hover:border-white/30 hover:bg-white/10',
                        activeSelectionUnavailable ? 'pointer-events-none opacity-50' : '',
                      )}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        name={activeRadioGroupName}
                        value={task.id}
                        checked={isActive}
                        onChange={() => {
                          void handleSetActiveTask(task.id)
                        }}
                        disabled={activeSelectionUnavailable}
                        aria-label={
                          isActive
                            ? `${displayTitle} is the active task`
                            : `Set ${displayTitle} as the active task`
                        }
                      />
                      <PlayCircle className="size-4" aria-hidden />
                      <span>{isActive ? 'Active' : 'Focus'}</span>
                    </label>
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
