export function render(state) {
  const loading = document.querySelector("#loading");
  const content = document.querySelector("#content");
  const error = document.querySelector("#error");

  // Ocultar todo primero
  loading.classList.add("hidden");
  content.classList.add("hidden");
  error.classList.add("hidden");

  // Mostrar según estado
  if (state.status === "loading") {
    loading.classList.remove("hidden");
  } else if (state.status === "success") {
    content.classList.remove("hidden");
    content.innerHTML = renderData(state.data);
  } else if (state.status === "error") {
    error.classList.remove("hidden");
    document.querySelector("#error-message").textContent = state.error;
  }
}

function renderData(data) {
  return `
    <div class="data-card">
      <h2>${data.name}</h2>
      <img src="${data.sprites.front_default}" alt="${data.name}">
      <p>Altura: ${data.height} · Peso: ${data.weight}</p>
    </div>
  `;
}
