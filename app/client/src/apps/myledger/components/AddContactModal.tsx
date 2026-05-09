import { useState } from 'react';
import type { Category, ContactWithNotes } from '@shared/types/myledger';
import { LEDGER_OTHER_CATEGORY_ID } from '@shared/constants';

interface Props {
  categories: Category[];
  editing?: ContactWithNotes | null;
  onClose: () => void;
  onSuccess: () => void;
}

type CategoryRow = { id: string; status: 'actual' | 'potential' };

export default function AddContactModal({ categories, editing, onClose, onSuccess }: Props) {
  const [name, setName] = useState(editing?.name ?? '');
  const [role, setRole] = useState(editing?.role ?? '');
  const [company, setCompany] = useState(editing?.company ?? '');
  const [whereMet, setWhereMet] = useState(editing?.where_met ?? '');
  const [linkedin, setLinkedin] = useState(editing?.linkedin ?? '');
  const [email, setEmail] = useState(editing?.email ?? '');
  const [phone, setPhone] = useState(editing?.phone ?? '');
  const [rows, setRows] = useState<CategoryRow[]>(
    editing?.categories.length ? editing.categories : [{ id: LEDGER_OTHER_CATEGORY_ID, status: 'actual' }]
  );
  const [notes, setNotes] = useState(editing?.notes.map((n) => n.body).join('\n') ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function addRow() {
    setRows((prev) => [...prev, { id: '', status: 'actual' }]);
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateId(idx: number, id: string) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, id } : r)));
  }

  function updateStatus(idx: number, status: 'actual' | 'potential') {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, status } : r)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const selected = rows.filter((r) => r.id);
    if (!name.trim() || selected.length === 0) {
      setError('Name and at least one category are required.');
      return;
    }
    setSaving(true);

    const payload = {
      name: name.trim(),
      role: role.trim() || undefined,
      company: company.trim() || undefined,
      where_met: whereMet.trim() || undefined,
      linkedin: linkedin.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      categories: selected,
      notes: notes.split('\n').filter((l) => l.trim()),
    };

    const url = editing ? `/api/myledger/contacts/${editing.id}` : '/api/myledger/contacts';
    const method = editing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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

  const sortedCategories = [...categories].sort((a, b) => {
    if (a.name === 'Other') return 1;
    if (b.name === 'Other') return -1;
    return 0;
  });

  const takenIds = new Set(rows.map((r) => r.id).filter(Boolean));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <dialog className="modal modal--wide" open onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{editing ? 'Edit Contact' : 'Add Contact'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="modal-grid">
            <label className="modal-label">
              Name *
              <input className="modal-input" type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
            </label>
            <label className="modal-label">
              Role
              <input className="modal-input" type="text" value={role} onChange={(e) => setRole(e.target.value)} />
            </label>
            <label className="modal-label">
              Company
              <input className="modal-input" type="text" value={company} onChange={(e) => setCompany(e.target.value)} />
            </label>
            <label className="modal-label">
              Where met
              <input className="modal-input" type="text" value={whereMet} onChange={(e) => setWhereMet(e.target.value)} />
            </label>
            <label className="modal-label">
              LinkedIn
              <input className="modal-input" type="text" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="linkedin.com/in/…" />
            </label>
            <label className="modal-label">
              Email
              <input className="modal-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="modal-label">
              Phone
              <input className="modal-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
          </div>

          <div className="cat-field">
            <span className="cat-field__title">Categories *</span>
            <div className="cat-rows">
              {rows.map((row, idx) => {
                const availableOptions = sortedCategories.filter(
                  (c) => c.id === row.id || !takenIds.has(c.id)
                );
                return (
                  <div key={idx} className="cat-row">
                    <select
                      className="modal-input cat-row__select"
                      value={row.id}
                      onChange={(e) => updateId(idx, e.target.value)}
                    >
                      <option value="">Select category…</option>
                      {availableOptions.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>

                    {row.id && (
                      <label className="cat-row__potential">
                        <input
                          type="checkbox"
                          checked={row.status === 'potential'}
                          onChange={(e) => updateStatus(idx, e.target.checked ? 'potential' : 'actual')}
                        />
                        Potential
                      </label>
                    )}

                    {rows.length > 1 && (
                      <button
                        type="button"
                        className="cat-row__remove"
                        onClick={() => removeRow(idx)}
                        aria-label="Remove category"
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {rows.length < sortedCategories.length && (
              <button type="button" className="cat-add-btn" onClick={addRow}>
                + Add another category
              </button>
            )}
          </div>

          <label className="modal-label modal-label--full" style={{ marginTop: '.75rem' }}>
            Notes (one bullet per line)
            <textarea
              className="modal-input modal-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Each line becomes a bullet point"
            />
          </label>
          {error && <p className="modal-error">{error}</p>}
          <div className="modal-footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add contact'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
