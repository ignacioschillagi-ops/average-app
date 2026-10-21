// Cargar un entrenamiento que hiciste sin el teléfono (desde el calendario de Progreso).
// No mide tiempos: se elige qué día de la rutina fue, cuánto duró más o menos (o "no me
// acuerdo"), qué ejercicios hiciste y, si te acordás, series y pesos. Queda marcado como
// "cargado después".
import React, { useMemo, useRef, useState } from 'react';
import { X, Check, ChevronDown, ChevronUp, Plus, PenLine } from 'lucide-react';
import { tr } from '../i18n';
import { weekdayLabel, WEEKDAY_KEYS } from '../i18n-content';
import { formatLongDate, dateFromKey } from '../lib/dates';
import { planSets, lastSession, formatSet, parseNumber } from '../lib/lifts';
import useSheetDrag from '../lib/useSheetDrag';

const DURATIONS = [30, 45, 60, 75, 90, 120];
const durationLabel = (min) => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
};
const sortDays = (days) => [...days].sort((a, b) => WEEKDAY_KEYS.indexOf(a.weekday) - WEEKDAY_KEYS.indexOf(b.weekday));

export default function ManualWorkoutSheet({ date, variants, activeVariantId, lifts, lang, onSave, onClose }) {
  const sheetRef = useRef(null);
  const overlayRef = useRef(null);
  useSheetDrag(sheetRef, overlayRef, onClose);

  const usable = variants.filter((v) => (v.days || []).length);
  const dateWeekday = WEEKDAY_KEYS[(dateFromKey(date).getDay() + 6) % 7];
  const [variantId, setVariantId] = useState(() => (usable.find((v) => v.id === activeVariantId) || usable[0] || {}).id);
  const variant = usable.find((v) => v.id === variantId) || usable[0];
  const days = variant ? sortDays(variant.days) : [];
  const pickDefaultDay = (list) => (list.find((d) => d.weekday === dateWeekday) || list[0] || {}).id;
  const [dayId, setDayId] = useState(() => pickDefaultDay(days));
  const day = days.find((d) => d.id === dayId) || days[0];
  const [duration, setDuration] = useState(null);

  // Estado por ejercicio: hecho (por defecto sí) y series anotadas (opcional).
  const initialRows = (d) => (d ? (d.list || []).filter((e) => !e.tempDate).map((e) => ({
    id: e.id, name: e.name, target: e.sets, done: true, open: false,
    sets: planSets(e.sets).slice(0, 6).map(() => ({ kg: '', reps: '' })),
  })) : []);
  const [rows, setRows] = useState(() => initialRows(day));

  const chooseVariant = (id) => {
    const v = usable.find((x) => x.id === id);
    const list = v ? sortDays(v.days) : [];
    const nextDay = pickDefaultDay(list);
    setVariantId(id);
    setDayId(nextDay);
    setRows(initialRows(list.find((d) => d.id === nextDay)));
  };
  const chooseDay = (id) => {
    setDayId(id);
    setRows(initialRows(days.find((d) => d.id === id)));
  };
  const patchRow = (i, patch) => setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const patchSet = (i, j, field, value) => setRows((prev) => prev.map((r, idx) => (idx === i
    ? { ...r, sets: r.sets.map((s, k) => (k === j ? { ...s, [field]: value } : s)) }
    : r)));

  const doneCount = rows.filter((r) => r.done).length;
  const hints = useMemo(() => {
    const out = {};
    rows.forEach((r) => {
      const prev = lastSession(lifts, r.name);
      out[r.id] = prev ? prev.sets : null;
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayId, variantId]);

  const save = () => {
    if (!day || !doneCount) return;
    onSave({
      date,
      variant,
      day,
      durationMin: duration,
      exercises: rows.map((r) => {
        const sets = r.done
          ? r.sets.filter((s) => parseNumber(s.kg) || parseNumber(s.reps)).map((s) => ({ kg: s.kg.trim(), reps: s.reps.trim() }))
          : [];
        return { name: r.name, target: r.target, done: r.done, sets };
      }),
    });
  };

  return (
    <div className="xs-overlay" ref={overlayRef} onClick={onClose}>
      <div
        className="xs-sheet mw-sheet"
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={tr('manualTitle')}
        onClick={(e) => e.stopPropagation()}
        style={{ '--accent': '#C24747', '--accent-bg': 'rgba(194,71,71,0.14)' }}
      >
        <div className="xs-grabber-zone" data-drag-handle><div className="xs-grabber" aria-hidden="true" /></div>
        <div className="xs-head" data-drag-handle>
          <div className="xs-head-text">
            <h2>{tr('manualTitle')}</h2>
            <p>{formatLongDate(date)}</p>
          </div>
          <button type="button" className="icon-btn xs-close" onClick={onClose} aria-label={tr('close')}><X size={18} /></button>
        </div>
        <p className="mw-note"><PenLine size={14} /> {tr('manualNote')}</p>

        {usable.length > 1 && (
          <div className="mw-section">
            <span className="xe-label">{tr('manualWhichRoutine')}</span>
            <div className="mw-chips">
              {usable.map((v) => (
                <button key={v.id} type="button" className={`xe-chip ${v.id === variantId ? 'is-on' : ''}`} onClick={() => chooseVariant(v.id)}>{v.name}</button>
              ))}
            </div>
          </div>
        )}

        <div className="mw-section">
          <span className="xe-label">{tr('manualWhichDay')}</span>
          <div className="mw-chips">
            {days.map((d) => (
              <button key={d.id} type="button" className={`mw-day ${d.id === dayId ? 'is-on' : ''}`} onClick={() => chooseDay(d.id)}>
                <span className="mw-day-weekday">{weekdayLabel(d.weekday, lang)}</span>
                <span className="mw-day-tag">{d.tagLabel}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mw-section">
          <span className="xe-label">{tr('manualHowLong')}</span>
          <div className="mw-chips">
            {DURATIONS.map((m) => (
              <button key={m} type="button" className={`xe-chip ${duration === m ? 'is-on' : ''}`} onClick={() => setDuration(m)}>{durationLabel(m)}</button>
            ))}
            <button type="button" className={`xe-chip ${duration == null ? 'is-on' : ''}`} onClick={() => setDuration(null)}>{tr('manualDontKnow')}</button>
          </div>
        </div>

        <div className="mw-section">
          <span className="xe-label">{tr('manualExercises')}</span>
          <p className="mw-hint">{tr('manualExercisesHint')}</p>
          <ul className="mw-list">
            {rows.map((r, i) => {
              const hint = hints[r.id];
              return (
                <li key={r.id} className={`mw-ex ${r.done ? '' : 'is-off'}`}>
                  <div className="mw-ex-main">
                    <button
                      type="button"
                      className={`done-toggle ${r.done ? 'checked' : ''}`}
                      onClick={() => patchRow(i, { done: !r.done, open: r.done ? false : r.open })}
                      aria-label={r.done ? tr('markNotDone') : tr('markDone')}
                    >
                      {r.done && <Check size={13} strokeWidth={3} />}
                    </button>
                    <span className="mw-ex-name">{r.name}</span>
                    <span className="ex-sets">{r.target}</span>
                    {r.done && (
                      <button type="button" className="mw-ex-weights" onClick={() => patchRow(i, { open: !r.open })} aria-expanded={r.open}>
                        {tr('manualAddWeights')} {r.open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    )}
                  </div>
                  {r.done && r.open && (
                    <div className="mw-sets">
                      {hint && <p className="mw-sets-hint">{tr('lastTime')}: {hint.map((s) => formatSet(s)).join(' · ')}</p>}
                      {r.sets.map((s, j) => (
                        <div key={j} className="mw-set">
                          <span className="xs-set-num">{j + 1}</span>
                          <input
                            className="xs-input"
                            inputMode="decimal"
                            placeholder="kg"
                            value={s.kg}
                            onChange={(e) => patchSet(i, j, 'kg', e.target.value.replace(/[^0-9.,]/g, ''))}
                            aria-label={`${tr('setCol')} ${j + 1} kg`}
                          />
                          <span className="mw-x">×</span>
                          <input
                            className="xs-input"
                            inputMode="numeric"
                            placeholder={tr('repsCol')}
                            value={s.reps}
                            onChange={(e) => patchSet(i, j, 'reps', e.target.value.replace(/[^0-9]/g, ''))}
                            aria-label={`${tr('setCol')} ${j + 1} ${tr('repsCol')}`}
                          />
                        </div>
                      ))}
                      <button type="button" className="xs-link" onClick={() => patchRow(i, { sets: [...r.sets, { kg: '', reps: '' }] })}>
                        <Plus size={14} /> {tr('addSet')}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <button type="button" className="xs-btn xs-btn-accent xe-save" onClick={save} disabled={!doneCount}>
          <Check size={16} /> {tr('manualSave')}
        </button>
      </div>
    </div>
  );
}
