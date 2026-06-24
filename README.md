# Pokédex Fetch

Buscador de Pokémon construido con JavaScript vanilla y la Fetch API, con manejo explícito de estados de UI (`idle` / `loading` / `success` / `error`) y diferenciación entre errores HTTP y errores de red. Tema visual inspirado en una Pokédex retro estilo Game Boy.

## Qué hace

- Busca un Pokémon por nombre contra [PokéAPI](https://pokeapi.co/) y muestra nombre, sprite, altura y peso.
- Mientras espera la respuesta muestra un spinner (`loading`); si la API responde con error (404, etc.) o falla la red, muestra un mensaje de error con botón de reintento (`error`); si todo sale bien, renderiza la tarjeta de datos (`success`).
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

1. **`state.js`** guarda un objeto plano (`status`, `data`, `error`, `lastSearch`) con `getState()` / `setState()`. Nadie muta el estado directamente, todo pasa por `setState`.
2. **`api.js`** solo sabe hacer fetch: pide la URL, valida `response.ok`, parsea el JSON y devuelve los datos o lanza un `Error`. No conoce nada de la UI.
3. **`ui.js`** es una función de render pura: recibe el estado actual y decide qué bloque mostrar (`loading`, `content` o `error`), sin guardar nada por su cuenta.
4. **`main.js`** conecta todo: escucha eventos (submit del form, input para debounce, click en retry, click en historial), llama a `fetchJson`, actualiza el estado con `setState` y vuelve a pintar con `render(getState())`.

Este flujo se repite siempre igual: **evento → loading → fetch → success o error → render**.

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

## Posibles mejoras futuras

- Loading states distintos para "búsqueda nueva" vs "viene de debounce" (evitar parpadeo del spinner en escritura rápida).
- Persistir historial y caché en `localStorage` para que sobrevivan a un refresh.
- Manejo de Pokémon con nombres compuestos (ej. `mr-mime`) y validación de input más estricta.
- Loading skeleton en vez de spinner genérico.

## Autor

JuanC — proyecto de práctica del módulo Fetch, Estados UI y Manejo de Errores.
