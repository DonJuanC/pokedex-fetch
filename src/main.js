import { fetchJson } from "./api.js";
import { getState, setState } from "./state.js";
import { render } from "./ui.js";

const API_BASE = "https://pokeapi.co/api/v2/pokemon";
const cache = new Map();
const history = [];

async function handleSearch(id) {
  setState({
    status: "loading",
    data: null,
    error: null,
    lastSearch: id,
  });
  render(getState());

  if (cache.has(id)) {
    setState({ status: "success", data: cache.get(id) });
    addToHistory(id);
    render(getState());
    return;
  }

  try {
    const data = await fetchJson(`${API_BASE}/${id}`);

    // is_legendary / is_mythical NO vienen en /pokemon/, viven en
    // /pokemon-species/. data.species.url ya apunta ahí, así que hacemos
    // un segundo fetch encadenado y fusionamos ambos resultados en uno solo.
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
    setState({
      status: "error",
      error: error.message || "Ocurrió un error",
    });
    render(getState());
  }
}

function addToHistory(id) {
  if (!history.includes(id)) {
    history.unshift(id);
    history.splice(5);
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

// Setup de eventos
document.querySelector("#search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.querySelector("#search-input");
  const id = input.value.trim().toLowerCase();

  if (id) {
    handleSearch(id);
  }
});

// Botón retry
document.querySelector("#retry-btn").addEventListener("click", () => {
  const { lastSearch } = getState();
  if (lastSearch) {
    handleSearch(lastSearch);
  }
});

// Debounce
let debounceTimer;
const searchInput = document.querySelector("#search-input");
searchInput.addEventListener("input", (e) => {
  clearTimeout(debounceTimer);
  const value = e.target.value.trim().toLowerCase();
  debounceTimer = setTimeout(() => {
    if (value) handleSearch(value);
  }, 500);
});

document.querySelector("#history").addEventListener("click", (e) => {
  const name = e.target.dataset.name;
  if (name) {
    handleSearch(name);
  }
});
