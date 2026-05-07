import { useState } from 'react';
import type { Task, TodoCategory } from '@shared/types/mytodo';

interface CalendarViewProps {
  tasks: Task[];
  categories: TodoCategory[];
  onBack: () => void;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarView({ tasks, categories, onBack }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showTbd, setShowTbd] = useState(false);

  const timeSensitiveTasks = tasks.filter((t) => t.time_sensitive && t.due_date);
  const tbdTasks = tasks.filter((t) => t.time_sensitive && !t.due_date);

  function tasksByDay(day: number): Task[] {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return timeSensitiveTasks.filter((t) => t.due_date && t.due_date.startsWith(dateStr));
  }

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
    setSelectedDay(null);
  }

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedTasks = selectedDay !== null ? tasksByDay(selectedDay) : [];

  function getCategoryName(catId: string | null) {
    if (!catId) return null;
    return categories.find((c) => c.id === catId)?.name ?? null;
  }

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const isPast = (day: number) => {
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return d < t;
  };

  return (
    <div className="cal-view">
      <div className="cal-header">
        <button className="cal-back-btn" onClick={onBack} aria-label="Back to tasks">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>

        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={prevMonth} aria-label="Previous month">&#8249;</button>
          <span className="cal-month-label">{MONTH_NAMES[month]} {year}</span>
          <button className="cal-nav-btn" onClick={nextMonth} aria-label="Next month">&#8250;</button>
        </div>
      </div>

      <div className="todo-completed-banner cal-banner">
        Only <strong>time-sensitive tasks</strong> are shown here. Tasks with no due date appear in the <strong>TBD</strong> box below.
      </div>

      <div className="cal-grid-wrap">
        <div className="cal-grid">
          {DAY_LABELS.map((d) => (
            <div key={d} className="cal-day-label">{d}</div>
          ))}

          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="cal-cell cal-cell--empty" />;
            }
            const dayTasks = tasksByDay(day);
            const hasTask = dayTasks.length > 0;
            const past = isPast(day);
            const classes = [
              'cal-cell',
              isToday(day) ? 'cal-cell--today' : '',
              past && !isToday(day) ? 'cal-cell--past' : '',
              hasTask ? 'cal-cell--has-task' : '',
              selectedDay === day ? 'cal-cell--selected' : '',
            ].filter(Boolean).join(' ');

            return (
              <button
                key={day}
                className={classes}
                onClick={() => setSelectedDay((prev) => (prev === day ? null : day))}
                aria-label={`${MONTH_NAMES[month]} ${day}${hasTask ? `, ${dayTasks.length} task${dayTasks.length > 1 ? 's' : ''}` : ''}`}
              >
                <span className="cal-day-num">{day}</span>
                {hasTask && (
                  <span className="cal-dot-row">
                    {dayTasks.slice(0, 3).map((t) => (
                      <span key={t.id} className="cal-dot" />
                    ))}
                    {dayTasks.length > 3 && <span className="cal-dot-more">+{dayTasks.length - 3}</span>}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay !== null && (
        <div className="cal-detail">
          <div className="cal-detail-header">
            {MONTH_NAMES[month]} {selectedDay}, {year}
          </div>
          {selectedTasks.length === 0 ? (
            <p className="cal-detail-empty">No time-sensitive tasks on this day.</p>
          ) : (
            <ul className="cal-detail-list">
              {selectedTasks.map((task) => {
                const catName = getCategoryName(task.category_id);
                return (
                  <li key={task.id} className="cal-detail-item">
                    <span className="cal-detail-dot" />
                    <div className="cal-detail-body">
                      <span className="cal-detail-title">{task.title}</span>
                      {task.description && (
                        <span className="cal-detail-desc">{task.description}</span>
                      )}
                      {catName && <span className="cal-detail-cat">{catName}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {tbdTasks.length > 0 && (
        <div className="cal-tbd-wrap">
          <button
            className={`cal-tbd-btn${showTbd ? ' cal-tbd-btn--active' : ''}`}
            onClick={() => setShowTbd((v) => !v)}
            aria-expanded={showTbd}
          >
            <span className="cal-tbd-label">TBD</span>
            <span className="cal-tbd-count">{tbdTasks.length}</span>
            <span className="cal-tbd-desc">time-sensitive task{tbdTasks.length !== 1 ? 's' : ''} with no due date</span>
            <span className="cal-tbd-chevron">{showTbd ? '▲' : '▼'}</span>
          </button>
          {showTbd && (
            <div className="cal-detail">
              <div className="cal-detail-header">Time-Sensitive — Due Date TBD</div>
              <ul className="cal-detail-list">
                {tbdTasks.map((task) => {
                  const catName = getCategoryName(task.category_id);
                  return (
                    <li key={task.id} className="cal-detail-item">
                      <span className="cal-detail-dot cal-detail-dot--tbd" />
                      <div className="cal-detail-body">
                        <span className="cal-detail-title">{task.title}</span>
                        {task.description && (
                          <span className="cal-detail-desc">{task.description}</span>
                        )}
                        {catName && <span className="cal-detail-cat">{catName}</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {timeSensitiveTasks.length === 0 && tbdTasks.length === 0 && (
        <div className="todo-empty">No time-sensitive tasks to display.</div>
      )}
    </div>
  );
}
