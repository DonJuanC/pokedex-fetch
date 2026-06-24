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
  // Error manualmente: esto es lo que convierte un "error HTTP" en una
  // excepción real que el try/catch de quien llama (main.js) puede
  // atrapar exactamente igual que atraparía un error de red.
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  // Segundo await ("doble await"): el body llega como stream y hay que
  // parsearlo aparte. response.json() es async porque leer y parsear el
  // body toma su propio tiempo, independiente del primer await.
  const data = await response.json();

  return data;
}
