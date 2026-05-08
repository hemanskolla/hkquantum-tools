import '../styles/mytodo.css';
import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, TodoCategory } from '@shared/types/mytodo';
import Header from '../../../components/Header';
import TaskList from '../components/TaskList';
import FabMenu from '../components/FabMenu';
import AddCategoryModal from '../components/AddCategoryModal';
import AddTaskModal from '../components/AddTaskModal';
import CalendarView from '../components/CalendarView';

interface SortableCatBtnProps {
  cat: TodoCategory;
  isActive: boolean;
  editMode: boolean;
  count: number;
  onSelect: () => void;
}

function SortableCatBtn({ cat, isActive, editMode, count, onSelect }: SortableCatBtnProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      className={[
        'sidebar-cat-btn',
        isActive && !editMode ? 'sidebar-cat-btn--active' : '',
        editMode ? 'sidebar-cat-btn--draggable' : '',
      ].filter(Boolean).join(' ')}
      onClick={editMode ? undefined : onSelect}
      {...(editMode ? { ...attributes, ...listeners } : {})}
    >
      <span className="sidebar-cat-dot" />
      <span className="sidebar-cat-name">{cat.name}</span>
      {!editMode && <span className="sidebar-cat-count">{count}</span>}
    </button>
  );
}

type View = 'active' | 'completed';
type Modal = 'none' | 'category' | 'task';

export default function TodoPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<TodoCategory[]>([]);
  const [view, setView] = useState<View>('active');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarEditMode, setSidebarEditMode] = useState(false);
  const [modal, setModal] = useState<Modal>('none');
  const [editing, setEditing] = useState<Task | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleCategoryDragEnd(event: DragEndEvent) {
    const { active: dragActive, over } = event;
    if (!over || dragActive.id === over.id) return;
    const oldIdx = categories.findIndex((c) => c.id === dragActive.id);
    const newIdx = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIdx, newIdx);
    setCategories(reordered);
    void fetch('/api/mytodo/categories/order', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: reordered.map((c) => c.id) }),
    });
  }

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

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) {
      if (t.category_id) counts[t.category_id] = (counts[t.category_id] ?? 0) + 1;
    }
    return counts;
  }, [tasks]);

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
              <div className="todo-sidebar__label-row">
                <span className="todo-sidebar__label">Categories</span>
                {categories.length > 1 && (
                  <button
                    className={`sidebar-edit-btn${sidebarEditMode ? ' sidebar-edit-btn--active' : ''}`}
                    onClick={() => setSidebarEditMode((e) => !e)}
                  >
                    {sidebarEditMode ? 'Done' : 'Edit'}
                  </button>
                )}
              </div>

              {!sidebarEditMode && (
                <button
                  className={`sidebar-cat-btn${selectedCategoryId === null ? ' sidebar-cat-btn--active' : ''}`}
                  onClick={() => setSelectedCategoryId(null)}
                >
                  <span className="sidebar-cat-dot" />
                  <span className="sidebar-cat-name">All</span>
                  <span className="sidebar-cat-count">{tasks.length}</span>
                </button>
              )}

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
                <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  {categories.map((cat) => (
                    <SortableCatBtn
                      key={cat.id}
                      cat={cat}
                      isActive={selectedCategoryId === cat.id}
                      editMode={sidebarEditMode}
                      count={categoryCounts[cat.id] ?? 0}
                      onSelect={() => setSelectedCategoryId((prev) => prev === cat.id ? null : cat.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          )}
        </aside>

        {/* ── Main content ── */}
        <div className="todo-main">
          {showCalendar ? (
            <CalendarView
              tasks={visibleTasks}
              categories={categories}
              onBack={() => setShowCalendar(false)}
            />
          ) : (
            <>
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
                <button
                  className="todo-tab-calendar-btn"
                  onClick={() => setShowCalendar(true)}
                  aria-label="Calendar view"
                  title="Calendar view"
                >
                  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
                    <rect x="1.5" y="3" width="14" height="12.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M1.5 7h14" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5 1.5v3M12 1.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="5.5" cy="10.5" r=".85" fill="currentColor" />
                    <circle cx="8.5" cy="10.5" r=".85" fill="currentColor" />
                    <circle cx="11.5" cy="10.5" r=".85" fill="currentColor" />
                    <circle cx="5.5" cy="13.5" r=".85" fill="currentColor" />
                    <circle cx="8.5" cy="13.5" r=".85" fill="currentColor" />
                  </svg>
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
            </>
          )}
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
