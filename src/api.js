export async function fetchJson(url) {
  // TODO: Implementar
  // 1. await fetch(url)
  const response = await fetch(url);

  // 2. Validar response.ok
  if (!response.ok) {
    // 3. Si !ok, throw Error con status
    throw new Error(`HTTP error ${response.status}`);
  }

  // 4. await response.json()
  const data = await response.json();

  // 5. return data
  return data;
}
