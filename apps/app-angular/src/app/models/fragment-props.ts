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
  [key: string]: unknown; // Index signature for compatibility with injectFrameProps
}

export interface TaskStats {
  active: number;
  completed: number;
  total: number;
}

/**
 * Task management actions
 *
 * Note: All functions are async when passed via RPC (Remote Procedure Call)
 * through fragment-frame. Always use await when calling these functions.
 */
export interface TaskCallbacks {
  addTask?: (task: Omit<Task, "id">) => Promise<Task>;
  addRandomTask?: () => Promise<Task>;
  clearCompleted?: () => Promise<{ removed: number; success: boolean }>;
  deleteTask?: (taskId: number) => Promise<boolean>;
  getTaskStats?: () => Promise<TaskStats>;
  refreshTasks?: () => Promise<{ success: boolean; tasksLoaded: number }>;
  setFilter?: (filter: "active" | "all" | "completed") => Promise<void>;
  setSearchQuery?: (query: string) => Promise<void>;
  toggleTask?: (taskId: number) => Promise<Task | undefined>;
  updateTask?: (taskId: number, updates: Partial<Task>) => Promise<Task | undefined>;
}

/**
 * Props for Tasks fragment
 */
export interface TasksFragmentProps extends BaseFragmentProps, TaskCallbacks {
  filter?: "active" | "all" | "completed";
  filteredTasks?: Task[];
  searchQuery?: string;
  taskStats?: TaskStats;
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

/**
 * Props for Home fragment
 */
export interface HomeFragmentProps extends BaseFragmentProps {
  actionCallback?: (data: any) => void;
  apiUrl?: string;
  base?: string;
}

/**
 * Props for Analytics fragment
 */
export interface AnalyticsFragmentProps extends BaseFragmentProps {
  metricsData?: ArrayBuffer;
}

/**
 * Props for App (root) component
 */
export interface AppFragmentProps extends BaseFragmentProps {
  successCallback?: (data: any) => void;
}
