# Average Joe's app

Proyecto Vite + React listo para deployar en Vercel.

## Qué se le cambió respecto al artifact de Claude

- **Almacenamiento**: el artifact usa `window.storage` (propio de Claude.ai). Acá lo reemplacé
  por un shim que usa `localStorage` del navegador (ver el objeto `storage` al inicio de
  `src/App.jsx`). La rutina vive en el dispositivo por defecto — para verla en más de uno,
  está el código de sincronización (ver más abajo).
- **Favicon y título**: ahora se definen en `index.html` (`public/favicon.svg`), no con el
  efecto dinámico que usaba el artifact.
- **Entrenador con IA (Joe's)**: funciona con una API key gratuita de **Groq** o de
  **Google Gemini**, la que cada persona prefiera pegar en la pestaña "Joe's". La app
  reconoce sola de cuál es por cómo empieza (`gsk_` = Groq, `AIza` = Gemini) y llama directo
  desde el navegador a ese servicio. La key se guarda en `localStorage` (y en el código de
  sincronización si se usa), nunca pasa por ningún servidor propio.
  **El modelo se elige solo**, para no tener que tocar código cada vez que estos servicios
  retiran modelos (como hizo Groq el 16/08/2026 con `llama-3.3-70b-versatile`, que fue lo
  que rompió el chat):
  - Groq usa `openai/gpt-oss-120b` y después `openai/gpt-oss-20b` (`GROQ_PREFERRED_MODELS`).
  - Gemini usa los alias `gemini-flash-lite-latest` y después `gemini-flash-latest`
    (`GEMINI_PREFERRED_MODELS`), que Google apunta solo a la versión más nueva.
  - Si el servicio dice que el modelo ya no existe, la app le pide la lista de modelos
    activos, elige el mejor, lo recuerda 7 días y reintenta sola. Si dice que se llegó al
    límite gratis de un modelo, prueba con el otro de la lista.
  - Si querés forzar un modelo puntual, ponelo primero en la lista correspondiente al
    principio de `src/App.jsx`.
- **Historial de entrenamientos**: cuando alguien tilda al menos la mitad de los ejercicios
  de un día (`MIN_DONE_RATIO` en `src/App.jsx`), se guarda un registro en `data.history` con
  la fecha, el día (ej. "FUERZA"), la rutina a la que pertenece, cuántos ejercicios hizo
  (ej. "4 de 6", cuáles sí y cuáles no) y el tiempo desde la primera casilla hasta la última.
  Si sigue tildando, el mismo registro se actualiza. Un ejercicio cuenta como hecho si se
  tildó o si tiene al menos una serie anotada. Se ve en un calendario mensual dentro de la
  pestaña **Progreso**. Viaja con el resto de los datos, así que también se sincroniza con
  el código.
  **Entrenamientos cargados después**: si alguien entrenó sin el teléfono, toca ese día en
  el calendario → "Cargar un entrenamiento de este día" (`src/components/ManualWorkoutSheet.jsx`).
  Elige qué día de la rutina hizo, cuánto duró más o menos (o "no me acuerdo"), destilda lo
  que no hizo y, si se acuerda, anota series y pesos. Queda con `manual: true` y la etiqueta
  "Cargado después": no tiene horarios medidos, cuenta para la semana y las series anotadas
  van a "la vez pasada", gráficos y récords. Si se borra la entrada, se borran esas series.
  Detalles: si desmarca casillas y baja de la mitad durante el mismo entrenamiento, el
  registro se quita (por si fue sin querer), pero desmarcar días después no borra nada viejo;
  si pasan más de 12 h desde que arrancó, lo que tilde cuenta como un entrenamiento nuevo; y
  duraciones de más de 5 h no se muestran porque seguramente fueron días distintos.
- **Idiomas (español, inglés e italiano)**: se elige desde Perfil (tarjeta "Idioma") o en
  la primera pantalla. La primera vez se usa el idioma del navegador si es uno de los tres
  (si no, español). El idioma se guarda con los datos (`data.lang`), así que también viaja
  con el código de sincronización. Al cambiarlo:
  - Todos los textos de la app cambian (`src/i18n.js`).
  - Las rutinas guardadas se traducen: ejercicios y etiquetas conocidos (los de las
    plantillas, en `src/i18n-content.js`), nombres por defecto ("Rutina A" → "Routine A" →
    "Scheda A"), series ("c/pierna" → "per leg"), frases y el historial. Lo que la persona
    escribió a mano y no está en esas listas queda como estaba. Para sumar un ejercicio
    traducible, alcanza con agregar una fila `[español, inglés, italiano]` en `EXERCISES`.
  - Joe's habla en el idioma elegido (`src/joe-prompt.js` tiene sus instrucciones en los
    3 idiomas) y la búsqueda de ejercicios en wger.de usa ese idioma.
  - Los días de la semana se guardan siempre en español como clave interna y se muestran
    traducidos, así que cambiar de idioma no rompe nada.
