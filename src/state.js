// CONCEPTO CLAVE DEL MÓDULO: single source of truth. Todo el estado de la
// UI vive en este objeto, nunca repartido en el DOM. Nadie fuera de este
// archivo lo toca directamente (state.status = "x" rompería el patrón);
// siempre se lee con getState() y se actualiza con setState().
const state = {
  // Las 4 fases del state machine: idle (nada buscado aún) → loading
  // (esperando el fetch) → success | error (resultado final).
  status: "idle", // 'idle' | 'loading' | 'success' | 'error'
  data: null,
  error: null,
  lastSearch: null, // Última búsqueda guardada, para que el botón "Reintentar" sepa qué repetir
};

// Devolvemos una COPIA del estado ({ ...state }), no la referencia
// original. Así, si alguien hace "const s = getState(); s.status = 'x'",
// solo modifica la copia, no el estado real — la única forma de cambiar
// el estado real sigue siendo setState(). Esto es lo que el resolution
// del instructor llama evitar "mutación accidental desde afuera".
export function getState() {
  return { ...state };
}

// Object.assign fusiona solo las claves que le pasamos ("updates") dentro
// del estado existente, sin pisar las que no mencionamos. Por eso
// setState({ status: "loading" }) no borra "data" ni "lastSearch".
export function setState(updates) {
  Object.assign(state, updates);
}
