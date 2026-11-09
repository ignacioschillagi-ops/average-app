// Botón "atrás" del celular (o del navegador): si hay una ventana abierta (la hoja de un
// ejercicio, un diálogo, una hoja de compartir...), atrás la cierra en vez de salir de la app.
// Cada ventana abierta ocupa un paso del historial; atrás cierra la de más arriba. Si se
// cierra con la X o tocando afuera, ese paso se saca solo.
//
// Detalles para que no se desfase: si una ventana se cierra y otra se abre en el mismo
// momento (por ejemplo la hoja del ejercicio que se rearma al cambiarlo), la nueva reutiliza
// el paso de la anterior; y si hay un "atrás" en camino, el paso nuevo se agrega cuando llega.
import { useEffect, useRef } from 'react';

const stack = [];
let freeSteps = 0; // pasos de ventanas recién cerradas, todavía en el historial
let ignorePops = 0; // "atrás" hechos por la app (no por la persona)
let pendingPushes = 0; // pasos a agregar cuando termine el "atrás" en camino
let listening = false;

const pushStep = () => {
  try {
    window.history.pushState({ joesOverlay: true }, '');
  } catch (e) { /* sin historial: atrás se comporta como siempre */ }
};

const onPopState = () => {
  if (ignorePops > 0) {
    ignorePops -= 1;
    if (ignorePops === 0) {
      for (; pendingPushes > 0; pendingPushes -= 1) pushStep();
    }
    return;
  }
  const top = stack.pop();
  if (top) top.close();
};

const flushFreeSteps = () => {
  if (freeSteps <= 0) return;
  const n = freeSteps;
  freeSteps = 0;
  ignorePops += 1;
  try {
    window.history.go(-n);
  } catch (e) {
    ignorePops -= 1;
  }
};

const pushBackHandler = (close) => {
  if (typeof window === 'undefined' || !window.history || !window.history.pushState) return () => {};
  if (!listening) {
    window.addEventListener('popstate', onPopState);
    listening = true;
  }
  const entry = { close };
  stack.push(entry);
  if (freeSteps > 0) freeSteps -= 1; // reutiliza el paso de la que se acaba de cerrar
  else if (ignorePops > 0) pendingPushes += 1; // hay un "atrás" en camino: agregar después
  else pushStep();
  return () => {
    const i = stack.indexOf(entry);
    if (i === -1) return; // ya se cerró con atrás
    stack.splice(i, 1);
    freeSteps += 1;
    setTimeout(flushFreeSteps, 0);
  };
};

export default function useBackClose(onClose) {
  const ref = useRef(onClose);
  ref.current = onClose;
  useEffect(() => pushBackHandler(() => { if (ref.current) ref.current(); }), []);
}
