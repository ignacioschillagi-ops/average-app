// Hoja que se abre al tocar un ejercicio de la rutina. Todo lo de ese ejercicio en un lugar:
//   - Series: anotar peso y reps por serie, con "la vez pasada" y atajos para repetir o subir.
//   - Progreso: gráfico y récords.
//   - Técnica: búsqueda en Google (web o videos) o preguntarle a Joe's.
//   - Cambiar: equivalentes si la máquina está ocupada o estás en casa, o uno escrito a mano.
// Anotar series es opcional: tildar el ejercicio desde la lista sigue funcionando igual.
// Se cierra con la X, tocando afuera o arrastrándola hacia abajo.
import React, { useEffect, useRef, useState } from 'react';
import {
  X, Check, Plus, Minus, Repeat, TrendingUp, BookOpen, ArrowLeftRight, ExternalLink,
  Trophy, Timer, MessageCircle, ListChecks, PlayCircle, PenLine,
} from 'lucide-react';
import { tr, getLang } from '../i18n';
import { translateExerciseName } from '../i18n-content';
import {
  planSets, currentLog, lastSession, recordFor, liftEntriesFor, progressSeries, bestsOf,
  formatSet, formatKg, parseNumber, firstNumber,
} from '../lib/lifts';
import { localDateKey, daysAgoLabel, formatShortDate } from '../lib/dates';
import { alternativesFor } from '../data/alternatives';
import { restTimer, useRestTimer, formatTime } from '../lib/restTimer';
import ProgressChart from './ProgressChart';
import ExerciseNameInput from './ExerciseNameInput';
import useSheetDrag from '../lib/useSheetDrag';

const newId = () => Math.random().toString(36).slice(2, 10);
// Número para un campo de texto, con la coma o el punto que corresponde al idioma.
const toField = (n) => (n == null ? '' : (getLang() === 'en' ? String(n) : String(n).replace('.', ',')));
const LOAD_STEP = 2.5;

function RestBar() {
  const timer = useRestTimer();
  if (!timer.running && !timer.justFinished) return null;
  return (
    <div className={`xs-rest ${timer.justFinished ? 'is-done' : ''}`} role="status">
      <Timer size={15} />
      <span>{timer.justFinished ? tr('restDone') : tr('restRunning', { time: formatTime(timer.remaining) })}</span>
      {timer.running && (
        <button type="button" onClick={() => restTimer.stop()}>{tr('restSkip')}</button>
      )}
    </div>
  );
}

