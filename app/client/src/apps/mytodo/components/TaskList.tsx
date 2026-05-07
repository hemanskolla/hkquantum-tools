import type { Task, TodoCategory } from '@shared/types/mytodo';
import TaskItem from './TaskItem';

interface Props {
  tasks: Task[];
  categories: TodoCategory[];
  view: 'active' | 'completed';
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

export default function TaskList({ tasks, categories, view, onEdit, onDelete, onToggleComplete }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="todo-empty">
        {view === 'active'
          ? 'No outstanding tasks. Hit + to add one.'
          : 'No completed tasks in the past 14 days.'}
      </div>
    );
  }

  if (view === 'completed') {
    return (
      <div className="todo-list">
        {tasks.map((t) => (
          <TaskItem
            key={t.id}
            task={t}
            categories={categories}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleComplete={onToggleComplete}
          />
        ))}
      </div>
    );
  }

  const urgent = tasks
    .filter((t) => t.time_sensitive)
    .sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    });
  const rest = tasks.filter((t) => !t.time_sensitive);

  return (
    <div className="todo-list">
      {urgent.length > 0 && (
        <>
          <div className="todo-section-header todo-section-header--urgent">
            <span className="todo-section-icon">!</span>
            Time Sensitive
          </div>
          {urgent.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              categories={categories}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleComplete={onToggleComplete}
            />
          ))}
        </>
      )}

      {rest.length > 0 && (
        <>
          {urgent.length > 0 && (
            <div className="todo-section-header" style={{ marginTop: '.75rem' }}>
              <span className="todo-section-icon">·</span>
              Other Tasks
            </div>
          )}
          {rest.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              categories={categories}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleComplete={onToggleComplete}
            />
          ))}
        </>
      )}
    </div>
  );
}