- **Registro por serie y "la vez pasada"**: tocando el nombre de un ejercicio se abre una
  hoja con cuatro vistas (Series · Progreso · Técnica · Cambiar). En Series se anotan kg y
  repeticiones de cada serie (opcional: tildar el ejercicio sin anotar sigue funcionando).
  Arriba aparece lo que hizo la vez pasada, con "Repetir" y "+2,5 kg" para no tipear; al
  marcar una serie arranca solo el descanso (también en la última serie de cada ejercicio,
  menos cuando es lo último del día: ahí se apaga). Al terminar, el aviso verde queda 5 s.
  La hoja se cierra con la X, tocando afuera o arrastrándola hacia abajo
  (`src/lib/useSheetDrag.js`). Lo anotado se guarda en `data.lifts` (por ejercicio,
  independiente del idioma) y en el registro del historial. Lógica en `src/lib/lifts.js`;
  la hoja en `src/components/ExerciseSheet.jsx`.
- **Progreso y récords**: gráfico por ejercicio (mejor serie de cada sesión,
  `src/components/ProgressChart.jsx`) y aviso al batir un récord de peso o de repeticiones
  (solo cuando ya hay sesiones anteriores para comparar). La sección de récords se pliega
  (recuerda si la dejaste abierta) y cada récord muestra el 1RM aproximado (fórmula de
  Epley sobre la mejor serie de hasta 12 repeticiones) con referencias al 80 % y 70 %.
- **Técnica**: abre una búsqueda de Google ("cómo hacer … técnica correcta", o la de videos)
  en el idioma de la app. El texto de la búsqueda está en `howToQuery` (`src/i18n-features.js`).
- **Objetivo semanal en vez de racha diaria** (`src/lib/weekly.js`): por defecto es la
  cantidad de días de la rutina activa y se cambia en Progreso. Una semana con un día menos
  que el objetivo igual cuenta para las "semanas seguidas". **Cada lunes la rutina se
  reinicia sola** (se destildan ejercicios y series; el historial queda).
- **Cambio rápido de ejercicio**, sin IA: se puede escribir cualquier ejercicio (con
  sugerencias) o elegir un parecido. "Máquina ocupada" muestra solo opciones de gimnasio
  (barra, mancuernas, máquinas, poleas, Smith, pesa rusa, barra fija, banco), primero las de
  otro tipo de equipo; "Estoy en casa", solo peso corporal, objetos de casa o banda elástica.
  La biblioteca (más de 220 ejercicios con equipo y traducción) está en
  `src/data/exercise-library.js`: para sumar uno, una fila. "Solo por hoy" vuelve solo al
  original al día siguiente; "Reemplazar" lo cambia para siempre.
