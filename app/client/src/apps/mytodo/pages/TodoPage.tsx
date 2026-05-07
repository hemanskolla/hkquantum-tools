import '../styles/mytodo.css';
import { useEffect, useMemo, useState } from 'react';
import type { Task, TodoCategory } from '@shared/types/mytodo';
import Header from '../../../components/Header';
import TaskList from '../components/TaskList';
import FabMenu from '../components/FabMenu';
import AddCategoryModal from '../components/AddCategoryModal';
import AddTaskModal from '../components/AddTaskModal';

type View = 'active' | 'completed';
type Modal = 'none' | 'category' | 'task';

export default function TodoPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<TodoCategory[]>([]);
  const [view, setView] = useState<View>('active');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modal, setModal] = useState<Modal>('none');
  const [editing, setEditing] = useState<Task | null>(null);

  useEffect(() => { document.title = 'myTODO'; }, []);

  async function reloadCategories(retries = 8): Promise<void> {
    try {
      const cats = await fetch('/api/mytodo/categories').then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<TodoCategory[]>;
      });
      setCategories(cats);
    } catch {
      if (retries > 0) setTimeout(() => void reloadCategories(retries - 1), 1000);
    }
  }

  async function reloadTasks(v: View = view, retries = 8): Promise<void> {
    try {
      const ts = await fetch(`/api/mytodo/tasks?view=${v}`).then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<Task[]>;
      });
      setTasks(ts);
    } catch {
      if (retries > 0) setTimeout(() => void reloadTasks(v, retries - 1), 1000);
    }
  }

  useEffect(() => {
    void reloadCategories();
    void reloadTasks(view);
  }, []);

  function switchView(v: View) {
    setView(v);
    void reloadTasks(v);
  }

  async function handleToggleComplete(id: string) {
    await fetch(`/api/mytodo/tasks/${id}/complete`, { method: 'PATCH' });
    void reloadTasks(view);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this task?')) return;
    await fetch(`/api/mytodo/tasks/${id}`, { method: 'DELETE' });
    void reloadTasks(view);
  }

  function handleEdit(task: Task) {
    setEditing(task);
    setModal('task');
  }

  const visibleTasks = useMemo(() => {
    if (!selectedCategoryId) return tasks;
    return tasks.filter((t) => t.category_id === selectedCategoryId);
  }, [tasks, selectedCategoryId]);

  return (
    <div className="todo-layout">
      <Header />

      <div className="todo-body">
        {/* ── Sidebar ── */}
        <aside className={`todo-sidebar${sidebarOpen ? '' : ' todo-sidebar--closed'}`}>
          <button
            className="todo-sidebar__toggle"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            title={sidebarOpen ? 'Collapse' : 'Expand'}
          >
            {sidebarOpen ? '‹' : '›'}
          </button>

          {sidebarOpen && (
            <div className="todo-sidebar__content">
              <span className="todo-sidebar__label">Categories</span>

              <button
                className={`sidebar-cat-btn${selectedCategoryId === null ? ' sidebar-cat-btn--active' : ''}`}
                onClick={() => setSelectedCategoryId(null)}
              >
                <span className="sidebar-cat-dot" />
                All
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`sidebar-cat-btn${selectedCategoryId === cat.id ? ' sidebar-cat-btn--active' : ''}`}
                  onClick={() => setSelectedCategoryId((prev) => prev === cat.id ? null : cat.id)}
                >
                  <span className="sidebar-cat-dot" />
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* ── Main content ── */}
        <div className="todo-main">
          <div className="todo-tabs">
            <button
              className={`todo-tab${view === 'active' ? ' todo-tab--active' : ''}`}
              onClick={() => switchView('active')}
            >
              Active
            </button>
            <button
              className={`todo-tab${view === 'completed' ? ' todo-tab--active' : ''}`}
              onClick={() => switchView('completed')}
            >
              Completed
            </button>
          </div>

          {view === 'completed' && (
            <div className="todo-completed-banner">
              Showing tasks completed in the <strong>past 14 days</strong>. Older completed tasks are automatically removed.
            </div>
          )}

          <TaskList
            tasks={visibleTasks}
            categories={categories}
            view={view}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleComplete={handleToggleComplete}
          />
        </div>
      </div>

      <FabMenu
        onAddCategory={() => setModal('category')}
        onAddTask={() => { setEditing(null); setModal('task'); }}
      />

      {modal === 'category' && (
        <AddCategoryModal
          onClose={() => setModal('none')}
          onSuccess={() => void reloadCategories()}
        />
      )}

      {modal === 'task' && (
        <AddTaskModal
          categories={categories}
          editing={editing}
          onClose={() => { setModal('none'); setEditing(null); }}
          onSuccess={() => void reloadTasks(view)}
        />
      )}
    </div>
  );
}
