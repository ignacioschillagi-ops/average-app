// Consulta de ejercicios en la base pública de wger.de (sin API key), en el idioma elegido
// con inglés de respaldo. Los resultados se guardan en memoria mientras la app está abierta.
import { getLang } from '../i18n';
import { translateExerciseName } from '../i18n-content';

const WGER_ORIGIN = 'https://wger.de';
const WGER_API_BASE = `${WGER_ORIGIN}/api/v2/`;
// Ids de idioma de wger, por si la respuesta no trae el código.
const WGER_LANGUAGE_IDS = { es: 4, en: 2, it: 13 };
const cache = new Map();

export const wgerSearchUrl = () => `${WGER_ORIGIN}/${getLang()}/exercise/overview/`;

const stripHtmlTags = (html) => (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const absolute = (url) => (!url ? null : /^https?:/.test(url) ? url : `${WGER_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`);

// Devuelve null si no encuentra nada; tira error si falla la conexión.
export const searchWgerExercise = async (query) => {
  const lang = getLang();
  const cacheKey = `${lang}:${query.toLowerCase()}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const languages = lang === 'en' ? 'en' : `${lang},en`;
  const searchRes = await fetch(`${WGER_API_BASE}exercise/search/?term=${encodeURIComponent(query)}&language=${languages}&format=json`);
  if (!searchRes.ok) throw new Error(`busqueda ${searchRes.status}`);
  const searchJson = await searchRes.json();
  const suggestions = searchJson.suggestions || [];
  if (suggestions.length === 0) { cache.set(cacheKey, null); return null; }
  const best = suggestions[0].data || suggestions[0];
  const baseId = best.base_id || best.id;
  const fallback = {
    name: best.name || query, description: '', category: best.category || '', muscles: [], equipment: [],
    images: [absolute(best.image)].filter(Boolean),
  };
  if (!baseId) { cache.set(cacheKey, fallback); return fallback; }

  try {
    const infoRes = await fetch(`${WGER_API_BASE}exerciseinfo/${baseId}/?format=json`);
    if (!infoRes.ok) return fallback;
    const info = await infoRes.json();
    const translations = info.translations || [];
    const translation = translations.find((x) => x.language_code === lang || x.language === WGER_LANGUAGE_IDS[lang])
      || translations.find((x) => x.language_code === 'en' || x.language === WGER_LANGUAGE_IDS.en)
      || translations[0] || {};
    const images = (info.images || []).map((img) => absolute(img.image)).filter(Boolean);
    const result = {
      name: translation.name || fallback.name,
      description: stripHtmlTags(translation.description),
      category: (info.category && info.category.name) || fallback.category,
      muscles: (info.muscles || []).map((m) => m.name_en || m.name).filter(Boolean),
      equipment: (info.equipment || []).map((e) => e.name).filter(Boolean),
      images: images.length ? images : fallback.images,
    };
    cache.set(cacheKey, result);
    return result;
  } catch (e) {
    return fallback;
  }
};

// Para la ficha de un ejercicio de la rutina: prueba con el nombre en el idioma elegido y,
// si no aparece, con el nombre en inglés (wger tiene muchos más ejercicios en inglés).
export const lookupExerciseInfo = async (name) => {
  const first = await searchWgerExercise(name);
  if (first) return first;
  const english = translateExerciseName(name, 'en');
  if (english && english.toLowerCase() !== name.toLowerCase()) return searchWgerExercise(english);
  return null;
};
