// Cerrar una hoja de abajo arrastrándola hacia abajo, como en las apps del celular.
// Con el dedo: desde cualquier parte de la hoja si está scrolleada arriba de todo (o desde
// la barrita/encabezado, marcados con data-drag-handle). Con el mouse: desde la barrita.
// Si se suelta antes de la mitad del recorrido, vuelve a su lugar.
import { useEffect, useRef } from 'react';

const CLOSE_DISTANCE = 110; // px arrastrados para cerrar
const CLOSE_VELOCITY = 0.6; // px/ms: un "tirón" rápido cierra aunque sea corto

export default function useSheetDrag(sheetRef, overlayRef, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return undefined;
    const overlay = overlayRef ? overlayRef.current : null;
    let startY = 0;
    let startX = 0;
    let startT = 0;
    let dy = 0;
    let active = false;
    let decided = false;
    let dragging = false;
    let closing = false;

    const paint = (y, animate) => {
      sheet.style.transition = animate ? 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
      sheet.style.transform = y > 0 ? `translateY(${y}px)` : '';
      if (overlay) {
        overlay.style.transition = animate ? 'background-color 220ms ease' : 'none';
        overlay.style.backgroundColor = y > 0 ? `rgba(10,10,11,${Math.max(0.12, 0.62 - y / 900)})` : '';
      }
    };

    const finish = () => {
      if (!dragging) { active = false; return; }
      dragging = false;
      active = false;
      const velocity = dy / Math.max(1, Date.now() - startT);
      if (dy > CLOSE_DISTANCE || (dy > 40 && velocity > CLOSE_VELOCITY)) {
        closing = true;
        paint(sheet.offsetHeight + 40, true);
        setTimeout(() => onCloseRef.current && onCloseRef.current(), 200);
      } else {
        paint(0, true);
      }
    };

    // ----- dedo
    const onTouchStart = (e) => {
      if (closing || e.touches.length !== 1) return;
      const t = e.touches[0];
      startY = t.clientY;
      startX = t.clientX;
      startT = Date.now();
      dy = 0;
      decided = false;
      dragging = false;
      active = sheet.scrollTop <= 0 || !!(e.target.closest && e.target.closest('[data-drag-handle]'));
    };
    const onTouchMove = (e) => {
      if (!active || closing) return;
      const t = e.touches[0];
      const moveY = t.clientY - startY;
      const moveX = t.clientX - startX;
      if (!decided) {
        if (Math.abs(moveY) < 8 && Math.abs(moveX) < 8) return;
        decided = true;
        // Solo hacia abajo y más vertical que horizontal (los chips que se deslizan de costado siguen andando).
        if (moveY <= 0 || Math.abs(moveY) < Math.abs(moveX) * 1.2) { active = false; return; }
        dragging = true;
        startY = t.clientY;
        startT = Date.now();
        if (document.activeElement && document.activeElement.blur && sheet.contains(document.activeElement)) {
          document.activeElement.blur();
        }
      }
      if (!dragging) return;
      if (e.cancelable) e.preventDefault();
      dy = Math.max(0, t.clientY - startY);
      paint(dy, false);
    };

    // ----- mouse (computadora), desde la barrita
    const onPointerDown = (e) => {
      if (e.pointerType !== 'mouse' || closing) return;
      if (!(e.target.closest && e.target.closest('[data-drag-handle]'))) return;
      if (e.target.closest('button, input, a')) return;
      startY = e.clientY;
      startT = Date.now();
      dy = 0;
      active = true;
      dragging = true;
      const move = (ev) => {
        dy = Math.max(0, ev.clientY - startY);
        paint(dy, false);
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        finish();
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    };

    sheet.addEventListener('touchstart', onTouchStart, { passive: true });
    sheet.addEventListener('touchmove', onTouchMove, { passive: false });
    sheet.addEventListener('touchend', finish);
    sheet.addEventListener('touchcancel', finish);
    sheet.addEventListener('pointerdown', onPointerDown);
    return () => {
      sheet.removeEventListener('touchstart', onTouchStart);
      sheet.removeEventListener('touchmove', onTouchMove);
      sheet.removeEventListener('touchend', finish);
      sheet.removeEventListener('touchcancel', finish);
      sheet.removeEventListener('pointerdown', onPointerDown);
    };
  }, [sheetRef, overlayRef]);
}
