export function render(state) {
  const loading = document.querySelector("#loading");
  const content = document.querySelector("#content");
  const error = document.querySelector("#error");

  // LED de estado: data-status dispara color/animación definidos en CSS
  // (.status-light[data-status="..."]). Se actualiza en cada render(),
  // así que siempre queda sincronizado con state.status.
  document.querySelector("#status-light").dataset.status = state.status;

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
  // PokéAPI entrega altura en decímetros y peso en hectogramos (no metros/kg).
  // 1 decímetro = 0.1 m · 1 hectogramo = 0.1 kg → convertimos antes de mostrar.
  const heightInMeters = (data.height / 10).toFixed(1);
  const weightInKg = (data.weight / 10).toFixed(1);

  // types y abilities llegan como arrays de objetos anidados ({type: {name}}),
  // los aplanamos a un string simple separado por comas.
  const types = data.types.map((t) => t.type.name).join(", ");
  const abilities = data.abilities.map((a) => a.ability.name).join(", ");

  // De las ~6 estadísticas base que trae la API nos quedamos solo con 4,
  // para que la tarjeta no se sature de información.
  const statsToShow = ["hp", "attack", "defense", "speed"];
  const stats = data.stats
    .filter((s) => statsToShow.includes(s.stat.name))
    .map((s) => `<li>${s.stat.name.toUpperCase()}: ${s.base_stat}</li>`)
    .join("");

  // sprites.front_default es el sprite de juego (96x96): se ve bien pequeño y
  // pixelado, pero al agrandarlo se nota borroso/bloqueado. sprites.other
  // ["official-artwork"] es ilustración oficial en alta resolución (475x475),
  // así que se puede mostrar grande sin pixelarse. Si por algún motivo no
  // existe (raro, pero posible), caemos al sprite normal como respaldo.
  const artwork =
    data.sprites.other?.["official-artwork"]?.front_default ||
    data.sprites.front_default;

  // isLegendary / isMythical llegan ya fusionados desde main.js (vienen de
  // /pokemon-species/). Si es mítico priorizamos ese badge sobre legendario;
  // un Pokémon normal no muestra nada.
  let badge = "";
  if (data.isMythical) {
    badge = `<span class="badge badge-mythical">✨ Mítico</span>`;
  } else if (data.isLegendary) {
    badge = `<span class="badge badge-legendary">⭐ Legendario</span>`;
  }

  return `
    <div class="data-card">
      <h2>${data.name} ${badge}</h2>
      <img src="${artwork}" alt="${data.name}">
      <p>Altura: ${heightInMeters} m · Peso: ${weightInKg} kg</p>
      <p>Tipo: ${types}</p>
      <p>Habilidades: ${abilities}</p>
      <ul class="stats">${stats}</ul>
    </div>
  `;
}
