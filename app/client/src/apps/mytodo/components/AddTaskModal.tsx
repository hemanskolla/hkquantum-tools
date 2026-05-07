import { useState } from 'react';
import type { TodoCategory, Task } from '@shared/types/mytodo';

interface Props {
  categories: TodoCategory[];
  editing: Task | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTaskModal({ categories, editing, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState(editing?.title ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [categoryId, setCategoryId] = useState(editing?.category_id ?? '');
  const [urgent, setUrgent] = useState(editing?.urgent ?? false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);

    const body = {
      title: title.trim(),
      description: description.trim() || null,
      category_id: categoryId || null,
      urgent,
    };

    const url = editing ? `/api/mytodo/tasks/${editing.id}` : '/api/mytodo/tasks';
    const method = editing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      onSuccess();
      onClose();
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? 'Failed to save');
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <dialog className="modal modal--wide" open onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{editing ? 'Edit Task' : 'Add Task'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label className="modal-label">
            Title
            <input
              className="modal-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </label>

          <label className="modal-label">
            Description
            <textarea
              className="modal-input modal-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details…"
            />
          </label>

          <label className="modal-label">
            Category
            <select
              className="modal-input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">— none —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>

          <label className="modal-checkbox-row">
            <input
              type="checkbox"
              checked={urgent}
              onChange={(e) => setUrgent(e.target.checked)}
            />
            Mark as urgent (pins to top)
          </label>

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save' : 'Add'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
