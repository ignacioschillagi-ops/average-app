# Tu rutina

Proyecto Vite + React listo para deployar en Vercel.

## Qué se le cambió respecto al artifact de Claude

- **Almacenamiento**: el artifact usa `window.storage` (propio de Claude.ai). Acá lo reemplacé
  por un shim que usa `localStorage` del navegador (ver el objeto `storage` al inicio de
  `src/App.jsx`). La rutina vive en el dispositivo por defecto — para verla en más de uno,
  está el código de sincronización (ver más abajo).
- **Favicon y título**: ahora se definen en `index.html` (`public/favicon.svg`), no con el
  efecto dinámico que usaba el artifact.
- **Entrenador con IA (Joe's)**: llama directo desde el navegador a la API de Groq
  (`https://api.groq.com/openai/v1/chat/completions`) usando la API key que cada persona pega
  en la pestaña "Joe's". La key se guarda en `localStorage`, nunca pasa por ningún servidor
  propio. Si Groq llega a cambiar o discontinuar el modelo `llama-3.3-70b-versatile`, se
  actualiza en la constante `GROQ_MODEL` al principio de `src/App.jsx`.
- **Funciona sin internet (menos el chat)**: agregué `vite-plugin-pwa`, que genera un
  service worker (`vite.config.js`). Una vez que se abrió la app con conexión al menos una
  vez (o se instaló en el celu), el resto de las veces carga y funciona sin internet: ver y
  editar rutinas, tildar ejercicios, el cronómetro, todo local. Lo único que sigue
  necesitando conexión sí o sí es el chat con Joe's, porque habla en vivo con Groq — eso no
  se puede cachear. No hace falta ningún APK ni empaquetado nativo para esto, es estándar
  de cualquier PWA instalada.
- **Consultas de ejercicios (wger.de)**: cuando el usuario tiene dudas sobre un ejercicio,
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
  mismas rutinas. Es la pieza que necesita más configuración de tu parte — está detallado en
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
└── sync-save.js       # POST — sobreescribe { data, apiKey } bajo un código existente
```

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
│   ├── sync-generate.js
│   ├── sync-get.js
│   └── sync-save.js
├── public/
│   ├── favicon.svg
│   ├── icon-180.png     # apple-touch-icon
│   ├── icon-192.png     # ícono para Android / manifest
│   ├── icon-512.png     # ícono para Android / manifest
│   └── og-image.png     # thumbnail al compartir el link
└── src/
    ├── main.jsx          # punto de entrada de React
    └── App.jsx           # toda la app (lo que antes era el artifact)
```
