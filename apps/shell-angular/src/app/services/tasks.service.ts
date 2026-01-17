import { computed, Injectable, signal } from "@angular/core";

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

@Injectable({
  providedIn: "root",
})
export class TasksService {
  private readonly taskTitles = [
    "Code Review", "Bug Fix", "Documentation", "Refactoring",
    "Design System", "API Integration", "Performance Optimization",
    "Security Audit", "Unit Tests", "E2E Tests", "Feature Implementation",
    "Database Migration", "UI/UX Improvements", "Code Cleanup", "Tech Debt",
  ];

  private readonly taskDescriptions = [
    "Review pull requests and provide feedback",
    "Fix critical bug in production",
    "Update technical documentation",
    "Refactor legacy codebase",
    "Create reusable component library",
    "Integrate third-party API",
    "Optimize application performance",
    "Conduct security vulnerability assessment",
    "Write comprehensive unit tests",
    "Implement end-to-end test suite",
    "Build new feature from scratch",
    "Migrate database schema",
    "Enhance user interface and experience",
    "Remove dead code and improve structure",
    "Address accumulated technical debt",
  ];

  private readonly priorities: Array<"high" | "medium" | "low"> = [
    "high", "high", "medium", "medium", "medium", "low",
  ];

  private _tasks = signal<Task[]>([
    { completed: false, description: "Review pull requests", id: 1, priority: "high", title: "Code Review" },
    { completed: true, description: "Fix bug in authentication", id: 2, priority: "high", title: "Bug Fix" },
    { completed: false, description: "Update documentation", id: 3, priority: "medium", title: "Documentation" },
    { completed: false, description: "Refactor legacy code", id: 4, priority: "low", title: "Refactoring" },
  ]);
  readonly tasks = this._tasks.asReadonly();

  readonly taskStats = computed<TaskStats>(() => {
    const allTasks = this._tasks();
    return {
      active: allTasks.filter((t) => !t.completed).length,
      completed: allTasks.filter((t) => t.completed).length,
      total: allTasks.length,
    };
  });

  addTask = (task: Omit<Task, "id">): Task => {
    const newTask: Task = { ...task, id: Date.now() };
    this._tasks.update((tasks) => [newTask, ...tasks]);
    return newTask;
  };

  addRandomTask = (): Task => {
    const randomTitle = this.taskTitles[Math.floor(Math.random() * this.taskTitles.length)];
    const randomDescription = this.taskDescriptions[Math.floor(Math.random() * this.taskDescriptions.length)];
    const randomPriority = this.priorities[Math.floor(Math.random() * this.priorities.length)];

    return this.addTask({
      completed: false,
      description: randomDescription,
      priority: randomPriority,
      title: randomTitle,
    });
  };

  deleteTask = (taskId: number): boolean => {
    const beforeCount = this._tasks().length;
    this._tasks.update((tasks) => tasks.filter((t) => t.id !== taskId));
    return beforeCount > this._tasks().length;
  };

  toggleTask = (taskId: number): Task | undefined => {
    const task = this._tasks().find((t) => t.id === taskId);
    if (!task) return undefined;

    this._tasks.update((tasks) =>
      tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
    );

    return this._tasks().find((t) => t.id === taskId);
  };

  updateTask = (taskId: number, updates: Partial<Task>): Task | undefined => {
    const taskExists = this._tasks().some((t) => t.id === taskId);
    if (!taskExists) return undefined;

    this._tasks.update((tasks) =>
      tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );

    return this._tasks().find((t) => t.id === taskId);
  };

  refreshTasks = (): { success: boolean; tasksLoaded: number } => {
    this._tasks.set([
      { completed: false, description: "Review pull requests", id: 1, priority: "high", title: "Code Review" },
      { completed: true, description: "Fix bug in authentication", id: 2, priority: "high", title: "Bug Fix" },
      { completed: false, description: "Update documentation", id: 3, priority: "medium", title: "Documentation" },
      { completed: false, description: "Refactor legacy code", id: 4, priority: "low", title: "Refactoring" },
    ]);
    return { success: true, tasksLoaded: this._tasks().length };
  };

  clearCompleted = (): { removed: number; success: boolean } => {
    const beforeCount = this._tasks().length;
    this._tasks.update((tasks) => tasks.filter((t) => !t.completed));
    return { removed: beforeCount - this._tasks().length, success: true };
  };

  getTaskStats = (): TaskStats => {
    return this.taskStats();
  };
}
