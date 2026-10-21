// Campo para escribir el nombre de un ejercicio, con sugerencias de la biblioteca mientras
// escribís (en el idioma de la app). Se puede escribir cualquier cosa: las sugerencias son
// solo una ayuda.
import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { getLang } from '../i18n';
import { exerciseSuggestions, normalizeText } from '../i18n-content';

const MAX_SUGGESTIONS = 6;

export const matchExercises = (query, lang, exclude = []) => {
  const q = normalizeText(query);
  if (q.length < 2) return [];
  const words = q.split(' ').filter(Boolean);
  const skip = new Set(exclude.map(normalizeText));
  const scored = [];
  exerciseSuggestions(lang).forEach((name) => {
    const n = normalizeText(name);
    if (skip.has(n) || n === q) return;
    if (!words.every((w) => n.includes(w))) return;
    const score = n.startsWith(q) ? 0 : n.split(' ').some((part) => part.startsWith(words[0])) ? 1 : 2;
    scored.push([score, n.length, name]);
  });
  scored.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return scored.slice(0, MAX_SUGGESTIONS).map((s) => s[2]);
};

export default function ExerciseNameInput({
  value, onChange, placeholder, autoFocus, onSubmit, exclude, inputRef, ariaLabel,
}) {
  const [focused, setFocused] = useState(false);
  const [picked, setPicked] = useState(false);
  const lang = getLang();
  const suggestions = useMemo(() => matchExercises(value, lang, exclude || []), [value, lang, exclude]);
  const open = focused && !picked && suggestions.length > 0;

  return (
    <div className="xn-wrap">
      <div className="xn-field">
        <Search size={15} className="xn-icon" aria-hidden="true" />
        <input
          ref={inputRef}
          className="xn-input"
          value={value}
          onChange={(e) => { setPicked(false); onChange(e.target.value); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => { if (e.key === 'Enter' && onSubmit) { e.preventDefault(); onSubmit(); } }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
          aria-label={ariaLabel || placeholder}
          aria-autocomplete="list"
          aria-expanded={open}
        />
      </div>
      {open && (
        <ul className="xn-list" role="listbox">
          {suggestions.map((name) => (
            <li key={name} role="option" aria-selected="false">
              <button
                type="button"
                className="xn-option"
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => { onChange(name); setPicked(true); }}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
