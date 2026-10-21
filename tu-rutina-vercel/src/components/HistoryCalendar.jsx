// Calendario mensual con los entrenamientos registrados y el detalle de cada día.
import React, { useState } from 'react';
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Clock, Check, X, Trash2, Share2, Plus, PenLine,
} from 'lucide-react';
import { tr, trn, getLang } from '../i18n';
import { WEEKDAY_INITIALS, weekdayLabel } from '../i18n-content';
import {
  pad2, localDateKey, formatClock, workoutDurationMs, formatDuration, monthName, formatLongDate,
} from '../lib/dates';
import { formatSet } from '../lib/lifts';

// Los registros viejos guardaban solo nombres; los nuevos guardan { name, done, sets }.
export const entryExercises = (entry) => (entry.exercises || []).map((e) => (typeof e === 'string' ? { name: e, done: true } : e));

export default function HistoryCalendar({ history, onDelete, onShare, onLogManual }) {
  const todayKey = localDateKey(Date.now());
  const byDate = {};
  history.forEach((h) => { (byDate[h.date] = byDate[h.date] || []).push(h); });
  Object.values(byDate).forEach((list) => list.sort((a, b) => a.completedAt - b.completedAt));
  const latestKey = history.reduce((acc, h) => (h.date > acc ? h.date : acc), '');

  const [selected, setSelected] = useState(byDate[todayKey] || !latestKey ? todayKey : latestKey);
  const [month, setMonth] = useState(() => {
    const [y, m] = selected.split('-').map(Number);
    return { y, m: m - 1 };
  });
  const [openEntry, setOpenEntry] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const monthPrefix = `${month.y}-${pad2(month.m + 1)}`;
  const monthEntries = history.filter((h) => h.date.startsWith(monthPrefix));
  const monthMs = monthEntries.reduce((sum, h) => sum + (workoutDurationMs(h) || 0), 0);
  const leadingBlanks = (new Date(month.y, month.m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const isCurrentMonth = monthPrefix === todayKey.slice(0, 7);

  const shiftMonth = (delta) => {
    setMonth(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  const selectedEntries = byDate[selected] || [];

  return (
    <div className="history-block">
      <div className="history-stats">
        <div className="history-stat">
          <span className="history-stat-value">{monthEntries.length}</span>
          <span className="history-stat-label">{trn('statWorkouts', monthEntries.length, { month: monthName(month.m) })}</span>
        </div>
        <div className="history-stat">
          <span className="history-stat-value">{monthMs ? formatDuration(monthMs) : '—'}</span>
          <span className="history-stat-label">{tr('statTime', { month: monthName(month.m) })}</span>
        </div>
      </div>

      <div className="history-calendar">
        <div className="history-month-nav">
          <button type="button" className="icon-btn" onClick={() => shiftMonth(-1)} aria-label={tr('prevMonth')}>
            <ChevronLeft size={18} />
          </button>
          <span className="history-month-name">{monthName(month.m)} {month.y}</span>
          <button type="button" className="icon-btn" onClick={() => shiftMonth(1)} disabled={isCurrentMonth} aria-label={tr('nextMonth')}>
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="history-grid">
          {WEEKDAY_INITIALS[getLang()].map((w, i) => <span key={`h${i}`} className="history-grid-head">{w}</span>)}
          {Array.from({ length: leadingBlanks }).map((_, i) => <span key={`b${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const key = `${monthPrefix}-${pad2(i + 1)}`;
            const entries = byDate[key] || [];
            const isFuture = key > todayKey;
            const classes = [
              'history-day',
              entries.length ? 'has-workout' : '',
              key === todayKey ? 'is-today' : '',
              key === selected ? 'is-selected' : '',
              isFuture ? 'is-future' : '',
            ].filter(Boolean).join(' ');
            return (
              <button
                type="button"
                key={key}
                className={classes}
                disabled={isFuture}
                onClick={() => { setSelected(key); setOpenEntry(null); setPendingDelete(null); }}
                style={entries.length ? { '--workout-color': entries[0].color } : undefined}
                aria-label={`${i + 1} ${monthName(month.m)}${entries.length ? `, ${tr('workoutsAria', { n: entries.length })}` : ''}`}
              >
                <span className="history-day-num">{i + 1}</span>
                {entries.length > 0 && (
                  <span className="history-day-dots">
                    {entries.slice(0, 3).map((h) => <span key={h.id} style={{ background: h.color }} />)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="history-day-detail">
        <h3 className="history-day-title">{formatLongDate(selected)}</h3>
        {selectedEntries.length === 0 && (
          <p className="history-empty">
            {history.length === 0 ? tr('historyEmptyAll') : tr('historyEmptyDay')}
          </p>
        )}
        {selectedEntries.map((h) => {
          const duration = workoutDurationMs(h);
          const isOpen = openEntry === h.id;
          const exercises = entryExercises(h);
          const doneCount = h.doneCount != null ? h.doneCount : exercises.filter((e) => e.done).length;
          const totalCount = h.totalCount != null ? h.totalCount : exercises.length;
          const isFull = totalCount > 0 && doneCount >= totalCount;
          return (
            <div key={h.id} className="history-entry" style={{ '--workout-color': h.color }}>
              <div className="history-entry-head">
                <div className="history-entry-names">
                  <span className="history-entry-label">{h.label}</span>
                  <span className="history-entry-routine">{tr('dayOfRoutine', { routine: h.variantName, weekday: weekdayLabel(h.weekday, getLang()) })}</span>
                </div>
                {pendingDelete === h.id ? (
                  <div className="history-delete-confirm">
                    <button type="button" className="history-delete-yes" onClick={() => { onDelete(h.id); setPendingDelete(null); }}>{tr('deleteShort')}</button>
                    <button type="button" className="history-delete-no" onClick={() => setPendingDelete(null)}>{tr('cancel')}</button>
                  </div>
                ) : (
                  <div className="history-entry-actions">
                    {onShare && (
                      <button type="button" className="icon-btn" onClick={() => onShare(h)} aria-label={tr('shareStory')}>
                        <Share2 size={15} />
                      </button>
                    )}
                    <button type="button" className="icon-btn" onClick={() => setPendingDelete(h.id)} aria-label={tr('deleteEntry')}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
              <div className="history-entry-time">
                <Clock size={13} />
                {h.manual ? (
                  <span>{duration ? <strong>≈ {formatDuration(duration)}</strong> : tr('manualNoTime')}</span>
                ) : duration
                  ? <span>{formatClock(h.startedAt)} → {formatClock(h.completedAt)} · <strong>{formatDuration(duration)}</strong></span>
                  : <span>{tr('lastCheckAt', { time: formatClock(h.completedAt) })}</span>}
                {h.manual && <span className="history-manual-tag"><PenLine size={11} /> {tr('manualTag')}</span>}
              </div>
              {totalCount > 0 && (
                <div className={`history-entry-progress ${isFull ? 'is-full' : ''}`}>
                  <span className="history-entry-progress-bar">
                    <span style={{ width: `${Math.round((doneCount / totalCount) * 100)}%` }} />
                  </span>
                  <span>{isFull ? tr('historyComplete', { n: totalCount }) : tr('historyPartial', { done: doneCount, total: totalCount })}</span>
                </div>
              )}
              {exercises.length > 0 && (
                <>
                  <button type="button" className="history-entry-toggle" onClick={() => setOpenEntry(isOpen ? null : h.id)}>
                    {isOpen ? tr('hideExercises') : tr('showExercises')}
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {isOpen && (
                    <ul className="history-entry-exercises">
                      {exercises.map((e, i) => (
                        <li key={i} className={e.done ? '' : 'not-done'}>
                          {e.done ? <Check size={12} /> : <X size={12} />}
                          <span className="history-ex-name">{e.name}</span>
                          {e.sets && e.sets.length > 0 && (
                            <span className="history-ex-sets">{e.sets.map((s) => formatSet(s)).join(' · ')}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          );
        })}
        {/* Entrenaste sin el teléfono: se carga a mano para ese día. */}
        {onLogManual && selected <= todayKey && (
          <button type="button" className={`history-manual-btn ${selectedEntries.length ? 'is-secondary' : ''}`} onClick={() => onLogManual(selected)}>
            <Plus size={15} /> {selectedEntries.length ? tr('manualLogAnother') : tr('manualLogBtn')}
          </button>
        )}
      </div>
    </div>
  );
}
