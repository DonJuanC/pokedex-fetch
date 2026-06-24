// main.js es el "orquestador": conecta los eventos del usuario (escribir,
// enviar el form, hacer click) con la capa de datos (api.js) y la capa de
// estado/UI (state.js + ui.js). No sabe hacer fetch ni pintar el DOM por
// su cuenta — delega cada cosa al módulo que le corresponde.
// fetchJson queda para el fetch genérico (lo usamos para el segundo
// fetch, a data.species.url); getPokemon ya sabe armar la URL de
// PokéAPI por nombre, esa responsabilidad se centralizó en api.js.
import { fetchJson, getPokemon } from "./api.js";
import { getState, setState } from "./state.js";
import { render } from "./ui.js";

// Caché en memoria: un Map normal (no localStorage, se pierde al
// refrescar). Evita pegarle a la API por un Pokémon que ya buscamos antes.
const cache = new Map();

// Últimas búsquedas, para pintar los pills del historial.
const history = [];

// Render inicial: pinta el estado "idle" apenas carga el módulo, en vez
// de confiar en que las clases "hidden" del HTML ya coincidan a mano con
// ese estado. Así la pantalla SIEMPRE arranca reflejando lo que dice
// state.js, sin depender de que el HTML esté "sincronizado por casualidad".
render(getState());

async function handleSearch(id) {
  // Avisamos que empezamos a cargar y pintamos ESE estado antes de que el
  // fetch termine. Sin este render() acá, la UI quedaría congelada en el
  // estado anterior mientras esperamos la respuesta de la API.
  setState({
    status: "loading",
    data: null,
    error: null,
    lastSearch: id, // se guarda ya mismo, así "Reintentar" funciona incluso si el fetch falla
  });
  render(getState());

  // Si ya está en caché, resolvemos al toque y cortamos con "return"
  // antes de llegar al try/catch — no hace falta esperar nada.
  if (cache.has(id)) {
    setState({ status: "success", data: cache.get(id) });
    addToHistory(id);
    render(getState());
    return;
  }

  // CONCEPTO CLAVE DEL MÓDULO: este try/catch es lo que distingue errores
  // HTTP de errores de red.
  //   - Error HTTP (ej. 404, Pokémon no existe): api.js ya lo convirtió
  //     en un throw new Error(...) dentro de fetchJson, así que cae aquí.
  //   - Error de red (sin conexión → "Failed to fetch"): lo lanza el
  //     propio fetch() del navegador, también cae aquí.
  // Para quien usa la app ambos se ven igual (pantalla de error + botón
  // reintentar), pero error.message trae un texto distinto en cada caso.
  try {
    const data = await getPokemon(id);

    // is_legendary / is_mythical NO vienen en /pokemon/, viven en
    // /pokemon-species/. data.species.url ya apunta ahí, así que hacemos
    // un segundo fetch ENCADENADO (depende del resultado del primero) y
    // fusionamos ambos resultados en un solo objeto antes de guardarlo.
    const species = await fetchJson(data.species.url);
    const fullData = {
      ...data,
      isLegendary: species.is_legendary,
      isMythical: species.is_mythical,
    };

    cache.set(id, fullData);
    setState({ status: "success", data: fullData });
    addToHistory(id);
    render(getState());
  } catch (error) {
    // Traducimos el error técnico a un mensaje legible para quien usa la
    // app (mismo concepto que el resolution del instructor en main.js):
    //   - "404" en el mensaje -> casi siempre el nombre está mal escrito.
    //   - otro "HTTP ..." -> respondió el servidor, pero con error (5xx, etc).
    //   - nada de "HTTP" -> nunca hubo respuesta: falló la red/conexión.
    let friendlyMessage;
    if (error.message.includes("404")) {
      friendlyMessage = `No encontramos un Pokémon llamado "${id}". ¿Está bien escrito?`;
    } else if (error.message.includes("HTTP")) {
      friendlyMessage = `Error del servidor: ${error.message}`;
    } else {
      friendlyMessage = `Error de conexión: ${error.message}`;
    }

    setState({ status: "error", error: friendlyMessage });
    render(getState());
  }
}

function addToHistory(id) {
  // Evita duplicados y se queda solo con las 5 búsquedas más recientes.
  if (!history.includes(id)) {
    history.unshift(id); // al principio = la más reciente primero
    history.splice(5); // recorta todo lo que sobre después del índice 5
  }
  renderHistory();
}

function renderHistory() {
  const historyEl = document.querySelector("#history");
  historyEl.innerHTML = history
    .map(
      (name) =>
        `<button class="history-item" data-name="${name}">${name}</button>`,
    )
    .join("");
}

// Setup de eventos: cada listener traduce una acción del usuario en una
// llamada a handleSearch(), que es la única puerta de entrada al flujo
// fetch → estado → render.
document.querySelector("#search-form").addEventListener("submit", (e) => {
  e.preventDefault(); // evita que el form recargue la página (comportamiento default de submit)
  const input = document.querySelector("#search-input");
  const id = input.value.trim().toLowerCase(); // PokéAPI distingue mayúsculas/minúsculas: siempre en minúscula

  if (id) {
    handleSearch(id);
  }
});

// Botón retry: repite la última búsqueda guardada en el estado, sin que
// el usuario tenga que volver a escribir el nombre.
document.querySelector("#retry-btn").addEventListener("click", () => {
  const { lastSearch } = getState();
  if (lastSearch) {
    handleSearch(lastSearch);
  }
});

// CONCEPTO CLAVE DEL MÓDULO: debounce. Sin esto, cada tecla dispararía un
// fetch inmediatamente (búsquedas a medio escribir: "pik", "pika"...).
// clearTimeout cancela el timer anterior en cada tecla nueva, así que
// handleSearch() solo se ejecuta cuando el usuario deja de escribir
// durante 500ms seguidos.
let debounceTimer;
const searchInput = document.querySelector("#search-input");
searchInput.addEventListener("input", (e) => {
  clearTimeout(debounceTimer);
  const value = e.target.value.trim().toLowerCase();
  debounceTimer = setTimeout(() => {
    if (value) handleSearch(value);
  }, 500);
});

// CONCEPTO CLAVE DEL MÓDULO: event delegation. Los pills de #history se
// crean y destruyen dinámicamente (innerHTML los reemplaza en cada
// búsqueda), así que no se les puede poner un addEventListener directo:
// se perdería en cuanto el pill se vuelva a recrear. En cambio, escuchamos
// el click en el contenedor PADRE (que siempre existe) y miramos
// "e.target" para saber en cuál pill se hizo click.
document.querySelector("#history").addEventListener("click", (e) => {
  const name = e.target.dataset.name;
  if (name) {
    handleSearch(name);
  }
});
