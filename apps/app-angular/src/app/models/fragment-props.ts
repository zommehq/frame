import type { Task } from "./types";

/**
 * Common props shared across all fragments
 */
export interface BaseFragmentProps {
  theme?: "dark" | "light";
  user?: {
    email: string;
    id: number;
    name: string;
    role: string;
  };
}

/**
 * Props for Home fragment
 */
export interface HomeFragmentProps extends BaseFragmentProps {}

/**
 * Props for Analytics fragment
 */
export interface AnalyticsFragmentProps extends BaseFragmentProps {
  metricsData?: ArrayBuffer;
}

/**
 * Task management actions
 */
export interface TaskCallbacks {
  addTask?: (task: Omit<Task, "id">) => Task;
  addRandomTask?: () => Task;
  clearCompleted?: () => { removed: number; success: boolean };
  deleteTask?: (taskId: number) => boolean;
  getTaskStats?: () => { active: number; completed: number; total: number };
  refreshTasks?: () => { success: boolean; tasksLoaded: number };
  toggleTask?: (taskId: number) => Task | undefined;
  updateTask?: (taskId: number, updates: Partial<Task>) => Task | undefined;
}

/**
 * Props for Tasks fragment
 */
export interface TasksFragmentProps extends BaseFragmentProps, TaskCallbacks {
  tasks?: Task[];
}

/**
 * Settings management actions
 */
export interface SettingsCallbacks {
  changeTheme?: (theme: "dark" | "light") => void;
}

/**
 * Props for Settings fragment
 */
export interface SettingsFragmentProps extends BaseFragmentProps, SettingsCallbacks {}
