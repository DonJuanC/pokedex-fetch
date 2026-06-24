import { fetchJson } from "./api.js";
import { getState, setState } from "./state.js";
import { render } from "./ui.js";

const API_BASE = "https://pokeapi.co/api/v2/pokemon";

async function handleSearch(id) {
  // 1. Actualizar estado a loading
  setState({
    status: "loading",
    data: null,
    error: null,
    lastSearch: id,
  });
  render(getState());

  try {
    // 2. Hacer fetch
    const data = await fetchJson(`${API_BASE}/${id}`);

    // 3. Éxito: actualizar estado
    setState({ status: "success", data });
    render(getState());
  } catch (error) {
    // 4. Error: actualizar estado
    setState({
      status: "error",
      error: error.message || "Ocurrió un error",
    });
    render(getState());
  }
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
