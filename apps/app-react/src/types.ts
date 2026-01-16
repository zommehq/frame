export interface Task {
  completed: boolean;
  description: string;
  id: number;
  priority: "high" | "low" | "medium";
  title: string;
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
