// Elegir la tarjeta para historias antes de compartir: "Con frase" (la de siempre) o
// "Detalle" (sin frase ni nombre de rutina, con todos los ejercicios y sus series).
// Las dos se dibujan al abrir, así el botón comparte al instante (el celular exige que
// compartir pase justo después de un toque).
import React, { useEffect, useState } from 'react';
import { X, Share2, Check, Loader2 } from 'lucide-react';
import { tr } from '../i18n';
import { shareImage } from '../lib/share';

const PREF_KEY = 'story-template-v1';

const readPref = () => {
  try { return localStorage.getItem(PREF_KEY); } catch (e) { return null; }
};
const savePref = (id) => {
  try { localStorage.setItem(PREF_KEY, id); } catch (e) { /* noop */ }
};

/**
 * cards: [{ id, label, desc, render: () => Promise<Blob> }]
 */
export default function StoryPicker({ cards, filename, onClose, onResult }) {
  const [selected, setSelected] = useState(() => {
    const pref = readPref();
    return cards.some((c) => c.id === pref) ? pref : cards[0].id;
  });
  const [blobs, setBlobs] = useState({});
  const [urls, setUrls] = useState({});
  const [failed, setFailed] = useState({});
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    let alive = true;
    const created = [];
    cards.forEach((c) => {
      c.render()
        .then((blob) => {
          if (!alive) return;
          const url = URL.createObjectURL(blob);
          created.push(url);
          setBlobs((prev) => ({ ...prev, [c.id]: blob }));
          setUrls((prev) => ({ ...prev, [c.id]: url }));
        })
        .catch(() => { if (alive) setFailed((prev) => ({ ...prev, [c.id]: true })); });
    });
    return () => {
      alive = false;
      created.forEach((u) => URL.revokeObjectURL(u));
    };
    // Las tarjetas se dibujan una sola vez al abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const pick = (id) => {
    setSelected(id);
    savePref(id);
  };

  const share = async () => {
    const blob = blobs[selected];
    if (!blob || sharing) return;
    setSharing(true);
    try {
      const result = await shareImage(blob, filename, "Average Joe's");
      onResult(result);
      if (result !== 'cancelled') onClose();
    } catch (e) {
      onResult('error');
    } finally {
      setSharing(false);
    }
  };

  const allFailed = cards.every((c) => failed[c.id]);

  return (
    <div className="xs-overlay" onClick={onClose}>
      <div
        className="xs-sheet sp-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={tr('storyPickTitle')}
        style={{ '--accent': '#C24747', '--accent-bg': 'rgba(194,71,71,0.14)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="xs-grabber" />
        <div className="xs-head">
          <div className="xs-head-text">
            <h2>{tr('storyPickTitle')}</h2>
            <p>{tr('storyPickSub')}</p>
          </div>
          <button type="button" className="icon-btn xs-close" onClick={onClose} aria-label={tr('close')}>
            <X size={18} />
          </button>
        </div>

        <div className="sp-options" role="radiogroup" aria-label={tr('storyPickTitle')}>
          {cards.map((c) => {
            const isSel = selected === c.id;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={isSel}
                className={`sp-option ${isSel ? 'is-selected' : ''}`}
                onClick={() => pick(c.id)}
              >
                <span className="sp-thumb">
                  {urls[c.id] ? (
                    <img src={urls[c.id]} alt={tr('storyPreviewAlt', { name: c.label })} />
                  ) : failed[c.id] ? (
                    <span className="sp-thumb-msg">{tr('storyError')}</span>
                  ) : (
                    <Loader2 size={22} className="spin" />
                  )}
                  {isSel && <span className="sp-check"><Check size={14} strokeWidth={3} /></span>}
                </span>
                <span className="sp-label">{c.label}</span>
                <span className="sp-desc">{c.desc}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="xs-btn xs-btn-accent sp-share"
          onClick={share}
          disabled={!blobs[selected] || sharing || allFailed}
        >
          {sharing ? <Loader2 size={16} className="spin" /> : <Share2 size={16} />}
          {tr('storyShareCta')}
        </button>
      </div>
    </div>
  );
}
