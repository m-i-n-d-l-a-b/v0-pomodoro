/**
 * Definitions and runtime validators for task entities stored in localStorage.
 * These guards ensure we do not trust untyped persistence data blindly.
 */
export interface Task {
  id: string;
  label: string;
  isCompleted: boolean;
  createdAt: string;
  estimatedPomodoros?: number;
  completedPomodoros?: number;
}

/**
 * Type used for partial updates where the caller must provide an id but can
 * selectively update other properties. We intentionally disallow overriding the
 * creation date to preserve historical ordering metadata.
 */
export type TaskUpdate = Partial<Omit<Task, 'id' | 'createdAt'>> & Pick<Task, 'id'>;

const hasOwnProperty = <T extends object>(value: T, property: PropertyKey): boolean => {
  return Object.prototype.hasOwnProperty.call(value, property);
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value);
};

/**
 * Runtime validator ensuring the provided value conforms to the Task interface.
 */
export const isTask = (value: unknown): value is Task => {
  if (!isRecord(value)) {
    return false;
  }

  if (!hasOwnProperty(value, 'id') || typeof value.id !== 'string') {
    return false;
  }

  if (!hasOwnProperty(value, 'label') || typeof value.label !== 'string') {
    return false;
  }

  if (!hasOwnProperty(value, 'isCompleted') || typeof value.isCompleted !== 'boolean') {
    return false;
  }

  if (!hasOwnProperty(value, 'createdAt') || typeof value.createdAt !== 'string') {
    return false;
  }

  if (hasOwnProperty(value, 'estimatedPomodoros') && value.estimatedPomodoros !== undefined) {
    if (!isFiniteNumber(value.estimatedPomodoros)) {
      return false;
    }
  }

  if (hasOwnProperty(value, 'completedPomodoros') && value.completedPomodoros !== undefined) {
    if (!isFiniteNumber(value.completedPomodoros)) {
      return false;
    }
  }

  return true;
};

/**
 * Runtime validator ensuring we operate on an array of Task entities.
 */
export const isTaskArray = (value: unknown): value is Task[] => {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((item: unknown) => isTask(item));
};
