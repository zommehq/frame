export interface Task {
  completed: boolean;
  description: string;
  id: number;
  priority: "high" | "low" | "medium";
  title: string;
}

export interface TaskStats {
  active: number;
  completed: number;
  total: number;
}

export interface Metrics {
  averageCompletionTime: number;
  completedToday: number;
  productivityScore: number;
  tasksCompleted: number;
  tasksTotal: number;
}

export interface Notification {
  id: number;
  message: string;
  timestamp: number;
  type: "error" | "info" | "success" | "warning";
}

export interface User {
  email: string;
  id: number;
  name: string;
  role: string;
}

// Frame Props Interfaces

/**
 * Common props shared across all frames
 */
export interface BaseFrameProps {
  theme?: "dark" | "light";
  user?: User;
  [key: string]: unknown;
}

/**
 * Task management callbacks (RPC functions from shell)
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
 * Props for Tasks frame
 */
export interface TasksFrameProps extends BaseFrameProps, TaskCallbacks {
  filter?: "active" | "all" | "completed";
  filteredTasks?: Task[];
  searchQuery?: string;
  taskStats?: TaskStats;
}

/**
 * Settings management callbacks
 */
export interface SettingsCallbacks {
  changeTheme?: (theme: "dark" | "light") => void;
  saveCallback?: (settings: any) => Promise<{ success: boolean; message: string }>;
}

/**
 * Props for Settings frame
 */
export interface SettingsFrameProps extends BaseFrameProps, SettingsCallbacks {}

/**
 * Props for Home frame
 */
export interface HomeFrameProps extends BaseFrameProps {
  actionCallback?: (data: any) => void;
  apiUrl?: string;
  base?: string;
}

/**
 * Props for Analytics frame
 */
export interface AnalyticsFrameProps extends BaseFrameProps {
  metricsData?: ArrayBuffer;
}

/**
 * Props for App (root) component
 */
export interface AppFrameProps extends BaseFrameProps {
  successCallback?: (data: any) => void;
}

// Legacy interface for backward compatibility
export interface DashboardState {
  metricsData: ArrayBuffer | null;
  notifications: Notification[];
  tasks: Task[];
  theme: "dark" | "light";
  user: User;
}

export interface SearchParams {
  query: string;
  timestamp: number;
}

export interface SearchResult {
  description: string;
  id: number;
  title: string;
}
