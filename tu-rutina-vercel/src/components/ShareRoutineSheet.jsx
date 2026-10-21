// Hoja para compartir la rutina. Crea el link corto apenas se abre (así el botón de
// compartir funciona al toque, también en iPhone) y ofrece WhatsApp, el menú del celular o
// copiar. Si no se puede crear el corto, usa el link largo de respaldo.
import React, { useEffect, useRef, useState } from 'react';
import { X, Copy, Check, Share2, Loader2, MessageCircle, Link2 } from 'lucide-react';
import { tr, trn } from '../i18n';
import { createRoutineLink } from '../lib/share';
import useSheetDrag from '../lib/useSheetDrag';

const prettyUrl = (url) => String(url || '').replace(/^https?:\/\//, '');

export default function ShareRoutineSheet({ variant, lang, from, onClose }) {
  const [url, setUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const sheetRef = useRef(null);
  const overlayRef = useRef(null);
  useSheetDrag(sheetRef, overlayRef, onClose);

  useEffect(() => {
    let alive = true;
    createRoutineLink(variant, lang, from).then((u) => { if (alive) setUrl(u); });
    return () => { alive = false; };
    // Se crea una sola vez al abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const days = (variant.days || []).length;
  const exercises = (variant.days || []).reduce((n, d) => n + (d.list || []).filter((e) => !e.tempDate).length, 0);
  const text = tr('shareRoutineText', { name: variant.name });
  const isShort = url && /\/r\/[A-Za-z0-9]{7}$/.test(url);

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) { /* noop */ }
  };
  const nativeShare = async () => {
    if (!url || !navigator.share) return;
    try { await navigator.share({ title: variant.name, text, url }); } catch (e) { /* cancelado */ }
  };

  return (
    <div className="xs-overlay" ref={overlayRef} onClick={onClose}>
      <div
        className="xs-sheet sr-sheet"
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={tr('shareRoutineTitle')}
        onClick={(e) => e.stopPropagation()}
        style={{ '--accent': '#C24747' }}
      >
        <div className="xs-grabber-zone" data-drag-handle><div className="xs-grabber" aria-hidden="true" /></div>
        <div className="xs-head" data-drag-handle>
          <div className="xs-head-text">
            <h2>{tr('shareRoutineTitle')}</h2>
            <p>{variant.name} · {trn('daysCount', days)} · {trn('exercisesCount', exercises)}</p>
          </div>
          <button type="button" className="icon-btn xs-close" onClick={onClose} aria-label={tr('close')}><X size={18} /></button>
        </div>

        <div className={`sr-link ${url ? '' : 'is-loading'}`}>
          <Link2 size={16} className="sr-link-icon" />
          {url ? (
            <span className={`sr-link-url ${isShort ? '' : 'is-long'}`}>{prettyUrl(url)}</span>
          ) : (
            <span className="sr-link-url"><Loader2 size={14} className="spin" /> {tr('shareCreatingLink')}</span>
          )}
          <button type="button" className="sr-copy" onClick={copy} disabled={!url} aria-label={tr('copy')}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <p className="xs-hint xs-hint-small">{isShort || !url ? tr('shareLinkNote') : tr('shareLinkLongNote')}</p>

        <div className="sr-actions">
          <a
            className={`xs-btn xs-btn-accent xs-btn-big ${url ? '' : 'is-disabled'}`}
            href={url ? `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}` : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!url}
          >
            <MessageCircle size={16} /> {tr('shareWhatsApp')}
          </a>
          {typeof navigator !== 'undefined' && navigator.share && (
            <button type="button" className="xs-btn xs-btn-big" onClick={nativeShare} disabled={!url}>
              <Share2 size={16} /> {tr('shareMoreOptions')}
            </button>
          )}
          <button type="button" className="xs-btn xs-btn-big" onClick={copy} disabled={!url}>
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? tr('copied') : tr('shareCopyLink')}
          </button>
        </div>
      </div>
    </div>
  );
}
