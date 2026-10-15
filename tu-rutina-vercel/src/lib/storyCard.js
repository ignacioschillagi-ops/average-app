// Tarjeta para historias de Instagram (1080×1920) al terminar un día, dibujada en un canvas
// con los colores de la app, el logo y la frase de Joe's.

const W = 1080;
const H = 1920;
const COLORS = {
  bg: '#17181B',
  card: '#1C1D20',
  line: '#2A2B2F',
  ink: '#EDEAE3',
  ink2: '#B0AFA9',
  muted: '#8E8D88',
  red: '#C24747',
  green: '#6FAE7A',
};

const loadImage = (src) => new Promise((resolve) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => resolve(null);
  img.src = src;
});

const ensureFonts = async () => {
  try {
    await Promise.all([
      document.fonts.load('700 100px Oswald'),
      document.fonts.load('600 60px Oswald'),
      document.fonts.load('500 40px Inter'),
      document.fonts.load('italic 400 40px Inter'),
    ]);
  } catch (e) { /* si no cargan, se usa la fuente del sistema */ }
};

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const wrapLines = (ctx, text, maxWidth, maxLines) => {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  words.forEach((w) => {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].replace(/\s+\S*$/, '')}…`;
    return kept;
  }
  return lines;
};

const fitText = (ctx, text, maxWidth) => {
  let t = String(text || '');
  if (ctx.measureText(t).width <= maxWidth) return t;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
};

// Fondo con los mismos brillos suaves que la app.
const paintBackground = (ctx) => {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);
  let g = ctx.createRadialGradient(160, 0, 0, 160, 0, 900);
  g.addColorStop(0, 'rgba(179,58,58,0.30)');
  g.addColorStop(1, 'rgba(179,58,58,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  g = ctx.createRadialGradient(W - 120, H, 0, W - 120, H, 1000);
  g.addColorStop(0, 'rgba(78,122,140,0.24)');
  g.addColorStop(1, 'rgba(78,122,140,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
};

const drawStats = (ctx, stats, y, boxH = 200) => {
  const list = (stats || []).slice(0, 3);
  if (!list.length) return y;
  const gap = 28;
  const bw = (W - 160 - gap * (list.length - 1)) / list.length;
  ctx.textAlign = 'center';
  list.forEach((st, i) => {
    const x = 80 + i * (bw + gap);
    roundRect(ctx, x, y, bw, boxH, 28);
    ctx.fillStyle = 'rgba(28,29,32,0.92)';
    ctx.fill();
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = COLORS.ink;
    // El número se achica (hasta un 60 %) antes de cortarse, para que "1 h 05 min" entre entero.
    let size = Math.round(boxH * 0.33);
    const minSize = Math.round(size * 0.6);
    ctx.font = `600 ${size}px Oswald, Impact, sans-serif`;
    while (size > minSize && ctx.measureText(String(st.value)).width > bw - 30) {
      size -= 2;
      ctx.font = `600 ${size}px Oswald, Impact, sans-serif`;
    }
    ctx.fillText(fitText(ctx, st.value, bw - 30), x + bw / 2, y + boxH * 0.5);
    ctx.fillStyle = COLORS.muted;
    ctx.font = `500 ${Math.round(boxH * 0.16)}px Inter, Helvetica, sans-serif`;
    ctx.fillText(fitText(ctx, st.label, bw - 30), x + bw / 2, y + boxH * 0.79);
  });
  return y + boxH;
};

const drawFooter = (ctx, opts) => {
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.red;
  ctx.font = '600 56px Oswald, Impact, sans-serif';
  ctx.fillText(opts.handle || '@YoSoyJoe', W / 2, H - 170);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '500 34px Inter, Helvetica, sans-serif';
  if (opts.footer) ctx.fillText(fitText(ctx, opts.footer, W - 160), W / 2, H - 110);
};

const toBlob = (canvas) => new Promise((resolve, reject) => {
  try {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('blob'))), 'image/png');
  } catch (e) {
    reject(e);
  }
});

/**
 * opts: { logoSrc, headline, tag, subtitle, date, stats: [{ value, label }],
 *         exercises: [{ name, done, detail }], phrase, handle, footer }
 */
export const drawStoryCard = async (opts) => {
  await ensureFonts();
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  paintBackground(ctx);

  let y = 150;
  const logo = opts.logoSrc ? await loadImage(opts.logoSrc) : null;
  if (logo) {
    const lw = 400;
    const lh = (logo.height / logo.width) * lw || 285;
    ctx.drawImage(logo, (W - lw) / 2, y, lw, lh);
    y += lh + 70;
  } else {
    y += 120;
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.ink;
  ctx.font = '700 104px Oswald, Impact, sans-serif';
  wrapLines(ctx, String(opts.headline || '').toUpperCase(), W - 140, 2).forEach((l) => {
    ctx.fillText(l, W / 2, y + 90);
    y += 112;
  });
  y += 36;

  if (opts.tag) {
    ctx.font = '600 50px Oswald, Impact, sans-serif';
    const tag = fitText(ctx, String(opts.tag).toUpperCase(), W - 260);
    const tw = ctx.measureText(tag).width + 70;
    roundRect(ctx, (W - tw) / 2, y, tw, 84, 42);
    ctx.fillStyle = 'rgba(194,71,71,0.22)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(194,71,71,0.75)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = COLORS.ink;
    ctx.fillText(tag, W / 2, y + 60);
    y += 120;
  }

  ctx.font = '500 40px Inter, Helvetica, sans-serif';
  ctx.fillStyle = COLORS.ink2;
  if (opts.subtitle) { ctx.fillText(fitText(ctx, opts.subtitle, W - 160), W / 2, y + 30); y += 56; }
  ctx.fillStyle = COLORS.muted;
  if (opts.date) { ctx.fillText(fitText(ctx, opts.date, W - 160), W / 2, y + 30); y += 56; }
  y += 40;

  // Estadísticas
  if ((opts.stats || []).length) y = drawStats(ctx, opts.stats, y) + 50;

  // La frase va anclada arriba del pie; los ejercicios ocupan el espacio que queda.
  const footerTop = H - 250;
  ctx.font = 'italic 400 46px Inter, Helvetica, sans-serif';
  const phraseLines = opts.phrase ? wrapLines(ctx, `“${opts.phrase}”`, W - 200, 3) : [];
  const phraseTop = footerTop - phraseLines.length * 62 - 30;
  const maxRows = Math.max(0, Math.floor((phraseTop - 50 - y) / 64));
  const all = opts.exercises || [];
  const exercises = all.length > maxRows ? all.slice(0, Math.max(0, maxRows - 1)) : all;
  ctx.textAlign = 'left';
  exercises.forEach((e) => {
    ctx.font = '700 40px Inter, Helvetica, sans-serif';
    ctx.fillStyle = e.done ? COLORS.green : COLORS.muted;
    ctx.fillText(e.done ? '✓' : '–', 110, y + 40);
    ctx.font = '500 40px Inter, Helvetica, sans-serif';
    ctx.fillStyle = e.done ? COLORS.ink : COLORS.muted;
    const detailW = e.detail ? Math.min(330, ctx.measureText(e.detail).width) : 0;
    ctx.fillText(fitText(ctx, e.name, W - 280 - detailW), 170, y + 40);
    if (e.detail) {
      ctx.textAlign = 'right';
      ctx.fillStyle = COLORS.ink2;
      ctx.fillText(fitText(ctx, e.detail, 330), W - 100, y + 40);
      ctx.textAlign = 'left';
    }
    y += 64;
  });
  if (all.length > exercises.length) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = '500 34px Inter, Helvetica, sans-serif';
    ctx.fillText(`+${all.length - exercises.length}`, 170, y + 34);
    y += 54;
  }

  // Frase de Joe's
  if (phraseLines.length) {
    let py = Math.max(y + 30, phraseTop);
    ctx.textAlign = 'center';
    ctx.font = 'italic 400 46px Inter, Helvetica, sans-serif';
    ctx.fillStyle = COLORS.ink;
    phraseLines.forEach((l) => { ctx.fillText(l, W / 2, py + 46); py += 62; });
  }

  drawFooter(ctx, opts);

  return toBlob(canvas);
};

/**
 * Plantilla "Detalle": sin frase ni nombre de rutina; enumera todos los ejercicios hechos con
 * sus series y pesos (o el objetivo, si no se anotaron series). Achica la letra para que entren.
 * opts: { logoSrc, headline, subtitle, stats, exercises: [{ name, detail, muted }], handle, footer }
 */
export const drawDetailCard = async (opts) => {
  await ensureFonts();
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  paintBackground(ctx);

  let y = 110;
  const logo = opts.logoSrc ? await loadImage(opts.logoSrc) : null;
  if (logo) {
    const lw = 250;
    const lh = (logo.height / logo.width) * lw || 178;
    ctx.drawImage(logo, (W - lw) / 2, y, lw, lh);
    y += lh + 40;
  } else {
    y += 60;
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.ink;
  ctx.font = '700 92px Oswald, Impact, sans-serif';
  wrapLines(ctx, String(opts.headline || '').toUpperCase(), W - 140, 2).forEach((l) => {
    ctx.fillText(l, W / 2, y + 80);
    y += 100;
  });
  ctx.font = '500 38px Inter, Helvetica, sans-serif';
  ctx.fillStyle = COLORS.muted;
  if (opts.subtitle) { ctx.fillText(fitText(ctx, opts.subtitle, W - 160), W / 2, y + 44); y += 66; }
  y += 34;
  if ((opts.stats || []).length) y = drawStats(ctx, opts.stats, y, 170) + 44;

  // Línea divisoria
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, y);
  ctx.lineTo(W - 100, y);
  ctx.stroke();
  y += 36;

  const footerTop = H - 250;
  const listTop = y;
  const listH = footerTop - listTop;
  const textX = 168;
  const maxW = W - textX - 100;
  const all = opts.exercises || [];

  // Busca la escala más grande en la que entra todo.
  const layoutAt = (s) => {
    const nameSize = Math.round(46 * s);
    const detailSize = Math.round(36 * s);
    const gap = Math.round(30 * s);
    const items = all.map((e) => {
      ctx.font = `600 ${nameSize}px Inter, Helvetica, sans-serif`;
      const nameLines = wrapLines(ctx, e.name, maxW, 2);
      ctx.font = `500 ${detailSize}px Inter, Helvetica, sans-serif`;
      const detailLines = e.detail ? wrapLines(ctx, e.detail, maxW, 3) : [];
      const h = nameLines.length * nameSize * 1.22 + detailLines.length * detailSize * 1.3 + (detailLines.length ? 6 : 0);
      return { e, nameLines, detailLines, h };
    });
    const total = items.reduce((acc, it) => acc + it.h, 0) + gap * Math.max(0, items.length - 1);
    return { s, nameSize, detailSize, gap, items, total };
  };
  // Con pocos ejercicios la letra crece un poco para llenar la tarjeta.
  let layout = layoutAt(1.2);
  for (let s = 1.15; layout.total > listH && s >= 0.5; s -= 0.05) layout = layoutAt(s);

  // Si ni así entra, se muestran los que entran y "+N".
  let items = layout.items;
  let hidden = 0;
  if (layout.total > listH) {
    let acc = 0;
    const room = listH - layout.detailSize * 1.6;
    const kept = [];
    for (const it of items) {
      if (acc + it.h > room) break;
      kept.push(it);
      acc += it.h + layout.gap;
    }
    hidden = items.length - kept.length;
    items = kept;
  }
  const used = items.reduce((acc, it) => acc + it.h, 0) + layout.gap * Math.max(0, items.length - 1);
  // Si sobra lugar, la lista queda un poco más abajo (centrada en el espacio libre, sin pasarse).
  let ly = listTop + Math.max(0, Math.min(140, (listH - used) / 3));

  ctx.textAlign = 'left';
  items.forEach((it) => {
    const { nameSize, detailSize } = layout;
    ctx.font = `700 ${nameSize}px Inter, Helvetica, sans-serif`;
    ctx.fillStyle = COLORS.green;
    ctx.fillText('✓', 100, ly + nameSize);
    ctx.font = `600 ${nameSize}px Inter, Helvetica, sans-serif`;
    ctx.fillStyle = COLORS.ink;
    it.nameLines.forEach((l) => { ctx.fillText(l, textX, ly + nameSize); ly += nameSize * 1.22; });
    if (it.detailLines.length) {
      ly += 6;
      ctx.font = `500 ${detailSize}px Inter, Helvetica, sans-serif`;
      ctx.fillStyle = it.e.muted ? COLORS.muted : COLORS.ink2;
      it.detailLines.forEach((l) => { ctx.fillText(l, textX, ly + detailSize); ly += detailSize * 1.3; });
    }
    ly += layout.gap;
  });
  if (hidden > 0) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = `500 ${layout.detailSize}px Inter, Helvetica, sans-serif`;
    ctx.fillText(`+${hidden}`, textX, ly + layout.detailSize);
  }

  drawFooter(ctx, opts);
  return toBlob(canvas);
};