- **Entrenar vs. editar** (la idea de cada modo):
  - **Vista normal = entrenar hoy**: tildar, anotar series, cambiar un ejercicio y "Sumar
    un ejercicio hoy", que aparece solo en el día que toca hoy (o el que ya arrancaste hoy).
    Viene marcado "solo hoy" (desaparece solo al día siguiente), con opción "para siempre".
  - **Editar (lápiz) = cambiar la rutina para siempre**: nombres, días de la semana,
    agregar/editar/borrar/reordenar ejercicios, agregar o borrar días y rutinas. Los cambios
    se aplican al instante; abajo hay una barra con el nombre de la rutina, Deshacer y Listo
    (sin diálogos). Cada fila: manija para reordenar, tocarla abre la hoja para editarla
    (`src/components/ExerciseEditor.jsx`) y el tacho borra directo (se puede deshacer).
    "Reiniciar la semana" y "Agregar rutina nueva" quedan fuera de edición.
  - Editar un ejercicio cambiado "solo por hoy" lo deja así para siempre. Lo de "solo hoy"
    no viaja en los links de rutina compartidos.
- **Guardado**: además del guardado normal (medio segundo después de cada cambio), todo se
  guarda en el momento en que la app pasa a segundo plano o se cierra.
- **Joe's conoce tu historial**: a sus instrucciones se suma un resumen real (objetivo y
  semanas, días que más se saltean, cargas de las últimas 6 semanas, récords) armado en
  `buildHistoryContext` (`src/joe-prompt.js`). Hay botones rápidos en el chat para pedir el
  resumen de la semana, cómo vienen las cargas o ajustar la rutina a lo que se cumple.
- **Compartir**:
  - Rutina como **link corto** (botón de compartir arriba de la rutina → hoja con WhatsApp,
    más opciones y copiar, `src/components/ShareRoutineSheet.jsx`): la rutina se guarda en
    la base (`api/routine-link.js`, dura un año) y el link queda tipo
    `average-app.vercel.app/r/K7P2QMX` (`vercel.json` manda `/r/...` a la app). Si el
    servidor no responde, usa el link largo de antes (todo dentro del link, `#rutina=...`).
    Al abrirlo se ve quién la compartió y todos los días con sus ejercicios y series; si
    viene en otro idioma se traduce, si no queda tal cual.
  - Tarjeta para historias de Instagram al completar un día o desde el historial
    (1080×1920, `src/lib/storyCard.js`). Al tocar compartir se elige entre dos plantillas
    (`src/components/StoryPicker.jsx`; la app recuerda la última elegida):
    **Con frase** (rutina, resumen y frase de Joe's) y **Detalle** (sin frase ni nombre de
    rutina: todos los ejercicios hechos con sus series y pesos, o el objetivo si no se
    anotaron series; la letra se achica sola para que entren).
  - **La rutina del mes de Joe**: se edita a mano en `public/rutina-del-mes.json` (adentro
    tiene las instrucciones). Aparece primera al elegir plantilla mientras `month` coincida
    con el mes actual; si no coincide, no se muestra.
- **Compañeros** (pestaña Progreso): cada uno tiene un código de 6 letras. Es **de ida y
  vuelta**: cuando sumás a alguien, quedan vinculados los dos en el servidor
  (`api/buddy-link.js`) y cada uno ve solo si el otro fue esta semana (puntos, objetivo,
  semanas seguidas). Solo se ven entre vinculados. Al que te sumó lo ves aparecer solo (con
  un aviso). Se puede dejar de compartir con uno (X al lado del nombre, con aviso: ninguno
  ve más al otro) o con todos ("Dejar de compartir", con aviso de que se pierden los
  contactos). Necesita el código de sincronización y la misma base de datos (ver abajo).
- **Joe's te escribe si dejás de entrenar**: si pasan 5 días sin anotar ningún
  entrenamiento (o 5 días desde que armaste la rutina sin estrenarla), Joe's deja un mensaje
  en el chat preguntando si está todo bien, con lo que te toca hoy o lo próximo de tu rutina,
  y aparece un punto rojo en "Joe's" en la barra de abajo hasta que abrís el chat. Es un
  mensaje armado por la app (no usa la IA, así que llega sin API key ni internet) y hay uno
  por cada racha sin entrenar. Se cambia en `src/lib/coach.js` (`COACH_NUDGE_DAYS`) y los
  textos en `src/i18n-features.js` (`nudge1`…`nudgeFirst`). Aparece cuando abrís la app:
  una notificación con la app cerrada necesitaría un servidor de notificaciones push.
