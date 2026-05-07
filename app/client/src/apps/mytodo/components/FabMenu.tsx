import { useState } from 'react';

interface Props {
  onAddCategory: () => void;
  onAddTask: () => void;
}

export default function FabMenu({ onAddCategory, onAddTask }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="todo-fab-container">
      {open && (
        <>
          <button
            className="todo-fab-option"
            onClick={() => { setOpen(false); onAddCategory(); }}
          >
            + Category
          </button>
          <button
            className="todo-fab-option"
            onClick={() => { setOpen(false); onAddTask(); }}
          >
            + Task
          </button>
        </>
      )}
      <button
        className={`todo-fab${open ? ' todo-fab--open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Add"
      >
        {open ? '✕' : '+'}
      </button>
    </div>
  );
}
