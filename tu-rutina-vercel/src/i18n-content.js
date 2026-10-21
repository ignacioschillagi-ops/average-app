// Contenido traducible que no es "texto de pantalla": ejercicios, etiquetas de días,
// frases, objetivos, días de la semana, meses y plantillas.
//
// Las rutinas guardadas se traducen al cambiar de idioma (translateRoutineData): los
// ejercicios y etiquetas que están en estas listas pasan al idioma nuevo; los que la persona
// escribió a mano y no están acá quedan como estaban.
//
// Los días de la semana se guardan SIEMPRE en español ('Lunes', 'Martes'...) como clave
// interna, y se muestran traducidos con weekdayLabel().

import { LIBRARY } from './data/exercise-library';

export const LANG_CODES = ['es', 'en', 'it'];
const COL = { es: 0, en: 1, it: 2 };

// ---------- Días, meses ----------

export const WEEKDAY_KEYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const WEEKDAY_NAMES = {
  es: WEEKDAY_KEYS,
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  it: ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'],
};
export const WEEKDAY_INITIALS = {
  es: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  it: ['L', 'M', 'M', 'G', 'V', 'S', 'D'],
};
export const MONTH_NAMES = {
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  it: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
};

// Saca tildes y pasa a minúsculas, para comparar nombres sin importar cómo estén escritos.
export const normalizeText = (s) => String(s || '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim();

const WEEKDAY_ALIASES = (() => {
  const map = {};
  WEEKDAY_KEYS.forEach((key, i) => {
    LANG_CODES.forEach((lang) => {
      const name = normalizeText(WEEKDAY_NAMES[lang][i]);
      map[name] = key;
      map[name.slice(0, 3)] = map[name.slice(0, 3)] || key;
    });
  });
  return map;
})();

// Acepta un día en cualquiera de los 3 idiomas (con o sin tilde, o abreviado) y devuelve la
// clave interna en español, o null si no lo reconoce.
export const normalizeWeekday = (name) => WEEKDAY_ALIASES[normalizeText(name)] || null;

export const weekdayLabel = (key, lang) => {
  const idx = WEEKDAY_KEYS.indexOf(key);
  if (idx === -1) {
    const normalized = normalizeWeekday(key);
    return normalized ? WEEKDAY_NAMES[lang][WEEKDAY_KEYS.indexOf(normalized)] : key;
  }
  return (WEEKDAY_NAMES[lang] || WEEKDAY_NAMES.es)[idx];
};

// ---------- Objetivos del perfil ----------
// Se guarda la versión en español (clave) y se muestra traducida.

export const GOAL_KEYS = ['Ganar masa muscular', 'Perder grasa', 'Mantenimiento', 'Fuerza', 'Resistencia / cardio', 'Salud general'];
const GOAL_NAMES = {
  es: GOAL_KEYS,
  en: ['Build muscle', 'Lose fat', 'Maintenance', 'Strength', 'Endurance / cardio', 'General health'],
  it: ['Massa muscolare', 'Perdere grasso', 'Mantenimento', 'Forza', 'Resistenza / cardio', 'Salute generale'],
};
export const goalLabel = (key, lang) => {
  const idx = GOAL_KEYS.indexOf(key);
  return idx === -1 ? key : (GOAL_NAMES[lang] || GOAL_NAMES.es)[idx];
};

// ---------- Frases al completar un día ----------

export const MOTIVATIONAL_PHRASES = {
  es: [
    'Entrenamiento completo. Bien ahí.',
    'Día liquidado. Andá a bañarte con orgullo.',
    'Otro día tachado. La birrita te espera, te la ganaste.',
    'Ahora sí, a comer como corresponde. Todo al músculo.',
    'Yeah Buddy! Ronnie y el Diego están orgullosos de vos.',
    'Bien ahí, campeón, titán, ídolo, mostro, animal, hijo de Zeus, Messi...',
    'Día hecho. Ahora no te olvides de la prote.',
    'Entrenamiento terminado, y ese olor se empieza a sentir.',
    'Ese chivo sí se puede ver. Andá a bañarte nomás...',
    'Completaste todo, esas patas de pollo te lo agradecen.',
    '¡Día ganado! Ya estás disimulando esa cara de caricatura.',
    'Rutina cerrada por hoy. Ya sos menos desgarbado que ayer.',
    'Lista completa. No hiciste más que cumplir con tu tarea.',
  ],
  en: [
    'Workout complete. Nice one.',
    'Day crushed. Go hit the shower with pride.',
    'Another day crossed off. That cold beer is waiting, you earned it.',
    'Now go eat like you mean it. All of it straight to the muscles.',
    'Yeah Buddy! Ronnie and Arnold are proud of you.',
    'Way to go, champ, titan, legend, beast, son of Zeus, GOAT...',
    "Day done. Now don't forget your protein shake.",
    'Workout over, and that smell is starting to kick in.',
    'That sweat is visible from space. Just go shower...',
    'All done. Those chicken legs say thanks.',
    "Day won! You're already hiding that cartoon face.",
    "Routine closed for today. You're already less scrawny than yesterday.",
    'List complete. You just did what you were supposed to do.',
  ],
  it: [
    'Allenamento completato. Grande.',
    'Giornata archiviata. Vai a farti la doccia a testa alta.',
    'Un altro giorno spuntato. La birretta ti aspetta, te la sei guadagnata.',
    'Adesso sì, a mangiare come si deve. Tutto nei muscoli.',
    'Yeah Buddy! Ronnie e Maradona sono fieri di te.',
    'Grande, campione, titano, idolo, mostro, bestia, figlio di Zeus, fenomeno...',
    'Giornata fatta. Ora non dimenticarti le proteine.',
    "Allenamento finito, e quell'odore comincia a farsi sentire.",
    'Quel sudore si vede da qui. Vai a farti la doccia, dai...',
    'Hai completato tutto, quelle gambe da pollo ti ringraziano.',
    'Giornata vinta! Quella faccia da caricatura ormai passa quasi inosservata.',
    'Scheda chiusa per oggi. Sei già meno smilzo di ieri.',
    'Lista completata. Hai solo fatto il tuo dovere.',
  ],
};

// Frases que se cambiaron: si alguien las tenía guardadas en un día completado, se muestran
// con la versión nueva.
const RETIRED_PHRASES = {
  'Otro día tachado. El porrito te espera, te lo ganaste.': 2,
  'Another day crossed off. That post-workout joint is waiting, you earned it.': 2,
  'Un altro giorno spuntato. La canna ti aspetta, te la sei guadagnata.': 2,
  '¡Día ganado! Ya estás disimulando esa cara de artesanía prehispánica.': 10,
  "Day won! You're almost making up for that face.": 10,
  'Giornata vinta! Quella faccia ormai passa quasi inosservata.': 10,
};

export const phraseLabel = (phrase, lang) => {
  for (const code of LANG_CODES) {
    const idx = MOTIVATIONAL_PHRASES[code].indexOf(phrase);
    if (idx !== -1) return MOTIVATIONAL_PHRASES[lang][idx];
  }
  if (RETIRED_PHRASES[phrase] !== undefined) return MOTIVATIONAL_PHRASES[lang][RETIRED_PHRASES[phrase]];
  return phrase;
};

// ---------- Ejercicios ----------
// [español, inglés, italiano]. Para sumar uno nuevo, alcanza con agregar una fila.

const EXERCISES = [
  ['Sentadilla libre', 'Back squat', 'Squat con bilanciere'],
  ['Press banca barra', 'Barbell bench press', 'Panca piana con bilanciere'],
  ['Peso muerto convencional', 'Conventional deadlift', 'Stacco da terra classico'],
  ['Dominadas lastradas o estrictas', 'Weighted or strict pull-ups', 'Trazioni zavorrate o rigorose'],
  ['Press militar barra', 'Barbell overhead press', 'Lento avanti con bilanciere'],
  ['Plancha + Ab Wheel', 'Plank + ab wheel', 'Plank + ab wheel'],
  ['Peso muerto rumano', 'Romanian deadlift', 'Stacco rumeno'],
  ['Remo con barra o mancuerna', 'Barbell or dumbbell row', 'Rematore con bilanciere o manubrio'],
  ['Hip Thrust', 'Hip thrust', 'Hip thrust'],
  ['Face pulls o pájaros', 'Face pulls or reverse flyes', 'Face pull o alzate posteriori'],
  ['Curl femoral en máquina', 'Machine leg curl', 'Leg curl alla macchina'],
  ['Crunch con cable', 'Cable crunch', 'Crunch ai cavi'],
  ['Curl bíceps (barra o mancuernas)', 'Biceps curl (barbell or dumbbells)', 'Curl bicipiti (bilanciere o manubri)'],
  ['Prensa de piernas o sentadilla frontal', 'Leg press or front squat', 'Leg press o front squat'],
  ['Press inclinado con mancuernas', 'Incline dumbbell press', 'Panca inclinata con manubri'],
  ['Press inclinado mancuernas', 'Incline dumbbell press', 'Panca inclinata con manubri'],
  ['Press inclinado mancuerna', 'Incline dumbbell press', 'Panca inclinata con manubri'],
  ['Zancadas caminando', 'Walking lunges', 'Affondi camminati'],
  ['Elevaciones laterales + frontales', 'Lateral + front raises', 'Alzate laterali + frontali'],
  ['Extensión de cuádriceps', 'Leg extension', 'Leg extension'],
  ['Extensión de tríceps con cuerda o fondos', 'Rope triceps extension or dips', 'Estensioni tricipiti alla corda o dip'],
  ['Core: Crunch bici + plancha lateral', 'Core: bicycle crunch + side plank', 'Core: bicycle crunch + plank laterale'],
  ['Dorsalera libre', 'Plate-loaded lat pulldown', 'Lat machine a dischi'],
  ['Inclinado máquina', 'Machine incline press', 'Panca inclinata alla macchina'],
  ['Militar máquina', 'Machine shoulder press', 'Shoulder press alla macchina'],
  ['Curl bíceps (barra + martillo)', 'Biceps curl (barbell + hammer)', 'Curl bicipiti (bilanciere + martello)'],
  ['Tríceps cuerda + fondos', 'Rope triceps + dips', 'Tricipiti alla corda + dip'],
  ['Core (elevaciones + oblicuos polea)', 'Core (leg raises + cable obliques)', 'Core (sollevamento gambe + obliqui ai cavi)'],
  ['Press militar mancuernas', 'Dumbbell shoulder press', 'Lento avanti con manubri'],
  ['Fondos en paralelas', 'Parallel bar dips', 'Dip alle parallele'],
  ['Elevaciones laterales', 'Lateral raises', 'Alzate laterali'],
  ['Extensión de tríceps en polea', 'Cable triceps pushdown', 'Pushdown tricipiti ai cavi'],
  ['Dominadas', 'Pull-ups', 'Trazioni'],
  ['Remo con barra', 'Barbell row', 'Rematore con bilanciere'],
  ['Jalón al pecho', 'Lat pulldown', 'Lat machine'],
  ['Curl bíceps barra', 'Barbell biceps curl', 'Curl bicipiti con bilanciere'],
  ['Face pull', 'Face pull', 'Face pull'],
  ['Prensa de piernas', 'Leg press', 'Leg press'],
  ['Curl femoral', 'Leg curl', 'Leg curl'],
  ['Elevación de talones', 'Calf raises', 'Sollevamenti sui polpacci'],
  ['Curl bíceps + extensión tríceps', 'Biceps curl + triceps extension', 'Curl bicipiti + estensioni tricipiti'],
  ['Zancadas', 'Lunges', 'Affondi'],
  ['Gemelos de pie', 'Standing calf raises', 'Calf raise in piedi'],
  ['Gemelos sentado', 'Seated calf raises', 'Calf raise da seduto'],
  ['Gemelos', 'Calves', 'Polpacci'],
  ['Remo en máquina', 'Machine row', 'Rematore alla macchina'],
  ['Curl martillo + fondos', 'Hammer curl + dips', 'Curl a martello + dip'],
  ['Sentadilla búlgara', 'Bulgarian split squat', 'Squat bulgaro'],
  ['Peso muerto sumo', 'Sumo deadlift', 'Stacco sumo'],
  ['Abductores / aductores', 'Hip abduction / adduction', 'Abduttori / adduttori'],
  ['Core: plancha + bici', 'Core: plank + bicycle crunch', 'Core: plank + bicycle crunch'],
  ['Press banca plano', 'Flat bench press', 'Panca piana'],
  ['Aperturas en polea', 'Cable flyes', 'Croci ai cavi'],
  ['Press declinado', 'Decline bench press', 'Panca declinata'],
  ['Elevaciones posteriores', 'Rear delt raises', 'Alzate posteriori'],
  ['Press Arnold', 'Arnold press', 'Arnold press'],
  ['Encogimientos', 'Shrugs', 'Scrollate'],
  ['Curl barra', 'Barbell curl', 'Curl con bilanciere'],
  ['Curl martillo', 'Hammer curl', 'Curl a martello'],
  ['Press francés', 'Skull crushers', 'French press'],
  ['Curl concentrado', 'Concentration curl', 'Curl di concentrazione'],
  ['Fondos en banco', 'Bench dips', 'Dip su panca'],
  ['Plancha', 'Plank', 'Plank'],
  ['Curl bíceps + tríceps polea', 'Biceps curl + cable triceps', 'Curl bicipiti + tricipiti ai cavi'],
  ['Cruces en polea', 'Cable crossovers', 'Cable crossover'],
  ['Pull-over', 'Pullover', 'Pullover'],
  ['Sentadilla frontal', 'Front squat', 'Front squat'],
  ['Flexiones de pecho', 'Push-ups', 'Piegamenti sulle braccia'],
  ['Pike push-ups (hombro)', 'Pike push-ups (shoulders)', 'Pike push-up (spalle)'],
  ['Flexiones pike (hombro)', 'Pike push-ups (shoulders)', 'Pike push-up (spalle)'],
  ['Plancha frontal', 'Front plank', 'Plank frontale'],
  ['Dominadas (o negativas)', 'Pull-ups (or negatives)', 'Trazioni (o negative)'],
  ['Remo invertido en barra baja', 'Inverted row on a low bar', 'Rematore inverso alla sbarra bassa'],
  ['Dominadas supinas', 'Chin-ups', 'Trazioni supine'],
  ['Superman', 'Superman', 'Superman'],
  ['Sentadilla a una pierna asistida', 'Assisted single-leg squat', 'Squat a una gamba assistito'],
  ['Sentadilla salto', 'Jump squats', 'Squat jump'],
  ['Elevación de piernas colgado', 'Hanging leg raises', 'Sollevamento gambe alla sbarra'],
  ['Sentadillas', 'Squats', 'Squat a corpo libero'],
  ['Flexiones (rodillas si hace falta)', 'Push-ups (on your knees if needed)', 'Piegamenti (sulle ginocchia se serve)'],
  ['Puente de glúteo', 'Glute bridge', 'Ponte glutei'],
  ['Zancadas alternadas', 'Alternating lunges', 'Affondi alternati'],
  ['Remo con mochila cargada', 'Loaded backpack row', 'Rematore con zaino carico'],
  ['Abdominales bicicleta', 'Bicycle crunches', 'Bicycle crunch'],
  ['Burpees', 'Burpees', 'Burpees'],
  ['Escaladores (mountain climbers)', 'Mountain climbers', 'Mountain climber'],
  ['Plancha con toque de hombro', 'Plank shoulder taps', 'Plank con tocco spalla'],
  // Equivalentes para el cambio rápido de ejercicio (ver data/alternatives.js)
  ['Press banca con mancuernas', 'Dumbbell bench press', 'Panca piana con manubri'],
  ['Press de pecho en máquina', 'Machine chest press', 'Chest press alla macchina'],
  ['Flexiones con los pies elevados', 'Decline push-ups', 'Piegamenti con piedi rialzati'],
  ['Flexiones con mochila cargada', 'Weighted backpack push-ups', 'Piegamenti con zaino carico'],
  ['Aperturas con mancuernas', 'Dumbbell flyes', 'Croci con manubri'],
  ['Pec deck', 'Pec deck', 'Pectoral machine'],
  ['Flexiones abiertas', 'Wide push-ups', 'Piegamenti a presa larga'],
  ['Press de hombros con mochila', 'Backpack overhead press', 'Lento avanti con zaino'],
  ['Elevaciones laterales en polea', 'Cable lateral raises', 'Alzate laterali ai cavi'],
  ['Elevaciones laterales en máquina', 'Machine lateral raises', 'Alzate laterali alla macchina'],
  ['Elevaciones laterales con botellas', 'Lateral raises with water bottles', 'Alzate laterali con bottiglie'],
  ['Pájaros en máquina', 'Reverse pec deck', 'Reverse pec deck'],
  ['Y-T-W en el piso', 'Floor Y-T-W raises', 'Y-T-W a terra'],
  ['Jalón con agarre neutro', 'Neutral-grip lat pulldown', 'Lat machine presa neutra'],
  ['Superman con jalón', 'Superman pulls', 'Superman con tirata'],
  ['Remo invertido bajo la mesa', 'Under-table inverted row', 'Rematore inverso sotto il tavolo'],
  ['Remo con mancuerna', 'One-arm dumbbell row', 'Rematore con manubrio'],
  ['Remo en polea baja', 'Seated cable row', 'Pulley basso'],
  ['Sentadilla hack', 'Hack squat', 'Hack squat'],
  ['Sentadilla goblet', 'Goblet squat', 'Goblet squat'],
  ['Sentadilla con mochila', 'Backpack squat', 'Squat con zaino'],
  ['Peso muerto rumano con mancuernas', 'Dumbbell Romanian deadlift', 'Stacco rumeno con manubri'],
  ['Peso muerto a una pierna', 'Single-leg Romanian deadlift', 'Stacco rumeno a una gamba'],
  ['Peso muerto con mochila', 'Backpack deadlift', 'Stacco con zaino'],
  ['Hiperextensiones', 'Back extensions', 'Hyperextension'],
  ['Zancadas con mancuernas', 'Dumbbell lunges', 'Affondi con manubri'],
  ['Subidas al cajón', 'Step-ups', 'Step-up'],
  ['Sentadilla sissy', 'Sissy squat', 'Sissy squat'],
  ['Sentadilla isométrica contra la pared', 'Wall sit', 'Wall sit'],
  ['Curl nórdico', 'Nordic curl', 'Nordic curl'],
  ['Curl femoral con toalla en el piso', 'Towel slider leg curl', 'Leg curl con asciugamano'],
  ['Gemelos a una pierna en escalón', 'Single-leg calf raise on a step', 'Calf raise a una gamba sul gradino'],
  ['Curl en polea', 'Cable curl', 'Curl ai cavi'],
  ['Curl con mochila', 'Backpack curl', 'Curl con zaino'],
  ['Extensión de tríceps por encima de la cabeza', 'Overhead triceps extension', 'Estensioni tricipiti sopra la testa'],
  ['Flexiones diamante', 'Diamond push-ups', 'Piegamenti a diamante'],
  ['Fondos en silla', 'Chair dips', 'Dip sulla sedia'],
  ['Crunch en el piso', 'Floor crunches', 'Crunch a terra'],
  ['Elevación de piernas acostado', 'Lying leg raises', 'Sollevamento gambe da sdraiato'],
  ['Plancha lateral', 'Side plank', 'Plank laterale'],
  ['Encogimientos con mancuernas', 'Dumbbell shrugs', 'Scrollate con manubri'],
  ['Encogimientos con mochila', 'Backpack shrugs', 'Scrollate con zaino'],
  ['Patada lateral acostado', 'Side-lying leg raises', 'Slanci laterali da sdraiato'],
  ['Caminata lateral con banda', 'Banded lateral walk', 'Camminata laterale con elastico'],
  ['Saltos de tijera', 'Jumping jacks', 'Jumping jack'],
  ['Saltar la soga', 'Jump rope', 'Salto della corda'],
];

// Etiquetas de los días (qué se entrena).
const TAGS = [
  ['FUERZA', 'STRENGTH', 'FORZA'],
  ['POSTERIOR', 'POSTERIOR', 'POSTERIORE'],
  ['ANTERIOR', 'ANTERIOR', 'ANTERIORE'],
  ['MÁQUINAS', 'MACHINES', 'MACCHINE'],
  ['METABÓLICO', 'METABOLIC', 'METABOLICO'],
  ['COMODÍN', 'WILDCARD', 'JOLLY'],
  ['EMPUJE', 'PUSH', 'SPINTA'],
  ['TIRÓN', 'PULL', 'TIRATA'],
  ['PIERNAS', 'LEGS', 'GAMBE'],
  ['TORSO', 'UPPER', 'PARTE ALTA'],
  ['PIERNA', 'LOWER', 'PARTE BASSA'],
  ['PECHO', 'CHEST', 'PETTO'],
  ['ESPALDA', 'BACK', 'SCHIENA'],
  ['HOMBROS', 'SHOULDERS', 'SPALLE'],
  ['BRAZOS', 'ARMS', 'BRACCIA'],
  ['PECHO / ESPALDA', 'CHEST / BACK', 'PETTO / SCHIENA'],
  ['HOMBRO / BRAZO', 'SHOULDERS / ARMS', 'SPALLE / BRACCIA'],
  ['NUEVO', 'NEW', 'NUOVO'],
  ['ENTRENAMIENTO', 'WORKOUT', 'ALLENAMENTO'],
];

const buildLookup = (rows) => {
  const map = {};
  rows.forEach((row) => row.forEach((name) => {
    const key = normalizeText(name);
    if (!map[key]) map[key] = row;
  }));
  return map;
};
// Las de la biblioteca (cambio rápido) van después: si un nombre está en las dos, manda EXERCISES.
const LIBRARY_ROWS = LIBRARY.map((r) => r.slice(0, 3));
const EXERCISE_LOOKUP = buildLookup([...EXERCISES, ...LIBRARY_ROWS]);

// Nombres para sugerir mientras se escribe un ejercicio, en el idioma pedido (sin combinados
// ni variantes del mismo: "Press inclinado mancuernas" y "con mancuernas" son uno solo).
const SUGGESTION_CACHE = {};
export const exerciseSuggestions = (lang) => {
  if (SUGGESTION_CACHE[lang]) return SUGGESTION_CACHE[lang];
  const col = COL[lang] != null ? COL[lang] : 0;
  const seen = new Set();
  const out = [];
  [...EXERCISES, ...LIBRARY_ROWS].forEach((row) => {
    const name = row[col];
    const key = normalizeText(name);
    const same = normalizeText(row[1]);
    if (seen.has(key) || seen.has(`en:${same}`) || /\+|:/.test(name)) return;
    seen.add(key);
    seen.add(`en:${same}`);
    out.push(name);
  });
  SUGGESTION_CACHE[lang] = out;
  return out;
};
const TAG_LOOKUP = buildLookup(TAGS);

// Clave estable de un ejercicio, igual en los 3 idiomas: el nombre en español de la lista si
// es conocido, o el nombre escrito (sin tildes ni mayúsculas) si no. Sirve para guardar el
// historial de cargas sin que se pierda al cambiar de idioma.
export const exerciseKey = (name) => {
  const row = EXERCISE_LOOKUP[normalizeText(name)];
  return row ? normalizeText(row[0]) : normalizeText(name);
};
// Nombre en español de la lista (o null si no es un ejercicio conocido).
export const canonicalExerciseName = (name) => {
  const row = EXERCISE_LOOKUP[normalizeText(name)];
  return row ? row[0] : null;
};

export const translateExerciseName = (name, lang) => {
  const row = EXERCISE_LOOKUP[normalizeText(name)];
  return row ? row[COL[lang]] : name;
};

export const translateTag = (tag, lang) => {
  const row = TAG_LOOKUP[normalizeText(tag)];
  return row ? row[COL[lang]] : tag;
};

// Series: "3x12 c/pierna", "3x15 c/u", "3 series", "30s por lado"...
const SET_WORDS = [
  ['c/pierna', 'per leg', 'per gamba'],
  ['c/u', 'each', 'ciascuno'],
  ['por lado', 'per side', 'per lato'],
];
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
export const translateSets = (sets, lang) => {
  if (typeof sets !== 'string' || !sets) return sets;
  let out = sets;
  SET_WORDS.forEach((row) => {
    const re = new RegExp(`(^|\\s)(${row.map(escapeRe).join('|')})(?=$|\\s|[.,;)])`, 'gi');
    out = out.replace(re, (m, pre) => `${pre}${row[COL[lang]]}`);
  });
  out = out.replace(/(\d+)\s+(series|sets|serie)\b/gi, (m, n) => `${n} ${['series', 'sets', 'serie'][COL[lang]]}`);
  return out;
};

// ---------- Nombres de rutinas ----------

const VARIANT_WORD = { es: 'Rutina', en: 'Routine', it: 'Scheda' };
const COPY_WORD = { es: 'copia', en: 'copy', it: 'copia' };

export const defaultVariantName = (letter, lang) => `${VARIANT_WORD[lang]} ${letter}`;

export const translateVariantName = (name, lang) => {
  if (typeof name !== 'string') return name;
  let out = name;
  const copy = out.match(/^(.*) \((copia|copy)\)$/);
  if (copy) return `${translateVariantName(copy[1], lang)} (${COPY_WORD[lang]})`;
  const m = out.match(/^(Rutina|Routine|Scheda) ([A-Z])$/);
  if (m) out = defaultVariantName(m[2], lang);
  return out;
};

export const DEFAULT_TITLES = { es: 'Tu rutina', en: 'Your routine', it: 'La tua scheda' };
export const isDefaultTitle = (title) => !title || Object.values(DEFAULT_TITLES).includes(title);

// ---------- Plantillas ----------

export const TEMPLATE_TEXT = {
  fullbody4: {
    es: ['Full Body · 4 días', 'Fuerza, posterior, anterior y máquinas.'],
    en: ['Full Body · 4 days', 'Strength, posterior chain, anterior chain and machines.'],
    it: ['Full Body · 4 giorni', 'Forza, catena posteriore, catena anteriore e macchine.'],
  },
  ppl3: {
    es: ['Push / Pull / Legs · 3 días', 'El clásico de 3 días: empuje, tirón y pierna. Una sola variante.'],
    en: ['Push / Pull / Legs · 3 days', 'The 3-day classic: push, pull and legs. A single variant.'],
    it: ['Push / Pull / Legs · 3 giorni', 'Il classico da 3 giorni: spinta, tirata e gambe. Una sola variante.'],
  },
  upperlower4: {
    es: ['Torso / Pierna · 4 días', 'Dos días de torso y dos de pierna, alternando fuerza e hipertrofia.'],
    en: ['Upper / Lower · 4 days', 'Two upper-body days and two lower-body days, alternating strength and hypertrophy.'],
    it: ['Parte alta / Parte bassa · 4 giorni', 'Due giorni di parte alta e due di parte bassa, alternando forza e ipertrofia.'],
  },
  brosplit5: {
    es: ['Bro Split · 5 días', 'Un grupo muscular por día: pecho, espalda, hombros, piernas y brazos.'],
    en: ['Bro Split · 5 days', 'One muscle group per day: chest, back, shoulders, legs and arms.'],
    it: ['Bro Split · 5 giorni', 'Un gruppo muscolare al giorno: petto, schiena, spalle, gambe e braccia.'],
  },
  fullbody3: {
    es: ['Full Body · 3 días', 'Versión básica de cuerpo completo, ideal para empezar. Una sola variante.'],
    en: ['Full Body · 3 days', 'A basic full-body plan, ideal for getting started. A single variant.'],
    it: ['Full Body · 3 giorni', 'Versione base total body, ideale per iniziare. Una sola variante.'],
  },
  arnold6: {
    es: ['Arnold Split · 6 días', 'Pecho/Espalda, Hombro/Brazo y Pierna, dos vueltas por semana.'],
    en: ['Arnold Split · 6 days', 'Chest/Back, Shoulders/Arms and Legs, twice a week.'],
    it: ['Arnold Split · 6 giorni', 'Petto/Schiena, Spalle/Braccia e Gambe, due giri a settimana.'],
  },
  calistenia3: {
    es: ['Calistenia al aire libre · 3 días', 'Empuje, tirón y pierna usando barra, paralelas y tu propio peso.'],
    en: ['Outdoor calisthenics · 3 days', 'Push, pull and legs using a bar, parallel bars and your own bodyweight.'],
    it: ["Calisthenics all'aperto · 3 giorni", 'Spinta, tirata e gambe con sbarra, parallele e il tuo peso corporeo.'],
  },
  casa3: {
    es: ['En casa · 3 días', 'Full body con el propio peso y objetos simples de casa. Sin equipo de gimnasio.'],
    en: ['At home · 3 days', 'Full body with your own bodyweight and simple household items. No gym equipment.'],
    it: ['A casa · 3 giorni', 'Total body a corpo libero e con oggetti semplici di casa. Senza attrezzi da palestra.'],
  },
};

export const templateText = (id, lang) => {
  const entry = TEMPLATE_TEXT[id];
  if (!entry) return ['', ''];
  return entry[lang] || entry.es;
};

// ---------- Traducir datos guardados ----------

// Devuelve una copia de los datos con rutinas, ejercicios, etiquetas, frases e historial
// pasados al idioma pedido. Lo que no está en las listas de arriba queda igual.
export const translateRoutineData = (data, lang) => {
  if (!data) return data;
  const translateExerciseList = (list) => (list || []).map((e) => ({
    ...e,
    name: translateExerciseName(e.name, lang),
    sets: translateSets(e.sets, lang),
    ...(e.swappedFrom ? { swappedFrom: { ...e.swappedFrom, name: translateExerciseName(e.swappedFrom.name, lang) } } : {}),
  }));
  return {
    ...data,
    lang,
    title: isDefaultTitle(data.title) ? DEFAULT_TITLES[lang] : data.title,
    variants: (data.variants || []).map((v) => ({
      ...v,
      name: translateVariantName(v.name, lang),
      days: (v.days || []).map((d) => ({
        ...d,
        tagLabel: d.tagLabel ? translateTag(d.tagLabel, lang) : d.tagLabel,
        completionPhrase: d.completionPhrase ? phraseLabel(d.completionPhrase, lang) : d.completionPhrase,
        list: translateExerciseList(d.list),
      })),
    })),
    history: (data.history || []).map((h) => ({
      ...h,
      label: translateTag(h.label, lang),
      variantName: translateVariantName(h.variantName, lang),
      exercises: (h.exercises || []).map((e) => (typeof e === 'string'
        ? translateExerciseName(e, lang)
        : { ...e, name: translateExerciseName(e.name, lang), ...(e.target ? { target: translateSets(e.target, lang) } : {}) })),
    })),
  };
};
