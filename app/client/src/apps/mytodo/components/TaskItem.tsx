import { useState } from 'react';
import type { Task, TodoCategory } from '@shared/types/mytodo';

interface Props {
  task: Task;
  categories: TodoCategory[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const wks = Math.floor(days / 7);
  if (wks < 5) return `${wks}w ago`;
  return new Date(iso).toLocaleDateString();
}

export default function TaskItem({ task, categories, onEdit, onDelete, onToggleComplete }: Props) {
  const [completing, setCompleting] = useState(false);

  const category = categories.find((c) => c.id === task.category_id);

  function handleCheck() {
    if (completing) return;
    if (!task.completed) {
      setCompleting(true);
      setTimeout(() => {
        onToggleComplete(task.id);
      }, 630);
    } else {
      onToggleComplete(task.id);
    }
  }

  const timeLabel = task.completed && task.completed_at
    ? `completed ${relativeTime(task.completed_at)}`
    : `updated ${relativeTime(task.updated_at)}`;

  return (
    <div className={`task-item${completing ? ' task-item--completing' : ''}`}>
      <div className="task-checkbox-wrap">
        <input
          type="checkbox"
          className="task-checkbox"
          checked={task.completed || completing}
          onChange={handleCheck}
          aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
        />
      </div>

      <div className="task-body">
        <span className="task-title">{task.title}</span>
        {task.description && (
          <span className="task-description">{task.description}</span>
        )}
        <div className="task-meta">
          {category && <span className="task-cat-pill">{category.name}</span>}
          {task.urgent && !task.completed && (
            <span className="task-urgent-badge">! urgent</span>
          )}
          <span className="task-time">{timeLabel}</span>
        </div>
      </div>

      {!task.completed && (
        <div className="task-actions">
          <button
            className="task-action-btn"
            onClick={() => onEdit(task)}
            aria-label="Edit task"
            title="Edit"
          >
            ✏
          </button>
          <button
            className="task-action-btn task-action-btn--danger"
            onClick={() => onDelete(task.id)}
            aria-label="Delete task"
            title="Delete"
          >
            🗑
          </button>
        </div>
      )}
    </div>
  );
}
