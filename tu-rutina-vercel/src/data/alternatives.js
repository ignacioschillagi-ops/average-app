// Cambio rápido de ejercicio, sin IA: cada ejercicio conocido pertenece a un "patrón de
// movimiento" (empuje horizontal, sentadilla, remo...). Los equivalentes son los otros
// ejercicios del mismo patrón, filtrados según el motivo:
//   - 'busy' (máquina ocupada): solo cosas de gimnasio (barra, mancuernas, máquinas, poleas...).
//   - 'home' (estoy en casa): solo peso corporal, objetos de casa o banda elástica.
// La lista está en data/exercise-library.js (con equipo y traducciones).

import { canonicalExerciseName, normalizeText } from '../i18n-content';
import { LIBRARY, GYM_EQUIPMENT, HOME_EQUIPMENT } from './exercise-library';

const PATTERNS = (() => {
  const map = {};
  LIBRARY.forEach(([es, , , equipment, patterns]) => {
    (Array.isArray(patterns) ? patterns : [patterns]).forEach((pattern) => {
      (map[pattern] = map[pattern] || []).push([es, equipment]);
    });
  });
  return map;
})();

// Ejercicios de las plantillas que no están arriba con ese nombre exacto (combinados o
// variantes), y a qué patrón corresponden.
const EXTRA_MEMBERS = {
  'Dominadas lastradas o estrictas': 'verticalPull',
  'Dominadas (o negativas)': 'verticalPull',
  'Remo con barra o mancuerna': 'row',
  'Face pulls o pájaros': 'rearDelt',
  'Curl bíceps (barra o mancuernas)': 'biceps',
  'Curl bíceps (barra + martillo)': 'biceps',
  'Curl bíceps + extensión tríceps': 'biceps',
  'Curl bíceps + tríceps polea': 'biceps',
  'Curl martillo + fondos': 'biceps',
  'Prensa de piernas o sentadilla frontal': 'squat',
  'Press inclinado mancuernas': 'chestPress',
  'Press inclinado mancuerna': 'chestPress',
  'Elevaciones laterales + frontales': 'lateralRaise',
  'Extensión de tríceps con cuerda o fondos': 'triceps',
  'Tríceps cuerda + fondos': 'triceps',
  'Flexiones pike (hombro)': 'shoulderPress',
  'Core: Crunch bici + plancha lateral': 'core',
  'Core (elevaciones + oblicuos polea)': 'core',
  'Core: plancha + bici': 'core',
  'Plancha + Ab Wheel': 'core',
  'Gemelos': 'calves',
  'Sentadilla salto': 'conditioning',
  'Flexiones (rodillas si hace falta)': 'chestPress',
  'Hip Thrust': 'hinge',
};

// Para ejercicios escritos a mano (o que armó Joe's) que no están en la lista: palabras
// clave en los 3 idiomas. El orden importa (lo más específico primero).
const KEYWORDS = [
  [/curl femoral|leg curl|femoral|hamstring|nordic|nordico/, 'hamstrings'],
  [/extension de cuadriceps|leg extension|cuadricep|quadricip/, 'quads'],
  [/peso muerto|deadlift|stacco|hip thrust|puente de glut|glute bridge|ponte glutei|good morning/, 'hinge'],
  [/sentadilla|squat|prensa|leg press/, 'squat'],
  [/zancada|lunge|affond|step.?up/, 'lunge'],
  [/gemelo|pantorrilla|calf|polpacc|talon/, 'calves'],
  [/apertura|cruce|fly|flye|croci|pec deck|crossover/, 'chestFly'],
  [/press banca|bench|panca|press de pecho|chest press|flexion|push.?up|piegament/, 'chestPress'],
  [/militar|overhead|lento avanti|shoulder press|press de hombro|arnold/, 'shoulderPress'],
  [/lateral/, 'lateralRaise'],
  [/face pull|pajaro|rear delt|posterior|reverse fly|alzate posteriori/, 'rearDelt'],
  [/dominada|pull.?up|chin.?up|trazion|jalon|pulldown|lat machine|dorsal/, 'verticalPull'],
  [/remo|row|rematore|pulley/, 'row'],
  [/triceps|tricipit|frances|french|skull|fondo|dip|pushdown/, 'triceps'],
  [/curl|bicep|bicipit/, 'biceps'],
  [/encogimiento|shrug|scrollat/, 'shrugs'],
  [/abductor|aductor|abduction|adduction|abdutt|addutt/, 'hipAbduction'],
  [/plancha|plank|crunch|abdominal|core|ab wheel|elevacion de piernas|leg raise/, 'core'],
  [/burpee|escalador|mountain climber|jumping jack|soga|rope|corda/, 'conditioning'],
];

const PATTERN_OF = (() => {
  const map = {};
  Object.entries(PATTERNS).forEach(([pattern, list]) => {
    list.forEach(([name]) => {
      const key = normalizeText(name);
      if (!map[key]) map[key] = pattern;
    });
  });
  Object.entries(EXTRA_MEMBERS).forEach(([name, pattern]) => { map[normalizeText(name)] = pattern; });
  return map;
})();

export const movementPatternOf = (name) => {
  const canonical = canonicalExerciseName(name);
  const fromList = PATTERN_OF[normalizeText(canonical || name)];
  if (fromList) return fromList;
  const text = normalizeText(name);
  const hit = KEYWORDS.find(([re]) => re.test(text));
  return hit ? hit[1] : null;
};

// Nombres distintos para el mismo ejercicio: no se sugieren entre sí ni aparecen dos veces.
const SAME_EXERCISE = [
  ['Press banca barra', 'Press banca plano'],
  ['Curl bíceps barra', 'Curl barra'],
  ['Curl femoral', 'Curl femoral en máquina'],
  ['Plancha', 'Plancha frontal'],
  ['Zancadas', 'Zancadas alternadas'],
].map((group) => group.map(normalizeText));
const sameGroupOf = (key) => SAME_EXERCISE.find((g) => g.includes(key)) || [key];

const equipmentOf = (name) => {
  const key = normalizeText(canonicalExerciseName(name) || name);
  const row = LIBRARY.find((r) => normalizeText(r[0]) === key);
  return row ? row[3] : null;
};

// Devuelve [{ name (español), equipment }] para mostrar como equivalentes.
// Con "máquina ocupada" van primero los de otro tipo de equipo (si la máquina está ocupada,
// otra máquina igual capaz también).
export const alternativesFor = (name, reason) => {
  const pattern = movementPatternOf(name);
  if (!pattern) return [];
  const allowed = reason === 'home' ? HOME_EQUIPMENT : GYM_EQUIPMENT;
  const self = normalizeText(canonicalExerciseName(name) || name);
  const own = equipmentOf(name);
  const seen = new Set(sameGroupOf(self));
  const list = PATTERNS[pattern]
    .filter(([altName, equipment]) => {
      const key = normalizeText(altName);
      if (seen.has(key)) return false;
      sameGroupOf(key).forEach((k) => seen.add(k));
      return allowed.includes(equipment);
    })
    .map(([altName, equipment]) => ({ name: altName, equipment }));
  if (reason !== 'home' && own) {
    return [...list.filter((a) => a.equipment !== own), ...list.filter((a) => a.equipment === own)];
  }
  return list;
};
