import { CommonModule } from "@angular/common";
import { Component, computed, type OnDestroy, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
// biome-ignore lint/style/useImportType: FramePropsService needs to be a regular import for Angular DI
import { FramePropsService } from "@zomme/fragment-frame-angular";
import { PageLayoutComponent } from "../../components/page-layout/page-layout.component";
import type { TasksFragmentProps } from "../../models/fragment-props";
import type { Task } from "../../models/types";

@Component({
  selector: "app-tasks",
  standalone: true,
  imports: [CommonModule, FormsModule, PageLayoutComponent],
  templateUrl: "./tasks.component.html",
  styleUrl: "./tasks.component.css",
})
export class TasksComponent implements OnDestroy {
  tasks = signal<Task[]>([]);
  filter = signal<"active" | "all" | "completed">("all");
  searchQuery = signal("");
  isReady = signal(false);
  editingTaskId = signal<number | null>(null);

  // Reactive props using Signal - always current, no getter needed!
  protected readonly props = this.framePropsService.asSignal<TasksFragmentProps>();

  constructor(private framePropsService: FramePropsService) {
    // Receive initial tasks from parent if available
    const initialProps = this.props();
    if (initialProps.tasks) {
      this.tasks.set(initialProps.tasks);
    }

    this.isReady.set(true);
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  filteredTasks = computed(() => {
    let result = this.tasks();

    if (this.filter() === "active") {
      result = result.filter((t) => !t.completed);
    } else if (this.filter() === "completed") {
      result = result.filter((t) => t.completed);
    }

    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      result = result.filter(
        (t) => t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query),
      );
    }

    return result;
  });

  taskStats = computed(() => ({
    active: this.tasks().filter((t) => !t.completed).length,
    completed: this.tasks().filter((t) => t.completed).length,
    total: this.tasks().length,
  }));

  setFilter(newFilter: "active" | "all" | "completed") {
    this.filter.set(newFilter);
  }

  toggleTask(taskId: number) {
    const props = this.props();
    if (props.toggleTask) {
      const updatedTask = props.toggleTask(taskId);

      if (updatedTask) {
        // Update local state to reflect parent changes
        const updatedTasks = this.tasks().map((t) => (t.id === taskId ? updatedTask : t));
        this.tasks.set(updatedTasks);
      }
    }
  }

  deleteTask(taskId: number) {
    const props = this.props();
    if (props.deleteTask) {
      props.deleteTask(taskId);

      // Update local state to reflect parent changes
      const updatedTasks = this.tasks().filter((t) => t.id !== taskId);
      this.tasks.set(updatedTasks);
    }
  }

  addTask() {
    const props = this.props();
    const newTask = props.addRandomTask?.();

    if (newTask) {
      // Update local state to reflect parent changes
      const updatedTasks = [newTask, ...this.tasks()];
      this.tasks.set(updatedTasks);

      // Automatically enter edit mode for the new task
      this.editingTaskId.set(newTask.id);
    }
  }

  startEdit(taskId: number) {
    this.editingTaskId.set(taskId);
  }

  cancelEdit() {
    this.editingTaskId.set(null);
  }

  saveEdit(taskId: number, title: string, description: string, priority: string) {
    const props = this.props();
    const updatedTask = props.updateTask?.(taskId, {
      description,
      priority: priority as "high" | "medium" | "low",
      title,
    });

    if (updatedTask) {
      // Update local state to reflect parent changes
      const updatedTasks = this.tasks().map((t) => (t.id === taskId ? updatedTask : t));
      this.tasks.set(updatedTasks);
      this.editingTaskId.set(null);
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return "#6b7280";
    }
  }

  handleSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }
}
