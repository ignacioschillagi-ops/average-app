// Cambio rápido de ejercicio, sin IA: cada ejercicio conocido pertenece a un "patrón de
// movimiento" (empuje horizontal, sentadilla, remo...). Los equivalentes son los otros
// ejercicios del mismo patrón, filtrados según el motivo:
//   - 'busy' (máquina ocupada): cualquier otro del patrón.
//   - 'home' (estoy en casa): solo peso corporal u objetos de casa.
// Los nombres van en español (la clave de i18n-content.js); se muestran traducidos.
// Para sumar un equivalente: agregalo acá con su equipo y su traducción en EXERCISES.

import { canonicalExerciseName, normalizeText } from '../i18n-content';

// Equipo: barbell (barra), dumbbell (mancuernas), machine (máquina), cable (polea),
// bar (barra fija o paralelas), bodyweight (peso corporal), home (objetos de casa).
const HOME_EQUIPMENT = ['bodyweight', 'home'];

const PATTERNS = {
  chestPress: [
    ['Press banca barra', 'barbell'], ['Press banca plano', 'barbell'], ['Press banca con mancuernas', 'dumbbell'],
    ['Press de pecho en máquina', 'machine'], ['Press inclinado con mancuernas', 'dumbbell'], ['Inclinado máquina', 'machine'],
    ['Press declinado', 'barbell'], ['Fondos en paralelas', 'bar'], ['Flexiones de pecho', 'bodyweight'],
    ['Flexiones con los pies elevados', 'bodyweight'], ['Flexiones con mochila cargada', 'home'],
  ],
  chestFly: [
    ['Aperturas en polea', 'cable'], ['Cruces en polea', 'cable'], ['Aperturas con mancuernas', 'dumbbell'],
    ['Pec deck', 'machine'], ['Flexiones abiertas', 'bodyweight'],
  ],
  shoulderPress: [
    ['Press militar barra', 'barbell'], ['Press militar mancuernas', 'dumbbell'], ['Militar máquina', 'machine'],
    ['Press Arnold', 'dumbbell'], ['Pike push-ups (hombro)', 'bodyweight'], ['Press de hombros con mochila', 'home'],
  ],
  lateralRaise: [
    ['Elevaciones laterales', 'dumbbell'], ['Elevaciones laterales en polea', 'cable'],
    ['Elevaciones laterales en máquina', 'machine'], ['Elevaciones laterales con botellas', 'home'],
  ],
  rearDelt: [
    ['Face pull', 'cable'], ['Elevaciones posteriores', 'dumbbell'], ['Pájaros en máquina', 'machine'],
    ['Y-T-W en el piso', 'bodyweight'],
  ],
  verticalPull: [
    ['Dominadas', 'bar'], ['Dominadas supinas', 'bar'], ['Jalón al pecho', 'cable'], ['Jalón con agarre neutro', 'cable'],
    ['Dorsalera libre', 'machine'], ['Pull-over', 'cable'], ['Remo invertido bajo la mesa', 'home'],
    ['Superman con jalón', 'bodyweight'],
  ],
  row: [
    ['Remo con barra', 'barbell'], ['Remo con mancuerna', 'dumbbell'], ['Remo en máquina', 'machine'],
    ['Remo en polea baja', 'cable'], ['Remo invertido en barra baja', 'bar'], ['Remo con mochila cargada', 'home'],
    ['Remo invertido bajo la mesa', 'home'],
  ],
  squat: [
    ['Sentadilla libre', 'barbell'], ['Sentadilla frontal', 'barbell'], ['Prensa de piernas', 'machine'],
    ['Sentadilla hack', 'machine'], ['Sentadilla goblet', 'dumbbell'], ['Sentadilla búlgara', 'dumbbell'],
    ['Sentadillas', 'bodyweight'], ['Sentadilla a una pierna asistida', 'bodyweight'], ['Sentadilla con mochila', 'home'],
  ],
  hinge: [
    ['Peso muerto convencional', 'barbell'], ['Peso muerto rumano', 'barbell'], ['Peso muerto sumo', 'barbell'],
    ['Peso muerto rumano con mancuernas', 'dumbbell'], ['Hip thrust', 'barbell'], ['Hiperextensiones', 'machine'],
    ['Puente de glúteo', 'bodyweight'], ['Peso muerto a una pierna', 'bodyweight'], ['Superman', 'bodyweight'],
    ['Peso muerto con mochila', 'home'],
  ],
  lunge: [
    ['Zancadas', 'bodyweight'], ['Zancadas caminando', 'bodyweight'], ['Zancadas alternadas', 'bodyweight'],
    ['Zancadas con mancuernas', 'dumbbell'], ['Sentadilla búlgara', 'dumbbell'], ['Subidas al cajón', 'home'],
  ],
  quads: [
    ['Extensión de cuádriceps', 'machine'], ['Prensa de piernas', 'machine'], ['Sentadilla sissy', 'bodyweight'],
    ['Sentadilla isométrica contra la pared', 'home'],
  ],
  hamstrings: [
    ['Curl femoral', 'machine'], ['Curl femoral en máquina', 'machine'], ['Peso muerto rumano', 'barbell'],
    ['Peso muerto rumano con mancuernas', 'dumbbell'], ['Curl nórdico', 'bodyweight'],
    ['Curl femoral con toalla en el piso', 'home'],
  ],
  calves: [
    ['Gemelos de pie', 'machine'], ['Gemelos sentado', 'machine'], ['Elevación de talones', 'bodyweight'],
    ['Gemelos a una pierna en escalón', 'home'],
  ],
  biceps: [
    ['Curl bíceps barra', 'barbell'], ['Curl barra', 'barbell'], ['Curl martillo', 'dumbbell'],
    ['Curl concentrado', 'dumbbell'], ['Curl en polea', 'cable'], ['Dominadas supinas', 'bar'], ['Curl con mochila', 'home'],
  ],
  triceps: [
    ['Extensión de tríceps en polea', 'cable'], ['Press francés', 'barbell'],
    ['Extensión de tríceps por encima de la cabeza', 'dumbbell'], ['Fondos en paralelas', 'bar'],
    ['Fondos en banco', 'bodyweight'], ['Flexiones diamante', 'bodyweight'], ['Fondos en silla', 'home'],
  ],
  core: [
    ['Plancha', 'bodyweight'], ['Plancha frontal', 'bodyweight'], ['Plancha lateral', 'bodyweight'],
    ['Crunch con cable', 'cable'], ['Elevación de piernas colgado', 'bar'], ['Elevación de piernas acostado', 'bodyweight'],
    ['Abdominales bicicleta', 'bodyweight'], ['Crunch en el piso', 'bodyweight'], ['Plancha con toque de hombro', 'bodyweight'],
  ],
  shrugs: [
    ['Encogimientos', 'barbell'], ['Encogimientos con mancuernas', 'dumbbell'], ['Encogimientos con mochila', 'home'],
  ],
  hipAbduction: [
    ['Abductores / aductores', 'machine'], ['Patada lateral acostado', 'bodyweight'], ['Caminata lateral con banda', 'home'],
  ],
  conditioning: [
    ['Burpees', 'bodyweight'], ['Escaladores (mountain climbers)', 'bodyweight'], ['Sentadilla salto', 'bodyweight'],
    ['Saltos de tijera', 'bodyweight'], ['Saltar la soga', 'home'],
  ],
};

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

// Devuelve [{ name (español), equipment }] para mostrar como equivalentes.
export const alternativesFor = (name, reason) => {
  const pattern = movementPatternOf(name);
  if (!pattern) return [];
  const self = normalizeText(canonicalExerciseName(name) || name);
  const seen = new Set([self]);
  return PATTERNS[pattern]
    .filter(([altName, equipment]) => {
      const key = normalizeText(altName);
      if (seen.has(key)) return false;
      seen.add(key);
      return reason === 'home' ? HOME_EQUIPMENT.includes(equipment) : true;
    })
    .map(([altName, equipment]) => ({ name: altName, equipment }));
};
