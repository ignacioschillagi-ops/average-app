// Cronómetro de descanso compartido: lo usan el botón flotante y la hoja de ejercicio (que lo
// arranca sola al completar una serie). Vive fuera de React para que ambos vean lo mismo.
// Cuenta contra la hora real (endsAt), así no se atrasa si el celular bloquea la pantalla.

import { useSyncExternalStore } from 'react';

export const TIMER_PRESETS = [30, 60, 90, 120];
const PRESET_STORAGE = 'timer-last-preset-v1';

const loadPreset = () => {
  try {
    const n = parseInt(localStorage.getItem(PRESET_STORAGE), 10);
    return TIMER_PRESETS.includes(n) ? n : 60;
  } catch (e) {
    return 60;
  }
};

const initialPreset = loadPreset();
// Cuánto queda visible el aviso verde de "descanso terminado".
const FINISHED_NOTICE_MS = 5000;

let state = { remaining: initialPreset, running: false, lastPreset: initialPreset, justFinished: false };
const listeners = new Set();
let interval = null;
let endsAt = 0;
let finishedTimeout = null;
let audioCtx = null;

const emit = () => listeners.forEach((fn) => fn());
const setState = (patch) => { state = { ...state, ...patch }; emit(); };

const beep = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = audioCtx || new Ctx();
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.65, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // sin soporte de audio, no rompe nada
  }
};

// Desbloquea el audio en iPhone: tiene que crearse dentro de un toque del usuario.
const unlockAudio = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = audioCtx || new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) { /* noop */ }
};

const stopInterval = () => {
  if (interval) clearInterval(interval);
  interval = null;
};

const clearFinished = () => {
  if (finishedTimeout) clearTimeout(finishedTimeout);
  finishedTimeout = null;
};

const tick = () => {
  const left = Math.ceil((endsAt - Date.now()) / 1000);
  if (left <= 0) {
    stopInterval();
    setState({ remaining: 0, running: false, justFinished: true });
    beep();
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    clearFinished();
    finishedTimeout = setTimeout(() => setState({ justFinished: false, remaining: state.running ? state.remaining : state.lastPreset }), FINISHED_NOTICE_MS);
    return;
  }
  if (left !== state.remaining) setState({ remaining: left });
};

const run = () => {
  stopInterval();
  endsAt = Date.now() + state.remaining * 1000;
  interval = setInterval(tick, 250);
};

export const restTimer = {
  get: () => state,
  subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  setPreset: (s) => {
    stopInterval();
    try { localStorage.setItem(PRESET_STORAGE, String(s)); } catch (e) { /* noop */ }
    setState({ running: false, remaining: s, lastPreset: s });
  },
  adjust: (delta) => {
    const next = Math.max(0, state.remaining + delta);
    if (state.running) endsAt += (next - state.remaining) * 1000;
    setState({ remaining: next });
  },
  toggle: () => {
    unlockAudio();
    if (state.running) {
      stopInterval();
      setState({ running: false });
      return;
    }
    clearFinished();
    setState({ running: true, justFinished: false, remaining: state.remaining <= 0 ? state.lastPreset : state.remaining });
    run();
  },
  reset: () => { stopInterval(); setState({ running: false, remaining: state.lastPreset }); },
  // Arranca un descanso nuevo con el último tiempo elegido (al completar una serie).
  start: () => {
    unlockAudio();
    clearFinished();
    setState({ running: true, remaining: state.lastPreset, justFinished: false });
    run();
  },
  stop: () => { stopInterval(); clearFinished(); setState({ running: false, justFinished: false, remaining: state.lastPreset }); },
};

export const useRestTimer = () => useSyncExternalStore(restTimer.subscribe, restTimer.get, restTimer.get);

export const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
