import { useCallback, useEffect, useState } from 'react';
import { Task, isTaskArray } from '../lib/task-types';

const STORAGE_KEY = 'pomodoro.tasks';

interface AddTaskOptions {
  estimatedPomodoros?: number;
  completedPomodoros?: number;
}

export interface UseTaskListResult {
  tasks: Task[];
  addTask: (label: string, options?: AddTaskOptions) => void;
  editTaskLabel: (id: string, nextLabel: string) => void;
  toggleTaskComplete: (id: string) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (startIndex: number, endIndex: number) => void;
  incrementPomodoros: (id: string) => void;
}

const safeReadTasks = (): Task[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (isTaskArray(parsed)) {
      return parsed.map((task: Task) => ({ ...task }));
    }

    console.warn('Stored task data is invalid. Falling back to an empty list.');
    return [];
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to parse tasks from localStorage: ${message}`);
    return [];
  }
};

const generateTaskId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const useTaskList = (): UseTaskListResult => {
  const [tasks, setTasks] = useState<Task[]>(() => safeReadTasks());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const serialized = JSON.stringify(tasks);
      window.localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to persist tasks: ${message}`);
      if (tasks.length > 0) {
        setTasks([]);
      }
    }
  }, [tasks]);

  const addTask = useCallback(
    (label: string, options?: AddTaskOptions): void => {
      const trimmedLabel = label.trim();
      if (trimmedLabel.length === 0) {
        return;
      }

      const estimated = options?.estimatedPomodoros;
      const completed = options?.completedPomodoros;

      setTasks((previous: Task[]) => {
        const nextTask: Task = {
          id: generateTaskId(),
          label: trimmedLabel,
          isCompleted: false,
          createdAt: new Date().toISOString(),
        };

        if (typeof estimated === 'number' && Number.isFinite(estimated) && estimated >= 0) {
          nextTask.estimatedPomodoros = estimated;
        }

        if (typeof completed === 'number' && Number.isFinite(completed) && completed >= 0) {
          nextTask.completedPomodoros = completed;
        }

        return [...previous, nextTask];
      });
    },
    []
  );

  const editTaskLabel = useCallback((id: string, nextLabel: string): void => {
    const trimmedLabel = nextLabel.trim();
    if (trimmedLabel.length === 0) {
      return;
    }

    setTasks((previous: Task[]) => {
      let updated = false;

      const nextTasks = previous.map((task: Task) => {
        if (task.id !== id) {
          return task;
        }

        if (task.label === trimmedLabel) {
          return task;
        }

        updated = true;
        return { ...task, label: trimmedLabel };
      });

      return updated ? nextTasks : previous;
    });
  }, []);

  const toggleTaskComplete = useCallback((id: string): void => {
    setTasks((previous: Task[]) => {
      let updated = false;

      const nextTasks = previous.map((task: Task) => {
        if (task.id !== id) {
          return task;
        }

        updated = true;
        return { ...task, isCompleted: !task.isCompleted };
      });

      return updated ? nextTasks : previous;
    });
  }, []);

  const deleteTask = useCallback((id: string): void => {
    setTasks((previous: Task[]) => {
      const nextTasks = previous.filter((task: Task) => task.id !== id);
      if (nextTasks.length === previous.length) {
        return previous;
      }
      return nextTasks;
    });
  }, []);

  const reorderTasks = useCallback((startIndex: number, endIndex: number): void => {
    setTasks((previous: Task[]) => {
      if (!Number.isInteger(startIndex) || !Number.isInteger(endIndex)) {
        console.warn('reorderTasks received non-integer indices.');
        return previous;
      }

      if (
        startIndex < 0 ||
        startIndex >= previous.length ||
        endIndex < 0 ||
        endIndex >= previous.length
      ) {
        console.warn('reorderTasks received indices outside the task range.');
        return previous;
      }

      if (startIndex === endIndex) {
        return previous;
      }

      const nextTasks = [...previous];
      const [movedTask] = nextTasks.splice(startIndex, 1);
      if (movedTask === undefined) {
        return previous;
      }
      nextTasks.splice(endIndex, 0, movedTask);
      return nextTasks;
    });
  }, []);

  const incrementPomodoros = useCallback((id: string): void => {
    setTasks((previous: Task[]) => {
      let updated = false;

      const nextTasks = previous.map((task: Task) => {
        if (task.id !== id) {
          return task;
        }

        updated = true;
        const completedCount = task.completedPomodoros ?? 0;
        return { ...task, completedPomodoros: completedCount + 1 };
      });

      return updated ? nextTasks : previous;
    });
  }, []);

  return {
    tasks,
    addTask,
    editTaskLabel,
    toggleTaskComplete,
    deleteTask,
    reorderTasks,
    incrementPomodoros,
  };
};
