// Pestaña "Progreso": objetivo semanal, calendario, récords por ejercicio y compañeros.
import React, { useState } from 'react';
import {
  Flame, Minus, Plus, MessageCircle, Trophy, ChevronDown, ChevronUp, Users, Copy, Share2, X, UserPlus, Loader2,
  CalendarDays, Target, RefreshCw,
} from 'lucide-react';
import { tr, trn, getLang } from '../i18n';
import { WEEKDAY_INITIALS, translateExerciseName } from '../i18n-content';
import { daysAgoLabel } from '../lib/dates';
import { progressSeries, bestsOf, formatSet, formatKg } from '../lib/lifts';
import ProgressChart from './ProgressChart';
import HistoryCalendar from './HistoryCalendar';

// ---------- Objetivo semanal ----------

function GoalRing({ count, goal }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, goal ? count / goal : 0);
  return (
    <svg className="pg-ring" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#2A2B2F" strokeWidth="9" />
      <circle
        cx="50" cy="50" r={r} fill="none" stroke="#C24747" strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 50 50)"
      />
      <text x="50" y="57" textAnchor="middle" className="pg-ring-text">{count}/{goal}</text>
    </svg>
  );
}

export function WeekDots({ dates, compact }) {
  const initials = WEEKDAY_INITIALS[getLang()];
  return (
    <div className={`pg-weekdays ${compact ? 'is-compact' : ''}`}>
      {dates.map((d, i) => (
        <span key={d.date} className={`pg-weekday ${d.trained ? 'is-trained' : ''} ${d.today ? 'is-today' : ''} ${d.future ? 'is-future' : ''}`}>
          {!compact && <span className="pg-weekday-letter">{initials[i]}</span>}
          <span className="pg-weekday-dot" />
        </span>
      ))}
    </div>
  );
}

export function WeeklyGoalCard({ stats, onGoalChange, onAskJoe }) {
  const { goal, thisWeekCount, remaining, streak, weeks } = stats;
  let message;
  if (thisWeekCount >= goal) message = tr('weekGoalMet');
  else if (goal >= 2 && remaining === 1) message = tr('weekGoalAlmost');
  else message = goal >= 2 ? trn('weekGoalRemaining', remaining, { min: goal - 1 }) : trn('weekGoalRemainingSimple', remaining);

  return (
    <section className="pg-card pg-week">
      <div className="pg-week-top">
        <GoalRing count={thisWeekCount} goal={goal} />
        <div className="pg-week-text">
          <h2 className="pg-title">{tr('thisWeek')}</h2>
          <p className="pg-sub">{message}</p>
          <WeekDots dates={stats.thisWeekDates} />
        </div>
      </div>
      <div className="pg-weeks-row">
        <div className="pg-streak">
          <Flame size={16} />
          <span>{streak > 0 ? trn('weeksInARow', streak) : tr('noStreakYet')}</span>
        </div>
        <div className="pg-weeks" aria-label={tr('lastWeeks')}>
          {weeks.map((w) => (
            <span key={w.week} className={`pg-wk is-${w.status}`} title={`${w.count}/${goal}`} />
          ))}
        </div>
      </div>
      <p className="pg-legend">{tr('weeksLegend')}</p>
      <div className="pg-goal-edit">
        <span><Target size={14} /> {tr('weeklyGoal')}</span>
        <div className="pg-stepper">
          <button type="button" onClick={() => onGoalChange(Math.max(1, goal - 1))} disabled={goal <= 1} aria-label={tr('goalLess')}><Minus size={14} /></button>
          <span>{trn('timesPerWeek', goal)}</span>
          <button type="button" onClick={() => onGoalChange(Math.min(7, goal + 1))} disabled={goal >= 7} aria-label={tr('goalMore')}><Plus size={14} /></button>
        </div>
      </div>
      {onAskJoe && (
        <button type="button" className="pg-joe-btn" onClick={onAskJoe}>
          <MessageCircle size={15} /> {tr('askWeeklySummary')}
        </button>
      )}
    </section>
  );
}

// ---------- Récords ----------

