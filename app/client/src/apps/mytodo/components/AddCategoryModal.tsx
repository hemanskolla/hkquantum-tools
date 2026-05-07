import { useState } from 'react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddCategoryModal({ onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch('/api/mytodo/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
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
      <dialog className="modal" open onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Add Category</h2>
        <form onSubmit={handleSubmit}>
          <label className="modal-label">
            Name
            <input
              className="modal-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </label>
          {error && <p className="modal-error">{error}</p>}
          <div className="modal-footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving…' : 'Add'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