function SetsView({ exercise, lifts, othersDone, onChange, onRecord }) {
  const plan = planSets(exercise.sets);
  const log = currentLog(exercise);
  const prev = lastSession(lifts, exercise.name, log ? log.id : null);
  const rows = log ? log.sets : plan.map(() => ({ kg: '', reps: '', done: false }));
  const prevSet = (i) => (prev ? prev.sets[Math.min(i, prev.sets.length - 1)] : null);
  const kgHint = (i) => {
    const p = prevSet(i);
    if (p && p.kg !== '' && p.kg != null) return String(p.kg);
    return exercise.weight ? String(exercise.weight) : '';
  };
  const repsHint = (i) => {
    const p = prevSet(i);
    if (p && p.reps !== '' && p.reps != null) return String(p.reps);
    const planned = plan[Math.min(i, plan.length - 1)];
    return planned ? planned.reps : '';
  };
  const [shakeRow, setShakeRow] = useState(null);

  const writeRows = (newRows) => {
    const now = Date.now();
    const base = log || { id: newId(), date: localDateKey(now), startedAt: now, sets: [] };
    const allBefore = !!log && rows.length > 0 && rows.every((r) => r.done);
    const allAfter = newRows.length > 0 && newRows.every((r) => r.done);
    let { done } = exercise;
    if (!allBefore && allAfter) done = true;
    if (allBefore && !allAfter) done = false;
    onChange({ ...exercise, done, log: { ...base, sets: newRows, updatedAt: now } });
  };

  const editRow = (i, field, value) => {
    const next = rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r));
    writeRows(next);
  };

  const toggleRow = (i) => {
    const r = rows[i];
    if (r.done) {
      writeRows(rows.map((x, idx) => (idx === i ? { ...x, done: false, at: undefined } : x)));
      return;
    }
    const kg = r.kg !== '' && r.kg != null ? r.kg : kgHint(i);
    const repsText = r.reps !== '' && r.reps != null ? r.reps : repsHint(i);
    const reps = firstNumber(repsText);
    if (!parseNumber(kg) && !reps) {
      setShakeRow(i);
      setTimeout(() => setShakeRow(null), 500);
      return;
    }
    const doneRow = { kg: kg === '' ? '' : String(kg), reps: reps == null ? '' : String(reps), done: true, at: Date.now() };
    const record = recordFor(lifts, exercise.name, doneRow, log ? log.id : null, rows.filter((x) => x.done));
    const next = rows.map((x, idx) => (idx === i ? doneRow : x));
    writeRows(next);
    if (record) onRecord(record, exercise.name);
    // Descanso después de cada serie, también la última del ejercicio (pasás al siguiente).
    // Si era lo último del día, no: el entrenamiento terminó.
    if (next.every((x) => x.done) && othersDone) restTimer.stop();
    else restTimer.start();
  };

  const fillFromPrev = (bump) => {
    if (!prev) return;
    writeRows(rows.map((r, i) => {
      if (r.done) return r;
      const p = prevSet(i);
      const kg = parseNumber(p.kg);
      const reps = parseNumber(p.reps);
      if (bump && kg) return { ...r, kg: toField(kg + LOAD_STEP), reps: reps == null ? '' : String(reps) };
      if (bump && !kg && reps) return { ...r, kg: '', reps: String(reps + 1) };
      return { ...r, kg: toField(kg), reps: reps == null ? '' : String(reps) };
    }));
  };

  const addRow = () => writeRows([...rows, { kg: '', reps: '', done: false }]);
  const removeRow = () => {
    if (rows.length <= 1 || rows[rows.length - 1].done) return;
    writeRows(rows.slice(0, -1));
  };

  const prevIsBodyweight = prev && prev.sets.every((s) => !parseNumber(s.kg));
  const doneCount = rows.filter((r) => r.done).length;

  return (
    <div className="xs-sets">
      {prev ? (
        <div className="xs-last">
          <div className="xs-last-head">
            <span>{tr('lastTime')}</span>
            <span className="xs-last-when">{daysAgoLabel(prev.date)}</span>
          </div>
          <div className="xs-last-sets">
            {prev.sets.map((s, i) => <span key={i} className="xs-chip">{formatSet(s)}</span>)}
          </div>
          <div className="xs-last-actions">
            <button type="button" className="xs-btn" onClick={() => fillFromPrev(false)}>
              <Repeat size={14} /> {tr('repeatLast')}
            </button>
            <button type="button" className="xs-btn xs-btn-accent" onClick={() => fillFromPrev(true)}>
              <TrendingUp size={14} /> {prevIsBodyweight ? tr('addOneRep') : tr('addLoad', { kg: formatKg(LOAD_STEP) })}
            </button>
          </div>
        </div>
      ) : (
        <p className="xs-hint">{tr('firstTimeHint')}</p>
      )}

      <div className="xs-table" role="table">
        <div className="xs-row xs-row-head" role="row">
          <span>{tr('setCol')}</span>
          <span>kg</span>
          <span>{tr('repsCol')}</span>
          <span className="xs-sr">{tr('markDone')}</span>
        </div>
        {rows.map((r, i) => (
          <div key={i} className={`xs-row ${r.done ? 'is-done' : ''} ${shakeRow === i ? 'is-shake' : ''}`} role="row">
            <span className="xs-set-num">{i + 1}</span>
            <input
              className="xs-input"
              inputMode="decimal"
              value={r.kg}
              placeholder={kgHint(i) || '—'}
              onChange={(e) => editRow(i, 'kg', e.target.value.replace(/[^0-9.,]/g, ''))}
              aria-label={`${tr('setCol')} ${i + 1} kg`}
            />
            <input
              className="xs-input"
              inputMode="numeric"
              value={r.reps}
              placeholder={repsHint(i) || '—'}
              onChange={(e) => editRow(i, 'reps', e.target.value.replace(/[^0-9]/g, ''))}
              aria-label={`${tr('setCol')} ${i + 1} ${tr('repsCol')}`}
            />
            <button
              type="button"
              className={`xs-check ${r.done ? 'is-on' : ''}`}
              onClick={() => toggleRow(i)}
              aria-label={r.done ? tr('markNotDone') : tr('markDone')}
              aria-pressed={r.done}
            >
              <Check size={16} strokeWidth={3} />
            </button>
          </div>
        ))}
      </div>
      <div className="xs-rows-actions">
        <button type="button" className="xs-link" onClick={addRow}><Plus size={14} /> {tr('addSet')}</button>
        {rows.length > 1 && !rows[rows.length - 1].done && (
          <button type="button" className="xs-link" onClick={removeRow}><Minus size={14} /> {tr('removeSet')}</button>
        )}
        <span className="xs-progress">{tr('setsDone', { done: doneCount, total: rows.length })}</span>
      </div>
    </div>
  );
}

