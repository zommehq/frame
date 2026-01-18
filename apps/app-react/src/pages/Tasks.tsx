import { useFrameSDK } from "@zomme/frame-react";
import { useMemo, useState } from "react";
import type { Task } from "../types";

interface TasksProps {
  tasks?: Task[];
}

export default function Tasks(props: TasksProps) {
  const { emit, isReady } = useFrameSDK<TasksProps>();

  const [tasks, setTasks] = useState<Task[]>(
    props.tasks || [
      {
        completed: false,
        description: "Review pull requests",
        id: 1,
        priority: "high",
        title: "Code Review",
      },
      {
        completed: true,
        description: "Fix bug in authentication",
        id: 2,
        priority: "high",
        title: "Bug Fix",
      },
      {
        completed: false,
        description: "Update documentation",
        id: 3,
        priority: "medium",
        title: "Documentation",
      },
      {
        completed: false,
        description: "Refactor legacy code",
        id: 4,
        priority: "low",
        title: "Refactoring",
      },
    ],
  );

  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (filter === "active") {
      result = result.filter((t) => !t.completed);
    } else if (filter === "completed") {
      result = result.filter((t) => t.completed);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) => t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query),
      );
    }

    return result;
  }, [tasks, filter, searchQuery]);

  const taskStats = useMemo(
    () => ({
      active: tasks.filter((t) => !t.completed).length,
      completed: tasks.filter((t) => t.completed).length,
      total: tasks.length,
    }),
    [tasks],
  );

  function toggleTask(taskId: number) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t,
    );
    setTasks(updatedTasks);

    emit("task-toggled", {
      completed: !task.completed,
      id: taskId,
      timestamp: Date.now(),
    });

    const newStats = {
      active: updatedTasks.filter((t) => !t.completed).length,
      completed: updatedTasks.filter((t) => t.completed).length,
      total: updatedTasks.length,
    };
    emit("task-stats-changed", newStats);
  }

  function deleteTask(taskId: number) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedTasks = tasks.filter((t) => t.id !== taskId);
    setTasks(updatedTasks);

    emit("task-deleted", {
      id: taskId,
      title: task.title,
    });

    const newStats = {
      active: updatedTasks.filter((t) => !t.completed).length,
      completed: updatedTasks.filter((t) => t.completed).length,
      total: updatedTasks.length,
    };
    emit("task-stats-changed", newStats);
  }

  function addTask() {
    const newTask: Task = {
      completed: false,
      description: "New task description",
      id: Date.now(),
      priority: "medium",
      title: "New Task",
    };

    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);

    emit("task-added", {
      id: newTask.id,
      title: newTask.title,
    });

    const newStats = {
      active: updatedTasks.filter((t) => !t.completed).length,
      completed: updatedTasks.filter((t) => t.completed).length,
      total: updatedTasks.length,
    };
    emit("task-stats-changed", newStats);
  }

  function getPriorityColor(priority: string): string {
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

  function handleSearch(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setSearchQuery(value);

    emit("search-performed", {
      query: value,
      results: filteredTasks.length,
    });
  }

  return (
    <div style={styles.taskListPage}>
      <div style={styles.header}>
        <h1 style={styles.headerH1}>Task Management</h1>
        <p style={styles.subtitle}>Demonstrating Props + Events + Search</p>
      </div>

      {!isReady ? (
        <div style={styles.loading}>Loading SDK...</div>
      ) : (
        <div style={styles.content}>
          <div style={styles.statsBar}>
            <div style={styles.stat}>
              <span style={styles.statLabel}>Total</span>
              <span style={styles.statValue}>{taskStats.total}</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statLabel}>Active</span>
              <span style={{ ...styles.statValue, ...styles.statValueActive }}>
                {taskStats.active}
              </span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statLabel}>Completed</span>
              <span style={{ ...styles.statValue, ...styles.statValueCompleted }}>
                {taskStats.completed}
              </span>
            </div>
          </div>

          <div style={styles.controls}>
            <div style={styles.searchBox}>
              <input
                placeholder="Search tasks..."
                style={styles.searchInput}
                type="text"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>

            <div style={styles.filterButtons}>
              <button
                style={{
                  ...styles.filterBtn,
                  ...(filter === "all" ? styles.filterBtnActive : {}),
                }}
                type="button"
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                style={{
                  ...styles.filterBtn,
                  ...(filter === "active" ? styles.filterBtnActive : {}),
                }}
                type="button"
                onClick={() => setFilter("active")}
              >
                Active
              </button>
              <button
                style={{
                  ...styles.filterBtn,
                  ...(filter === "completed" ? styles.filterBtnActive : {}),
                }}
                type="button"
                onClick={() => setFilter("completed")}
              >
                Completed
              </button>
            </div>

            <button style={styles.addBtn} type="button" onClick={addTask}>
              + Add Task
            </button>
          </div>

          <div style={styles.tasks}>
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                style={{
                  ...styles.taskCard,
                  ...(task.completed ? styles.taskCardCompleted : {}),
                }}
              >
                <div style={styles.taskCheckbox}>
                  <input
                    checked={task.completed}
                    style={styles.taskCheckboxInput}
                    type="checkbox"
                    onChange={() => toggleTask(task.id)}
                  />
                </div>

                <div style={styles.taskContent}>
                  <div style={styles.taskHeader}>
                    <h3
                      style={{
                        ...styles.taskTitle,
                        ...(task.completed ? styles.taskTitleCompleted : {}),
                      }}
                    >
                      {task.title}
                    </h3>
                    <span
                      style={{
                        ...styles.taskPriority,
                        backgroundColor: getPriorityColor(task.priority),
                      }}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <p
                    style={{
                      ...styles.taskDescription,
                      ...(task.completed ? styles.taskDescriptionCompleted : {}),
                    }}
                  >
                    {task.description}
                  </p>
                </div>

                <button style={styles.deleteBtn} type="button" onClick={() => deleteTask(task.id)}>
                  Delete
                </button>
              </div>
            ))}

            {filteredTasks.length === 0 && (
              <div style={styles.emptyState}>
                <p>No tasks found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  addBtn: {
    background: "#61dafb",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 600,
    padding: "0.75rem 1.5rem",
    transition: "background 0.2s",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  controls: {
    alignItems: "center",
    display: "flex",
    gap: "1rem",
  },
  deleteBtn: {
    background: "#ef4444",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
    padding: "0.5rem 1rem",
    transition: "background 0.2s",
  },
  emptyState: {
    color: "#9ca3af",
    fontSize: "1rem",
    padding: "3rem",
    textAlign: "center",
  },
  filterBtn: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
    padding: "0.75rem 1rem",
    transition: "all 0.2s",
  },
  filterBtnActive: {
    background: "#61dafb",
    borderColor: "#61dafb",
    color: "white",
  },
  filterButtons: {
    display: "flex",
    gap: "0.5rem",
  },
  header: {
    marginBottom: "2rem",
  },
  headerH1: {
    color: "#1a1a1a",
    fontSize: "2rem",
    margin: 0,
  },
  loading: {
    color: "#666",
    padding: "2rem",
    textAlign: "center",
  },
  searchBox: {
    flex: 1,
  },
  searchInput: {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "0.875rem",
    padding: "0.75rem 1rem",
    transition: "border-color 0.2s",
    width: "100%",
  },
  stat: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    gap: "0.25rem",
  },
  statLabel: {
    color: "#666",
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  statValue: {
    color: "#1a1a1a",
    fontSize: "1.75rem",
    fontWeight: 700,
  },
  statValueActive: {
    color: "#3b82f6",
  },
  statValueCompleted: {
    color: "#10b981",
  },
  statsBar: {
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    display: "flex",
    gap: "1rem",
    padding: "1.5rem",
  },
  subtitle: {
    color: "#666",
    fontSize: "0.875rem",
    margin: "0.5rem 0 0",
  },
  taskCard: {
    alignItems: "center",
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    display: "flex",
    gap: "1rem",
    padding: "1.25rem",
    transition: "all 0.2s",
  },
  taskCardCompleted: {
    opacity: 0.7,
  },
  taskCheckbox: {},
  taskCheckboxInput: {
    cursor: "pointer",
    height: "1.25rem",
    width: "1.25rem",
  },
  taskContent: {
    flex: 1,
  },
  taskDescription: {
    color: "#666",
    fontSize: "0.875rem",
    margin: 0,
  },
  taskDescriptionCompleted: {
    textDecoration: "line-through",
  },
  taskHeader: {
    alignItems: "center",
    display: "flex",
    gap: "0.75rem",
    marginBottom: "0.25rem",
  },
  taskListPage: {
    margin: "0 auto",
    maxWidth: "1200px",
    padding: "2rem",
  },
  taskPriority: {
    borderRadius: "4px",
    color: "white",
    fontSize: "0.75rem",
    fontWeight: 600,
    padding: "0.25rem 0.5rem",
    textTransform: "uppercase",
  },
  taskTitle: {
    color: "#1a1a1a",
    fontSize: "1rem",
    fontWeight: 600,
    margin: 0,
  },
  taskTitleCompleted: {
    textDecoration: "line-through",
  },
  tasks: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
};
