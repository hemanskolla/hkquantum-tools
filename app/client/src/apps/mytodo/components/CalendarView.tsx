import { useState } from 'react';
import type { Task, TodoCategory } from '@shared/types/mytodo';

interface CalendarViewProps {
  tasks: Task[];
  categories: TodoCategory[];
  onBack: () => void;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LABELS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function startOfWeek(d: Date): Date {
  const result = new Date(d);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - result.getDay());
  return result;
}

export default function CalendarView({ tasks, categories, onBack }: CalendarViewProps) {
  const today = new Date();
  const [calMode, setCalMode] = useState<'month' | 'week'>('month');

  // Month view state
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Week view state — track the Sunday that starts the visible week
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(today));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [showTbd, setShowTbd] = useState(false);

  const timeSensitiveTasks = tasks.filter((t) => t.time_sensitive && t.due_date);
  const tbdTasks = tasks.filter((t) => t.time_sensitive && !t.due_date);

  function getCategoryName(catId: string | null) {
    if (!catId) return null;
    return categories.find((c) => c.id === catId)?.name ?? null;
  }

  // ── Month helpers ──────────────────────────────────────────────
  function tasksByDay(d: number, y = year, m = month): Task[] {
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
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

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const isPast = (day: number) => {
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return d < t;
  };

  const firstDayOfWeekOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeekOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedTasks = selectedDay !== null ? tasksByDay(selectedDay) : [];

  // ── Week helpers ───────────────────────────────────────────────
  function weekDays(ws: Date): Date[] {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ws);
      d.setDate(ws.getDate() + i);
      return d;
    });
  }

  function tasksByDate(d: Date): Task[] {
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return timeSensitiveTasks.filter((t) => t.due_date && t.due_date.startsWith(dateStr));
  }

  function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function isPastDate(d: Date) {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    const dc = new Date(d); dc.setHours(0, 0, 0, 0);
    return dc < t;
  }

  function prevWeek() {
    setWeekStart((ws) => { const d = new Date(ws); d.setDate(d.getDate() - 7); return d; });
    setSelectedDate(null);
  }

  function nextWeek() {
    setWeekStart((ws) => { const d = new Date(ws); d.setDate(d.getDate() + 7); return d; });
    setSelectedDate(null);
  }

  function weekNavLabel(ws: Date): string {
    const days = weekDays(ws);
    const start = days[0];
    const end = days[6];
    if (start.getMonth() === end.getMonth()) {
      return `${MONTH_NAMES_SHORT[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
    }
    return `${MONTH_NAMES_SHORT[start.getMonth()]} ${start.getDate()} – ${MONTH_NAMES_SHORT[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  }

  const currentWeekDays = weekDays(weekStart);
  const selectedDateTasks = selectedDate ? tasksByDate(selectedDate) : [];

  function handleModeSwitch(mode: 'month' | 'week') {
    if (mode === calMode) return;
    if (mode === 'week') {
      // Center week view on selected day, or today
      const anchor = selectedDay !== null ? new Date(year, month, selectedDay) : today;
      setWeekStart(startOfWeek(anchor));
      setSelectedDate(null);
    } else {
      // Return month view to the month containing the selected week date, or today
      const anchor = selectedDate ?? today;
      setYear(anchor.getFullYear());
      setMonth(anchor.getMonth());
      setSelectedDay(null);
    }
    setCalMode(mode);
  }

  // ── Shared detail panel ────────────────────────────────────────
  function DetailPanel({ headerLabel, taskList }: { headerLabel: string; taskList: Task[] }) {
    return (
      <div className="cal-detail">
        <div className="cal-detail-header">{headerLabel}</div>
        {taskList.length === 0 ? (
          <p className="cal-detail-empty">No time-sensitive tasks on this day.</p>
        ) : (
          <ul className="cal-detail-list">
            {taskList.map((task) => {
              const catName = getCategoryName(task.category_id);
              return (
                <li key={task.id} className="cal-detail-item">
                  <span className="cal-detail-dot" />
                  <div className="cal-detail-body">
                    <span className="cal-detail-title">{task.title}</span>
                    {task.description && <span className="cal-detail-desc">{task.description}</span>}
                    {catName && <span className="cal-detail-cat">{catName}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

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
          <button
            className="cal-nav-btn"
            onClick={calMode === 'month' ? prevMonth : prevWeek}
            aria-label={calMode === 'month' ? 'Previous month' : 'Previous week'}
          >&#8249;</button>
          <span className="cal-month-label">
            {calMode === 'month' ? `${MONTH_NAMES[month]} ${year}` : weekNavLabel(weekStart)}
          </span>
          <button
            className="cal-nav-btn"
            onClick={calMode === 'month' ? nextMonth : nextWeek}
            aria-label={calMode === 'month' ? 'Next month' : 'Next week'}
          >&#8250;</button>
        </div>

        <div className="cal-mode-toggle" role="group" aria-label="Calendar view mode">
          <button
            className={`cal-mode-btn${calMode === 'month' ? ' cal-mode-btn--active' : ''}`}
            onClick={() => handleModeSwitch('month')}
            aria-pressed={calMode === 'month'}
          >Month</button>
          <button
            className={`cal-mode-btn${calMode === 'week' ? ' cal-mode-btn--active' : ''}`}
            onClick={() => handleModeSwitch('week')}
            aria-pressed={calMode === 'week'}
          >Week</button>
        </div>
      </div>

      <div className="todo-completed-banner cal-banner">
        Only <strong>time-sensitive tasks</strong> are shown here. Tasks with no due date appear in the <strong>TBD</strong> box below.
      </div>

      {calMode === 'month' ? (
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
      ) : (
        <div className="cal-week-grid-wrap">
          <div className="cal-week-grid">
            {currentWeekDays.map((day, idx) => {
              const dayTasks = tasksByDate(day);
              const todayDay = isSameDay(day, today);
              const past = isPastDate(day) && !todayDay;
              const selected = selectedDate !== null && isSameDay(day, selectedDate);
              const classes = [
                'cal-week-col',
                todayDay ? 'cal-week-col--today' : '',
                past ? 'cal-week-col--past' : '',
                selected ? 'cal-week-col--selected' : '',
              ].filter(Boolean).join(' ');

              return (
                <button
                  key={idx}
                  className={classes}
                  onClick={() => setSelectedDate((prev) => (prev && isSameDay(prev, day) ? null : day))}
                  aria-label={`${DAY_LABELS[day.getDay()]} ${MONTH_NAMES[day.getMonth()]} ${day.getDate()}${dayTasks.length > 0 ? `, ${dayTasks.length} task${dayTasks.length > 1 ? 's' : ''}` : ''}`}
                  aria-pressed={selected}
                >
                  <div className="cal-week-col-header">
                    <span className="cal-week-day-letter">{DAY_LABELS_SHORT[day.getDay()]}</span>
                    <span className="cal-week-day-num">{day.getDate()}</span>
                  </div>
                  <div className="cal-week-col-tasks">
                    {dayTasks.length === 0 ? (
                      <span className="cal-week-no-tasks">—</span>
                    ) : (
                      <>
                        {dayTasks.slice(0, 2).map((t) => (
                          <span key={t.id} className="cal-week-task-pill">{t.title}</span>
                        ))}
                        {dayTasks.length > 2 && (
                          <span className="cal-week-overflow">+{dayTasks.length - 2}</span>
                        )}
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {calMode === 'month' && selectedDay !== null && (
        <DetailPanel
          headerLabel={`${MONTH_NAMES[month]} ${selectedDay}, ${year}`}
          taskList={selectedTasks}
        />
      )}

      {calMode === 'week' && selectedDate !== null && (
        <DetailPanel
          headerLabel={`${DAY_LABELS[selectedDate.getDay()]}, ${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`}
          taskList={selectedDateTasks}
        />
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