- **Funciona sin internet (menos el chat)**: agregué `vite-plugin-pwa`, que genera un
  service worker (`vite.config.js`). Una vez que se abrió la app con conexión al menos una
  vez (o se instaló en el celu), el resto de las veces carga y funciona sin internet: ver y
  editar rutinas, tildar ejercicios, el cronómetro, todo local. Lo único que sigue
  necesitando conexión sí o sí es el chat con Joe's (habla en vivo con Groq o Gemini), la
  vista Técnica y los compañeros. No hace falta ningún APK ni empaquetado nativo para esto, es estándar
  de cualquier PWA instalada.
- **Consultas de ejercicios en el chat (wger.de)**: cuando el usuario tiene dudas sobre un ejercicio,
  Joe's puede pedirle a la app que busque en la base pública de wger.de (en español, sin
  API key) y le muestra una tarjeta con imagen, músculos, equipo y una descripción corta.
  Esto llama a `wger.de/api/v2/exercise/search/` y `wger.de/api/v2/exerciseinfo/{id}/`
  directo desde el navegador — **no pude probar esto contra la API real** desde mi entorno
  (no tengo salida de red hacia wger.de acá), así que lo armé con manejo de errores en cada
  paso y un link de respaldo a wger.de si algo no encaja. Probalo en serio una vez
  deployado; si la respuesta de wger no calza con lo que asumí (nombres de campos,
  traducciones), avisame y lo ajusto. Si el navegador bloquea las llamadas por CORS, la
  solución sería agregar una function serverless chiquita en Vercel que haga de intermediario.
- **Código de sincronización**: cada persona puede generar un código (tipo "Tigre57") desde
  Perfil o en el onboarding, y pegarlo en otro dispositivo para ver ahí el mismo perfil y las
  mismas rutinas. Al generarlo en el inicio, la app lo muestra con su explicación (para qué
  sirve, que no se recupera si se pierde) antes de pasar a elegir entrenador. Es la pieza que necesita más configuración de tu parte — está detallado en
  su propia sección más abajo. **Sin ese paso, el resto de la app sigue funcionando 100%
  local, como hasta ahora** — el código de sincronización es opcional.

## Configurar el código de sincronización (Vercel KV)

Esto es lo único que necesita un paso manual tuyo en el dashboard de Vercel — todo el código
ya está armado, pero necesita una base de datos real conectada para funcionar.

