import { useFrameSDK } from "@zomme/frame-react";
import { useRef, useState } from "react";
import type { Task, TasksFrameProps } from "../types";

export default function Tasks() {
  const { isReady, props } = useFrameSDK<TasksFrameProps>();

  // Local state for editing
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  // Refs for edit form
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);
  const prioritySelectRef = useRef<HTMLSelectElement>(null);

  // Props from shell (reactive)
  const filteredTasks = props.filteredTasks || [];
  const filter = props.filter || "all";
  const searchQuery = props.searchQuery || "";
  const taskStats = props.taskStats || { total: 0, active: 0, completed: 0 };

  async function handleSetFilter(newFilter: "active" | "all" | "completed") {
    if (props.setFilter) {
      await props.setFilter(newFilter);
    }
  }

  async function handleToggleTask(taskId: number) {
    if (props.toggleTask) {
      await props.toggleTask(taskId);
    }
  }

  async function handleDeleteTask(taskId: number) {
    if (props.deleteTask) {
      await props.deleteTask(taskId);
    }
  }

  async function handleAddTask() {
    if (props.addRandomTask) {
      const newTask = await props.addRandomTask();
      if (newTask) {
        setEditingTaskId((newTask as Task).id);
      }
    }
  }

  async function handleSearch(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    if (props.setSearchQuery) {
      await props.setSearchQuery(value);
    }
  }

  function startEdit(taskId: number) {
    setEditingTaskId(taskId);
  }

  function cancelEdit() {
    setEditingTaskId(null);
  }

  async function saveEdit(taskId: number) {
    if (!props.updateTask) return;

    const title = titleInputRef.current?.value || "";
    const description = descInputRef.current?.value || "";
    const priority = (prioritySelectRef.current?.value || "medium") as "high" | "medium" | "low";

    const updatedTask = await props.updateTask(taskId, {
      title,
      description,
      priority,
    });

    if (updatedTask) {
      setEditingTaskId(null);
    }
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

  return (
    <div style={styles.taskListPage}>
      <div style={styles.header}>
        <h1 style={styles.headerH1}>Task Management</h1>
        <p style={styles.subtitle}>Props + Events + Search functionality</p>
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
                onClick={() => handleSetFilter("all")}
              >
                All
              </button>
              <button
                style={{
                  ...styles.filterBtn,
                  ...(filter === "active" ? styles.filterBtnActive : {}),
                }}
                type="button"
                onClick={() => handleSetFilter("active")}
              >
                Active
              </button>
              <button
                style={{
                  ...styles.filterBtn,
                  ...(filter === "completed" ? styles.filterBtnActive : {}),
                }}
                type="button"
                onClick={() => handleSetFilter("completed")}
              >
                Completed
              </button>
            </div>

            <button style={styles.addBtn} type="button" onClick={handleAddTask}>
              + Add Task
            </button>
          </div>

          <div style={styles.tasks}>
            {filteredTasks.map((task: Task) => (
              <div
                key={task.id}
                style={{
                  ...styles.taskCard,
                  ...(task.completed ? styles.taskCardCompleted : {}),
                  ...(editingTaskId === task.id ? styles.taskCardEditing : {}),
                }}
              >
                <div style={styles.taskCheckbox}>
                  <input
                    checked={task.completed}
                    style={styles.taskCheckboxInput}
                    type="checkbox"
                    disabled={editingTaskId === task.id}
                    onChange={() => handleToggleTask(task.id)}
                  />
                </div>

                <div style={styles.taskContent}>
                  {editingTaskId === task.id ? (
                    <div style={styles.editMode}>
                      <input
                        ref={titleInputRef}
                        type="text"
                        style={styles.editTitle}
                        defaultValue={task.title}
                        placeholder="Task title"
                      />
                      <select
                        ref={prioritySelectRef}
                        style={styles.editPriority}
                        defaultValue={task.priority}
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      <textarea
                        ref={descInputRef}
                        style={styles.editDescription}
                        defaultValue={task.description}
                        placeholder="Task description"
                        rows={2}
                      />
                      <div style={styles.editActions}>
                        <button
                          style={styles.saveBtn}
                          type="button"
                          onClick={() => saveEdit(task.id)}
                        >
                          Save
                        </button>
                        <button style={styles.cancelBtn} type="button" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>

                <div style={styles.taskActions}>
                  {editingTaskId !== task.id && (
                    <>
                      <button
                        style={styles.editBtn}
                        type="button"
                        onClick={() => startEdit(task.id)}
                      >
                        Edit
                      </button>
                      <button
                        style={styles.deleteBtn}
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
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
  taskListPage: {
    margin: "0 auto",
    maxWidth: "1200px",
    padding: "2rem",
  },
  header: {
    marginBottom: "2rem",
  },
  headerH1: {
    color: "#1a1a1a",
    fontSize: "2rem",
    margin: 0,
  },
  subtitle: {
    color: "#666",
    fontSize: "0.875rem",
    margin: "0.5rem 0 0",
  },
  loading: {
    color: "#666",
    padding: "2rem",
    textAlign: "center",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  statsBar: {
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    display: "flex",
    gap: "1rem",
    padding: "1.5rem",
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
  controls: {
    alignItems: "center",
    display: "flex",
    gap: "1rem",
  },
  searchBox: {
    flex: 1,
  },
  searchInput: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    borderRadius: "8px",
    fontSize: "0.875rem",
    padding: "0.75rem 1rem",
    transition: "border-color 0.2s",
    width: "100%",
    boxSizing: "border-box",
  },
  filterButtons: {
    display: "flex",
    gap: "0.5rem",
  },
  filterBtn: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    color: "inherit",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
    padding: "0.75rem 1rem",
    transition: "all 0.2s",
  },
  filterBtnActive: {
    background: "#61dafb",
    border: "1px solid #61dafb",
    color: "white",
  },
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
  tasks: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  taskCard: {
    alignItems: "flex-start",
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
  taskCardEditing: {
    boxShadow: "0 0 0 2px #61dafb",
  },
  taskCheckbox: {
    paddingTop: "0.25rem",
  },
  taskCheckboxInput: {
    cursor: "pointer",
    height: "1.25rem",
    width: "1.25rem",
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    alignItems: "center",
    display: "flex",
    gap: "0.75rem",
    marginBottom: "0.25rem",
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
  taskPriority: {
    borderRadius: "4px",
    color: "white",
    fontSize: "0.75rem",
    fontWeight: 600,
    padding: "0.25rem 0.5rem",
    textTransform: "uppercase",
  },
  taskDescription: {
    color: "#666",
    fontSize: "0.875rem",
    margin: 0,
  },
  taskDescriptionCompleted: {
    textDecoration: "line-through",
  },
  taskActions: {
    display: "flex",
    gap: "0.5rem",
  },
  editBtn: {
    background: "#3b82f6",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
    padding: "0.5rem 1rem",
    transition: "background 0.2s",
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
  // Edit mode styles
  editMode: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  editTitle: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: 600,
    padding: "0.5rem 0.75rem",
    width: "100%",
    boxSizing: "border-box",
  },
  editPriority: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    borderRadius: "6px",
    fontSize: "0.875rem",
    padding: "0.5rem 0.75rem",
    width: "fit-content",
  },
  editDescription: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    borderRadius: "6px",
    fontSize: "0.875rem",
    padding: "0.5rem 0.75rem",
    resize: "vertical",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  editActions: {
    display: "flex",
    gap: "0.5rem",
  },
  saveBtn: {
    background: "#10b981",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
    padding: "0.5rem 1rem",
    transition: "background 0.2s",
  },
  cancelBtn: {
    background: "#6b7280",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
    padding: "0.5rem 1rem",
    transition: "background 0.2s",
  },
};
