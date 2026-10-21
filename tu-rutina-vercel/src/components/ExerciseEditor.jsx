// Hoja para agregar o editar un ejercicio de un día. Reemplaza los campitos apretados de la
// edición en la lista: nombre con sugerencias, objetivo con atajos (3x10, 4x8...), peso
// opcional y, al agregar desde la rutina, si es "solo hoy" o "para siempre".
import React, { useRef, useState } from 'react';
import { X, Trash2, Plus, Check, CalendarDays, Infinity as InfinityIcon } from 'lucide-react';
import { tr } from '../i18n';
import ExerciseNameInput from './ExerciseNameInput';
import useSheetDrag from '../lib/useSheetDrag';

const TARGET_PRESETS = ['3x8', '3x10', '3x12', '4x8', '4x10', '4x12', '5x5', '3x15'];

/**
 * mode: 'add' | 'edit'
 * initial: { name, sets, weight }
 * allowTemp: muestra "Solo hoy / Para siempre" (agregar desde la rutina, fuera de editar)
 * onSave({ name, sets, weight, temp })
 */
export default function ExerciseEditor({
  mode, initial, dayLabel, accent, allowTemp, defaultTemp, existingNames, onSave, onDelete, onClose,
}) {
  const [name, setName] = useState((initial && initial.name) || '');
  const [sets, setSets] = useState((initial && initial.sets && initial.sets !== '—') ? initial.sets : '');
  const [weight, setWeight] = useState((initial && initial.weight) || '');
  const [temp, setTemp] = useState(!!defaultTemp);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shake, setShake] = useState(false);
  const sheetRef = useRef(null);
  const overlayRef = useRef(null);
  const nameRef = useRef(null);
  useSheetDrag(sheetRef, overlayRef, onClose);

  const save = () => {
    const clean = name.trim();
    if (!clean) {
      setShake(true);
      setTimeout(() => setShake(false), 450);
      if (nameRef.current) nameRef.current.focus();
      return;
    }
    onSave({ name: clean, sets: sets.trim() || '3x10', weight: weight.trim(), temp: allowTemp ? temp : false });
  };

  return (
    <div className="xs-overlay" ref={overlayRef} onClick={onClose}>
      <div
        className="xs-sheet xe-sheet"
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'add' ? tr('addExerciseTitle') : tr('editExerciseTitle')}
        onClick={(e) => e.stopPropagation()}
        style={{ '--accent': accent || '#B33A3A' }}
      >
        <div className="xs-grabber-zone" data-drag-handle><div className="xs-grabber" aria-hidden="true" /></div>
        <div className="xs-head" data-drag-handle>
          <div className="xs-head-text">
            <h2>{mode === 'add' ? tr('addExerciseTitle') : tr('editExerciseTitle')}</h2>
            {dayLabel && <p>{dayLabel}</p>}
          </div>
          <button type="button" className="icon-btn xs-close" onClick={onClose} aria-label={tr('close')}><X size={18} /></button>
        </div>

        <div className={`xe-field ${shake ? 'is-shake' : ''}`}>
          <span className="xe-label">{tr('exerciseFieldLabel')}</span>
          <ExerciseNameInput
            inputRef={nameRef}
            value={name}
            onChange={setName}
            placeholder={tr('exerciseSearchPlaceholder')}
            autoFocus={mode === 'add'}
            exclude={existingNames}
          />
        </div>

        <div className="xe-row">
          <label className="xe-field xe-field-grow">
            <span className="xe-label">{tr('targetFieldLabel')}</span>
            <input className="xe-input xe-mono" value={sets} onChange={(e) => setSets(e.target.value)} placeholder="3x10" autoComplete="off" />
          </label>
          <label className="xe-field xe-field-kg">
            <span className="xe-label">{tr('weightFieldLabel')}</span>
            <input className="xe-input xe-mono" value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^0-9.,]/g, ''))} placeholder="kg" inputMode="decimal" autoComplete="off" />
          </label>
        </div>
        <div className="xe-chips" aria-label={tr('targetFieldLabel')}>
          {TARGET_PRESETS.map((p) => (
            <button key={p} type="button" className={`xe-chip ${sets === p ? 'is-on' : ''}`} onClick={() => setSets(p)}>{p}</button>
          ))}
        </div>

        {allowTemp && (
          <div className="xe-scope" role="radiogroup" aria-label={tr('addScopeLabel')}>
            <button type="button" role="radio" aria-checked={temp} className={`xe-scope-opt ${temp ? 'is-on' : ''}`} onClick={() => setTemp(true)}>
              <CalendarDays size={16} />
              <span className="xe-scope-title">{tr('addScopeToday')}</span>
              <span className="xe-scope-desc">{tr('addScopeTodayDesc')}</span>
            </button>
            <button type="button" role="radio" aria-checked={!temp} className={`xe-scope-opt ${!temp ? 'is-on' : ''}`} onClick={() => setTemp(false)}>
              <InfinityIcon size={16} />
              <span className="xe-scope-title">{tr('addScopeAlways')}</span>
              <span className="xe-scope-desc">{tr('addScopeAlwaysDesc')}</span>
            </button>
          </div>
        )}

        <button type="button" className="xs-btn xs-btn-accent xe-save" onClick={save}>
          {mode === 'add' ? <Plus size={16} /> : <Check size={16} />}
          {mode === 'add' ? tr('addExerciseCta') : tr('save')}
        </button>

        {mode === 'edit' && onDelete && (
          confirmDelete ? (
            <div className="xe-delete-confirm">
              <span>{tr('confirmDeleteExercise', { name: (initial && initial.name) || name })}</span>
              <div>
                <button type="button" className="xs-btn" onClick={() => setConfirmDelete(false)}>{tr('cancel')}</button>
                <button type="button" className="xs-btn xe-danger" onClick={onDelete}><Trash2 size={14} /> {tr('delete')}</button>
              </div>
            </div>
          ) : (
            <button type="button" className="xe-delete" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={14} /> {tr('deleteExercise')}
            </button>
          )
        )}
      </div>
    </div>
  );
}