function RecordsList({ lifts }) {
  const [open, setOpen] = useState(null);
  const lang = getLang();
  const items = Object.entries(lifts || {})
    .map(([key, entries]) => {
      const series = progressSeries(entries);
      if (!series.length) return null;
      const latest = entries.reduce((a, b) => (b.ts > a.ts ? b : a));
      const first = series[0];
      const last = series[series.length - 1];
      return { key, name: translateExerciseName(latest.name, lang), series, bests: bestsOf(entries), first, last, ts: latest.ts };
    })
    .filter(Boolean)
    .sort((a, b) => b.ts - a.ts);

  if (!items.length) return <p className="pg-empty">{tr('noRecordsYet')}</p>;

  return (
    <ul className="pg-records">
      {items.map((it) => {
        const isOpen = open === it.key;
        const bodyweight = it.series.every((p) => p.bodyweight);
        const diff = it.last.value - it.first.value;
        const best = it.bests.maxKg ? formatSet(it.bests.maxKg) : it.bests.maxReps ? formatSet({ reps: it.bests.maxReps.reps }) : '—';
        return (
          <li key={it.key} className={`pg-record ${isOpen ? 'is-open' : ''}`}>
            <button type="button" className="pg-record-main" onClick={() => setOpen(isOpen ? null : it.key)} aria-expanded={isOpen}>
              <span className="pg-record-name">{it.name}</span>
              <span className="pg-record-best"><Trophy size={12} /> {best}</span>
              {it.series.length > 1 && diff !== 0 && (
                <span className={`pg-record-diff ${diff > 0 ? 'is-up' : 'is-down'}`}>
                  {diff > 0 ? '+' : '−'}{formatKg(Math.abs(diff))}{bodyweight ? '' : ' kg'}
                </span>
              )}
              {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            {isOpen && (
              <div className="pg-record-chart">
                <ProgressChart series={it.series} unit={bodyweight ? 'reps' : 'kg'} ariaLabel={tr('chartAria', { name: it.name })} />
                <p className="pg-record-meta">{trn('sessionsCount', it.series.length)}</p>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ---------- Compañeros ----------

const prettyBuddyCode = (code) => (code && code.length === 6 ? `${code.slice(0, 3)}-${code.slice(3)}` : code || '');

function BuddyCard({ buddy, info, onRemove }) {
  const [confirm, setConfirm] = useState(false);
  const s = info && info.summary;
  return (
    <li className="pg-buddy">
      <div className="pg-buddy-head">
        <span className="pg-buddy-name">{(s && s.name) || buddy.name || tr('buddyNoName')}</span>
        {confirm ? (
          <span className="pg-buddy-confirm">
            <button type="button" className="history-delete-yes" onClick={onRemove}>{tr('deleteShort')}</button>
            <button type="button" className="history-delete-no" onClick={() => setConfirm(false)}>{tr('cancel')}</button>
          </span>
        ) : (
          <button type="button" className="icon-btn" onClick={() => setConfirm(true)} aria-label={tr('removeBuddy')}><X size={15} /></button>
        )}
      </div>
      {!info && <span className="pg-buddy-status"><Loader2 size={13} className="spin" /> {tr('loadingShort')}</span>}
      {info && info.error && <span className="pg-buddy-status">{info.error === 'notfound' ? tr('buddyNotFound') : tr('buddyError')}</span>}
      {s && (
        <>
          <span className="pg-buddy-status">
            {tr('buddyWeek', { n: s.weekCount, goal: s.goal })}
            {s.lastDate ? ` · ${tr('buddyLast', { when: daysAgoLabel(s.lastDate) })}` : ''}
          </span>
          <div className="pg-buddy-row">
            <WeekDots dates={s.weekDates || []} compact />
            {s.streak > 0 && <span className="pg-buddy-streak"><Flame size={13} /> {s.streak}</span>}
          </div>
        </>
      )}
    </li>
  );
}

function BuddiesSection({ share, syncCode, syncBusy, buddies, buddyInfo, onEnableShare, onDisableShare, onGenerateSync, onAddBuddy, onRemoveBuddy, onShareCode, onRefresh }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const add = async () => {
    const code = input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (code.length !== 6) { setError(tr('buddyCodeInvalid')); return; }
    setBusy(true);
    setError('');
    const res = await onAddBuddy(code);
    setBusy(false);
    if (res === 'ok') setInput('');
    else setError(res === 'notfound' ? tr('buddyNotFound') : res === 'self' ? tr('buddyIsYou') : res === 'dup' ? tr('buddyDuplicate') : tr('buddyError'));
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prettyBuddyCode(share.code));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) { /* noop */ }
  };

  return (
    <section className="pg-card">
      <div className="pg-section-head">
        <h2 className="pg-title"><Users size={17} /> {tr('buddiesTitle')}</h2>
        {buddies.length > 0 && (
          <button type="button" className="icon-btn" onClick={onRefresh} aria-label={tr('refresh')}><RefreshCw size={15} /></button>
        )}
      </div>
      <p className="pg-sub">{tr('buddiesIntro')}</p>

      <div className="pg-myshare">
        {!syncCode ? (
          <>
            <p className="pg-note">{tr('buddyNeedsSync')}</p>
            <button type="button" className="pg-btn" onClick={onGenerateSync} disabled={syncBusy}>
              {syncBusy ? tr('generating') : tr('generateCode')}
            </button>
          </>
        ) : !share.enabled ? (
          <button type="button" className="pg-btn" onClick={onEnableShare} disabled={syncBusy}>
            <Share2 size={14} /> {tr('buddyEnable')}
          </button>
        ) : (
          <div className="pg-mycode">
            <span className="pg-mycode-label">{tr('buddyYourCode')}</span>
            <span className="pg-mycode-value">{share.code ? prettyBuddyCode(share.code) : '…'}</span>
            <div className="pg-mycode-actions">
              <button type="button" className="pg-btn pg-btn-ghost" onClick={copy} disabled={!share.code}><Copy size={13} /> {copied ? tr('copied') : tr('copy')}</button>
              <button type="button" className="pg-btn pg-btn-ghost" onClick={() => onShareCode(prettyBuddyCode(share.code))} disabled={!share.code}><Share2 size={13} /> {tr('send')}</button>
              <button type="button" className="pg-link" onClick={onDisableShare}>{tr('buddyDisable')}</button>
            </div>
            {share.error && <p className="pg-error">{tr('buddyPublishError')}</p>}
          </div>
        )}
      </div>

      {buddies.length > 0 && (
        <ul className="pg-buddies">
          {buddies.map((b) => (
            <BuddyCard key={b.code} buddy={b} info={buddyInfo[b.code]} onRemove={() => onRemoveBuddy(b.code)} />
          ))}
        </ul>
      )}

      <div className="pg-addbuddy">
        <input
          value={input}
          onChange={(e) => { setInput(e.target.value.toUpperCase()); setError(''); }}
          placeholder={tr('buddyCodePlaceholder')}
          maxLength={8}
          autoCapitalize="characters"
        />
        <button type="button" className="pg-btn" onClick={add} disabled={busy || !input.trim()}>
          {busy ? <Loader2 size={14} className="spin" /> : <UserPlus size={14} />} {tr('add')}
        </button>
      </div>
      {error && <p className="pg-error">{error}</p>}
    </section>
  );
}

// ---------- Pestaña ----------

export default function ProgressTab({
  stats, history, lifts, onGoalChange, onAskJoe, onDeleteEntry, onShareEntry, buddyProps,
}) {
  return (
    <div className="progress-screen">
      <h1 className="tab-title">{tr('progressTitle')}</h1>
      <p className="tab-subtitle">{tr('progressSubtitle')}</p>

      <WeeklyGoalCard stats={stats} onGoalChange={onGoalChange} onAskJoe={onAskJoe} />

      <section className="pg-card pg-card-flat" id="historial">
        <h2 className="pg-title"><CalendarDays size={17} /> {tr('historyTitle')}</h2>
        <p className="pg-sub">{tr('historySubtitle')}</p>
        <HistoryCalendar history={history} onDelete={onDeleteEntry} onShare={onShareEntry} />
      </section>

      <section className="pg-card">
        <h2 className="pg-title"><Trophy size={17} /> {tr('recordsTitle')}</h2>
        <p className="pg-sub">{tr('recordsIntro')}</p>
        <RecordsList lifts={lifts} />
      </section>

      <BuddiesSection {...buddyProps} />
    </div>
  );
}