function ProgressView({ exercise, lifts }) {
  const entries = liftEntriesFor(lifts, exercise.name);
  const series = progressSeries(entries);
  if (!series.length) return <p className="xs-hint">{tr('noProgressYet')}</p>;
  const { maxKg, maxReps, best1RM } = bestsOf(entries);
  const bodyweight = series.every((p) => p.bodyweight);
  const recent = series.slice(-6).reverse();
  return (
    <div className="xs-progress-view">
      <div className="xs-stats">
        {maxKg && (
          <div className="xs-stat">
            <span className="xs-stat-label"><Trophy size={13} /> {tr('recordWeight')}</span>
            <span className="xs-stat-value">{formatSet(maxKg)}</span>
          </div>
        )}
        {!maxKg && maxReps && (
          <div className="xs-stat">
            <span className="xs-stat-label"><Trophy size={13} /> {tr('recordReps')}</span>
            <span className="xs-stat-value">{formatSet({ reps: maxReps.reps })}</span>
          </div>
        )}
        {best1RM && (
          <div className="xs-stat">
            <span className="xs-stat-label">{tr('estimated1RM')}</span>
            <span className="xs-stat-value">≈ {formatKg(Math.round(best1RM.value * 2) / 2)} kg</span>
          </div>
        )}
        <div className="xs-stat">
          <span className="xs-stat-label">{tr('sessions')}</span>
          <span className="xs-stat-value">{series.length}</span>
        </div>
      </div>
      <p className="xs-chart-caption">{bodyweight ? tr('chartCaptionReps') : tr('chartCaptionKg')}</p>
      <ProgressChart series={series} unit={bodyweight ? 'reps' : 'kg'} ariaLabel={tr('chartAria', { name: exercise.name })} />
      <div className="xs-sessions" role="table" aria-label={tr('sessions')}>
        {recent.map((p) => (
          <div key={p.id} className="xs-session" role="row">
            <span className="xs-session-date">{formatShortDate(p.date)}</span>
            <span className="xs-session-sets">{p.sets.map((s) => formatSet(s)).join(' · ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const googleUrl = (query, videos) => {
  const lang = getLang();
  return `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=${lang}${videos ? '&tbm=vid' : ''}`;
};

function HowToView({ exercise, onAskJoe }) {
  const query = tr('howToQuery', { name: exercise.name });
  return (
    <div className="xs-howto-google">
      <p className="xs-hint">{tr('howToIntro')}</p>
      <div className="xs-howto-query">“{query}”</div>
      <div className="xs-howto-buttons">
        <a className="xs-btn xs-btn-accent xs-btn-big" href={googleUrl(query, false)} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={16} /> {tr('howToGoogle')}
        </a>
        <a className="xs-btn xs-btn-big" href={googleUrl(query, true)} target="_blank" rel="noopener noreferrer">
          <PlayCircle size={16} /> {tr('howToVideos')}
        </a>
        {onAskJoe && (
          <button type="button" className="xs-btn xs-btn-big" onClick={() => onAskJoe(tr('askJoeHowTo', { name: exercise.name }))}>
            <MessageCircle size={16} /> {tr('askJoe')}
          </button>
        )}
      </div>
    </div>
  );
}

function SwapView({ exercise, onSwap, onRevertSwap, onAskJoe }) {
  const [reason, setReason] = useState('busy');
  const [pick, setPick] = useState(null);
  const lang = getLang();
  const original = exercise.swappedFrom ? exercise.swappedFrom.name : exercise.name;
  const alts = alternativesFor(original, reason);
  const [custom, setCustom] = useState('');
  const customName = custom.trim();
  return (
    <div className="xs-swap">
      {exercise.swappedFrom && (
        <div className="xs-swap-banner">
          <span>{tr('swappedToday', { name: exercise.swappedFrom.name })}</span>
          <button type="button" className="xs-btn" onClick={onRevertSwap}>{tr('swapBack', { name: exercise.swappedFrom.name })}</button>
        </div>
      )}
      <div className="xs-swap-custom">
        <span className="xs-swap-custom-label"><PenLine size={13} /> {tr('swapCustomLabel')}</span>
        <ExerciseNameInput
          value={custom}
          onChange={setCustom}
          placeholder={tr('swapCustomPlaceholder')}
          exclude={[exercise.name]}
        />
        {customName && (
          <div className="xs-alt-actions xs-swap-custom-actions">
            <button type="button" className="xs-btn xs-btn-accent" onClick={() => onSwap('today', customName)}>{tr('swapToday')}</button>
            <button type="button" className="xs-btn" onClick={() => onSwap('replace', customName)}>{tr('swapReplace')}</button>
          </div>
        )}
      </div>
      <p className="xs-swap-or">{tr('swapOrPick')}</p>
      <div className="xs-segment xs-segment-small" role="tablist">
        <button type="button" role="tab" aria-selected={reason === 'busy'} className={reason === 'busy' ? 'active' : ''} onClick={() => { setReason('busy'); setPick(null); }}>
          {tr('swapBusy')}
        </button>
        <button type="button" role="tab" aria-selected={reason === 'home'} className={reason === 'home' ? 'active' : ''} onClick={() => { setReason('home'); setPick(null); }}>
          {tr('swapHome')}
        </button>
      </div>
      {alts.length === 0 ? (
        <div className="xs-howto-empty">
          <p>{tr('noAlternatives')}</p>
          {onAskJoe && (
            <button type="button" className="xs-btn" onClick={() => onAskJoe(tr(reason === 'home' ? 'askJoeSwapHome' : 'askJoeSwapBusy', { name: original }))}>
              <MessageCircle size={14} /> {tr('askJoe')}
            </button>
          )}
        </div>
      ) : (
        <ul className="xs-alt-list">
          {alts.map((alt) => {
            const label = translateExerciseName(alt.name, lang);
            const open = pick === alt.name;
            return (
              <li key={alt.name} className={`xs-alt ${open ? 'is-open' : ''}`}>
                <button type="button" className="xs-alt-main" onClick={() => setPick(open ? null : alt.name)}>
                  <span className="xs-alt-name">{label}</span>
                  <span className="xs-alt-eq">{tr(`equip_${alt.equipment}`)}</span>
                </button>
                {open && (
                  <div className="xs-alt-actions">
                    <button type="button" className="xs-btn xs-btn-accent" onClick={() => onSwap('today', label)}>{tr('swapToday')}</button>
                    <button type="button" className="xs-btn" onClick={() => onSwap('replace', label)}>{tr('swapReplace')}</button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className="xs-hint xs-hint-small">{tr('swapTodayHint')}</p>
    </div>
  );
}

const VIEWS = [
  { id: 'sets', icon: ListChecks, label: 'viewSets' },
  { id: 'progress', icon: TrendingUp, label: 'viewProgress' },
  { id: 'howto', icon: BookOpen, label: 'viewHowTo' },
  { id: 'swap', icon: ArrowLeftRight, label: 'viewSwap' },
];

export default function ExerciseSheet({
  exercise, lifts, accent, othersDone, initialView = 'sets', onChange, onSwap, onRevertSwap, onRecord, onAskJoe, onClose,
}) {
  const [view, setView] = useState(initialView);
  const sheetRef = useRef(null);
  const overlayRef = useRef(null);
  useSheetDrag(sheetRef, overlayRef, onClose);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => { if (sheetRef.current) sheetRef.current.scrollTop = 0; }, [view]);

  if (!exercise) return null;
  return (
    <div className="xs-overlay" ref={overlayRef} onClick={onClose}>
      <div
        className="xs-sheet"
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={exercise.name}
        onClick={(e) => e.stopPropagation()}
        style={{ '--accent': accent || '#B33A3A' }}
      >
        <div className="xs-grabber-zone" data-drag-handle><div className="xs-grabber" aria-hidden="true" /></div>
        <div className="xs-head" data-drag-handle>
          <div className="xs-head-text">
            <h2>{exercise.name}</h2>
            <p>
              {tr('targetLabel')}: <strong>{exercise.sets || '—'}</strong>
              {exercise.weight ? ` · ${exercise.weight} kg` : ''}
            </p>
          </div>
          <button type="button" className="icon-btn xs-close" onClick={onClose} aria-label={tr('close')}><X size={18} /></button>
        </div>
        <div className="xs-segment" role="tablist">
          {VIEWS.map((v) => {
            const Icon = v.icon;
            return (
              <button key={v.id} type="button" role="tab" aria-selected={view === v.id} className={view === v.id ? 'active' : ''} onClick={() => setView(v.id)}>
                <Icon size={14} /> <span>{tr(v.label)}</span>
              </button>
            );
          })}
        </div>
        <RestBar />
        <div className="xs-body">
          {view === 'sets' && <SetsView exercise={exercise} lifts={lifts} othersDone={othersDone} onChange={onChange} onRecord={onRecord} />}
          {view === 'progress' && <ProgressView exercise={exercise} lifts={lifts} />}
          {view === 'howto' && <HowToView exercise={exercise} onAskJoe={onAskJoe} />}
          {view === 'swap' && <SwapView exercise={exercise} onSwap={onSwap} onRevertSwap={onRevertSwap} onAskJoe={onAskJoe} />}
        </div>
      </div>
    </div>
  );
}