1. En tu proyecto en [vercel.com](https://vercel.com), andá a la pestaña **Storage** →
   **Create Database** → elegí **KV** (es Redis, administrado por Upstash, capa gratuita
   generosa para este uso).
2. Conectala a este proyecto (Vercel te lo ofrece automáticamente al crearla desde ahí).
   Esto agrega solo las variables de entorno que las funciones de `/api` ya esperan
   (`KV_REST_API_URL`, `KV_REST_API_TOKEN`, etc.) — no hay que tocar código.
3. Redeployá (o esperá al próximo deploy) para que las funciones tomen esas variables.
4. Probalo: entrá a la app, andá a Perfil, tocá "Generar código de sincronización". Si te
   da un código tipo "Titan42", andá funcionando. Si tira error, revisá en Vercel → tu
   proyecto → pestaña **Logs** qué dice la función `sync-generate`.

**Antes de conectar la KV**, si alguien toca "Generar código" o "Usar este código", va a ver
un mensaje de error prolijo ("No pudimos generar un código ahora") — no rompe nada, la app
sigue anduviendo local sin ese botón.

Archivos de esta parte:
```
api/
├── sync-generate.js   # POST — genera un código único (Nombre+2 dígitos) y lo crea vacío en KV
├── sync-get.js        # GET  — trae { data, apiKey } guardados bajo un código
├── sync-save.js       # POST — sobreescribe { data, apiKey } bajo un código existente
├── buddy-publish.js   # POST — publica el resumen semanal (o deja de compartir con todos)
├── buddy-link.js      # POST — vincula / desvincula compañeros (de a dos) y lista los tuyos
└── routine-link.js    # POST/GET — links cortos de rutinas compartidas (/r/XXXXXXX)
```
Los compañeros y los links cortos usan la misma base: si la sincronización funciona, esto también.

**Nota de privacidad**: estas funciones no tienen ninguna verificación además del código en
sí — tal como lo charlamos, el código funciona como usuario+contraseña juntos en uno. No hay
límite de intentos ni captcha en `sync-get`; para un uso personal/entre conocidos está bien,
pero si esto crece mucho valdría la pena sumar un rate-limit básico (por IP, por ejemplo) para
que alguien no pueda "probar" códigos al azar en loop.

## Probar en local

```bash
npm install
npm run dev
```

## Deploy en Vercel

1. Subí esta carpeta a un repo de GitHub (o usá `vercel` CLI directo desde acá).
2. En [vercel.com](https://vercel.com), "Add New Project" → importá el repo.
3. Vercel detecta Vite automáticamente (build command `vite build`, output `dist`). No hace
   falta configurar nada más.
4. Deploy.

O directo desde la terminal, sin GitHub:

```bash
npm install -g vercel
vercel
```

## Estructura

```
├── index.html          # HTML base, favicon, título y meta tags de Open Graph
├── package.json
├── vite.config.js      # incluye vite-plugin-pwa (service worker / offline)
├── api/
│   ├── sync-generate.js / sync-get.js / sync-save.js
│   ├── buddy-publish.js / buddy-link.js
│   └── routine-link.js
├── vercel.json         # los links cortos /r/... abren la app
├── public/
│   ├── rutina-del-mes.json  # la rutina del mes de Joe (editar a mano cada mes)
│   ├── favicon.svg
│   ├── icon-180.png     # apple-touch-icon
│   ├── icon-192.png     # ícono para Android / manifest
│   ├── icon-512.png     # ícono para Android / manifest
│   └── og-image.png     # thumbnail al compartir el link
└── src/
    ├── main.jsx          # punto de entrada de React
    ├── App.jsx           # toda la app (lo que antes era el artifact)
    ├── i18n.js           # textos de pantalla en español, inglés e italiano
    ├── i18n-features.js  # textos de las funciones nuevas (series, progreso, compartir…)
    ├── i18n-content.js   # ejercicios, etiquetas, frases, días, meses y plantillas traducidos
    ├── joe-prompt.js     # instrucciones de Joe's (la IA) + resumen del historial
    ├── components/
    │   ├── ExerciseSheet.jsx    # hoja del ejercicio: series, progreso, técnica, cambiar
    │   ├── ExerciseEditor.jsx   # hoja para agregar / editar un ejercicio del día
    │   ├── ExerciseNameInput.jsx # campo con sugerencias de ejercicios
    │   ├── ProgressChart.jsx    # gráfico de un ejercicio
    │   ├── ProgressTab.jsx      # pestaña Progreso: semana, historial, récords, compañeros
    │   ├── StoryPicker.jsx      # elegir la plantilla de tarjeta para historias
    │   ├── ShareRoutineSheet.jsx # compartir la rutina con link corto
    │   ├── ManualWorkoutSheet.jsx # cargar un entrenamiento hecho sin el teléfono
    │   └── HistoryCalendar.jsx  # calendario del historial
    ├── data/
    │   ├── exercise-library.js  # biblioteca: +220 ejercicios con equipo, patrón y traducciones
    │   └── alternatives.js      # equivalentes para "máquina ocupada" / "en casa"
    └── lib/
        ├── coach.js      # mensaje de Joe's después de 5 días sin entrenar
        ├── dates.js      # fechas y semanas
        ├── lifts.js      # series, la vez pasada, récords, 1RM estimado
        ├── weekly.js     # objetivo semanal y semanas seguidas
        ├── restTimer.js  # cronómetro de descanso compartido
        ├── share.js      # links de rutina y compartir archivos
        ├── storyCard.js  # tarjeta para historias
        ├── useSheetDrag.js # cerrar hojas arrastrando hacia abajo
        └── wger.js       # búsqueda en wger.de (tarjetas del chat)
```
