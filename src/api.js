// CONCEPTO CLAVE DEL MÓDULO: fetch() NO rechaza la promesa cuando el
// servidor responde con un error HTTP (404, 500, etc.) — solo rechaza
// cuando falla la conexión en sí (sin internet, DNS caído, CORS bloqueado).
// Por eso hay que revisar "response.ok" a mano y lanzar el error nosotros
// mismos si el status no es 2xx; si no lo hiciéramos, un 404 seguiría de
// largo como si fuera una respuesta exitosa.
export async function fetchJson(url) {
  // Primer await: esperamos a que llegue la respuesta del servidor.
  // Acá ya conocemos el status (200, 404...), pero el body todavía no
  // está parseado.
  const response = await fetch(url);

  // response.ok es true solo para status 200-299. Si no, lanzamos un
  // Error manualmente (con status + statusText, ej. "404 — Not Found")
  // para que el mensaje sea más informativo: esto es lo que convierte un
  // "error HTTP" en una excepción real que el try/catch de quien llama
  // (main.js) puede atrapar exactamente igual que atraparía un error de red.
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} — ${response.statusText}`);
  }

  // Segundo await ("doble await"): el body llega como stream y hay que
  // parsearlo aparte. response.json() es async porque leer y parsear el
  // body toma su propio tiempo, independiente del primer await.
  const data = await response.json();

  return data;
}

// CONCEPTO CLAVE: separación de responsabilidades. fetchJson() es 100%
// genérico — no sabe nada de Pokémon ni de PokéAPI. getPokemon() es la
// pieza que SÍ conoce la URL base de la API. Antes, main.js armaba esa
// URL a mano (API_BASE + id); eso hacía que main.js "supiera" detalles de
// PokéAPI que no le corresponden. Ahora esa responsabilidad vive acá, en
// la capa de datos, igual que en el resolution del instructor. El segundo
// fetch que sigue haciendo main.js (a data.species.url) no necesita este
// wrapper porque ya recibe la URL completa hecha por la propia API.
const BASE_URL = "https://pokeapi.co/api/v2/pokemon";

export async function getPokemon(name) {
  const url = `${BASE_URL}/${name.toLowerCase().trim()}`;
  return await fetchJson(url);
}
