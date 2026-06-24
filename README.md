# Pokédex Fetch

Buscador de Pokémon construido con JavaScript vanilla y la Fetch API, con manejo explícito de estados de UI (`idle` / `loading` / `success` / `error`) y diferenciación entre errores HTTP y errores de red. Tema visual inspirado en una Pokédex retro estilo Game Boy.

## Qué hace

- Busca un Pokémon por nombre contra [PokéAPI](https://pokeapi.co/) y muestra nombre, artwork oficial, altura (m) y peso (kg), tipo(s), habilidades y 4 estadísticas base (HP/ATK/DEF/SPD).
- Si el Pokémon es legendario o mítico (dato que vive en `/pokemon-species/`, no en `/pokemon/`), muestra un badge junto al nombre: dorado para legendario, púrpura con glow para mítico.
- Mientras espera la respuesta muestra un spinner (`loading`); si la API responde con error (404, etc.) o falla la red, muestra un mensaje de error con botón de reintento (`error`); si todo sale bien, renderiza la tarjeta de datos (`success`).
- Un LED de estado (esquina superior derecha de la carcasa) refleja visualmente el `status` actual: gris (idle), amarillo parpadeante (loading), verde (success), rojo (error).
- Distingue dos clases de falla:
  - **Error HTTP**: la request llega, pero el servidor responde con un status fuera del rango 2xx (ej. `404` por nombre inexistente). `fetch` no rechaza la promesa en este caso — hay que validar `response.ok` a mano y lanzar el error manualmente.
  - **Error de red**: la request nunca llega a completarse (sin conexión, DNS caído, CORS bloqueado). Aquí `fetch` sí rechaza la promesa, con un mensaje como `Failed to fetch`.
- Debounce de 500ms en el input: dispara la búsqueda automáticamente mientras escribís, sin saturar la API en cada tecla.
- Caché en memoria (`Map`): si ya buscaste un Pokémon, la segunda vez se muestra al instante, sin volver a pegarle a la API.
- Historial de las últimas 5 búsquedas como pills clicleables debajo del input, para repetir una búsqueda con un clic.

## Stack

- HTML + CSS + JavaScript vanilla, sin frameworks ni build step.
- ES Modules nativos (`type="module"`) — requiere servirse por HTTP, no funciona abriendo el `.html` directo (`file://`) por las restricciones de CORS de los módulos.
- [PokéAPI](https://pokeapi.co/docs/v2) como fuente de datos (no requiere API key).
- Tipografías [Press Start 2P y VT323](https://fonts.google.com/) (Google Fonts) para el tema Game Boy.

## Estructura del proyecto

```
buscador-fetch/
├── index.html          # Estructura: form, contenedores de estado, historial
├── styles.css          # Tema visual Pokédex (carcasa, pantalla LCD, botones 3D)
└── src/
    ├── api.js           # fetchJson(url): fetch + validación response.ok + parseo JSON
    ├── state.js          # Estado centralizado (status, data, error, lastSearch)
    ├── ui.js              # render(state): pinta el DOM según el estado actual
    └── main.js          # Orquestador: eventos, debounce, caché, historial
```

## Cómo funciona (arquitectura)

El patrón es un mini state machine con una sola fuente de verdad:

1. **`state.js`** guarda un objeto plano (`status`, `data`, `error`, `lastSearch`) con `getState()` / `setState()`. `getState()` devuelve una copia (`{ ...state }`), no la referencia real — nadie puede mutar el estado desde afuera sin pasar por `setState`.
2. **`api.js`** tiene dos capas: `fetchJson(url)` es 100% genérico (fetch + valida `response.ok` + parsea JSON) y no conoce nada de la UI; `getPokemon(name)` es la única pieza que conoce la URL base de PokéAPI y arma la URL por nombre. El fetch encadenado a `data.species.url` (ver punto 4) sigue usando `fetchJson` directo, porque esa URL ya viene completa desde la propia API.
3. **`ui.js`** es una función de render pura: recibe el estado actual y decide qué bloque mostrar (`loading`, `content` o `error`), sin guardar nada por su cuenta. También actualiza el LED de estado (`#status-light`), deshabilita el botón "Buscar" mientras `status === "loading"` (evita doble submit) y traduce el JSON del Pokémon a HTML (`renderData`).
4. **`main.js`** conecta todo: hace un `render(getState())` inicial al cargar (para que la pantalla arranque reflejando `idle` en vez de depender de que el HTML ya venga sincronizado a mano), y luego escucha eventos (submit del form, input para debounce, click en retry, click en historial), llama a `getPokemon`, actualiza el estado con `setState` y vuelve a pintar con `render(getState())`. Para cada búsqueda nueva hace un **fetch encadenado**: primero `getPokemon(nombre)` (→ `/pokemon/{nombre}`), y con la URL que viene en `data.species.url` pide `/pokemon-species/{nombre}` con `fetchJson` para obtener `is_legendary` / `is_mythical` (ese dato no está en el primer endpoint). Si el fetch falla, el `catch` traduce `error.message` a un texto legible para el usuario (404 → "no encontramos ese Pokémon", resto → error de servidor o de conexión).

Este flujo se repite siempre igual: **evento → loading → fetch (+ fetch de species) → success o error → render**.

## Conceptos de JavaScript aplicados

Lo que pone en práctica este proyecto, módulo por módulo:

- **Fetch API y promesas**: `fetch()` siempre devuelve una promesa; hay que resolverla con `await` o `.then()` antes de tener datos reales.
- **El gotcha de `response.ok`**: `fetch()` NO rechaza la promesa cuando el servidor responde con un status de error (404, 500). Solo rechaza ante una falla real de red (sin conexión, DNS, CORS). Por eso `api.js` valida `response.ok` a mano y lanza el error manualmente si no es 2xx.
- **El "doble await"**: primero `await fetch(url)` (llega la respuesta, status conocido) y después `await response.json()` (se parsea el body, que llega como stream).
- **Errores HTTP vs errores de red**: ambos terminan en el mismo `catch` de `main.js`, pero por caminos distintos — el primero lo lanza `api.js` a propósito, el segundo lo lanza el navegador cuando la conexión falla.
- **State machine de UI**: un estado con 4 fases (`idle` / `loading` / `success` / `error`) como única fuente de verdad (`state.js`), con `render()` (`ui.js`) limpiando todo antes de mostrar el bloque que corresponde.
- **Fetch encadenado**: la segunda llamada (`/pokemon-species/`) depende del resultado de la primera (`data.species.url`), así que no se pueden disparar ambas en paralelo.
- **Debounce**: `setTimeout` + `clearTimeout` para esperar a que el usuario deje de escribir antes de disparar la búsqueda automática.
- **Caché en memoria**: un `Map` que evita repetir un fetch ya resuelto antes (se pierde al refrescar, a diferencia de `localStorage`).
- **Event delegation**: los pills del historial se crean/destruyen dinámicamente, así que el listener vive en el contenedor padre (`#history`) y se identifica el pill clickeado por `e.target.dataset.name`.
- **Inmutabilidad superficial del estado**: `getState()` devuelve `{ ...state }` (una copia), no la referencia real, para que nadie pueda mutar el estado desde afuera sin pasar por `setState`.
- **Separación de responsabilidades**: `api.js` (no `main.js`) es quien conoce la URL base de PokéAPI, vía `getPokemon(name)`. Si mañana cambia la API, el cambio vive en un solo lugar.
- **Errores traducidos a lenguaje de usuario**: el `catch` de `main.js` no muestra `error.message` crudo — lo mapea a un texto en español según el tipo de falla (404, error de servidor, error de conexión).
- **Accesibilidad básica**: el panel de error tiene `role="alert"` y `aria-live="assertive"`, para que un lector de pantalla anuncie el error apenas aparece.
- **Prevención de doble submit**: el botón "Buscar" se deshabilita (`disabled`) mientras `status === "loading"`, para no disparar dos fetch en simultáneo con doble click.

## Cómo correrlo localmente

Los módulos ES requieren un servidor (no abrir el HTML directo):

```bash
# desde la carpeta del proyecto
python -m http.server 5500
```

Y abrís `http://localhost:5500` en el navegador.

## Ejemplo de uso de la API

```
GET https://pokeapi.co/api/v2/pokemon/pikachu
```

Nota: PokéAPI distingue mayúsculas/minúsculas — los nombres deben ir en minúscula (el input ya hace `.toLowerCase()` antes de buscar).

## Casos probados

- Búsqueda exitosa (Pokémon existente) → status 200, tarjeta con datos.
- Búsqueda de Pokémon inexistente → status 404, mensaje de error con botón reintentar.
- Simulación de falla de red (DevTools → Network → Offline) → `Failed to fetch`, mismo bloque de error pero por causa distinta.
- Botón "Reintentar" repite la última búsqueda (`lastSearch` en el estado).
- Transición visual correcta a `loading` mientras espera la respuesta.
- Estados se ocultan/muestran exclusivamente entre sí (nunca dos bloques visibles a la vez).
- Botón "Buscar" queda deshabilitado mientras hay un fetch en curso, y se reactiva en `success`/`error`.

## Posibles mejoras futuras

- Loading states distintos para "búsqueda nueva" vs "viene de debounce" (evitar parpadeo del spinner en escritura rápida).
- Persistir historial y caché en `localStorage` para que sobrevivan a un refresh.
- Manejo de Pokémon con nombres compuestos (ej. `mr-mime`) y validación de input más estricta.
- Loading skeleton en vez de spinner genérico.

## Autor

JuanC — proyecto de práctica del módulo Fetch, Estados UI y Manejo de Errores.
