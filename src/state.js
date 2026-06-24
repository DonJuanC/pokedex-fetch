const state = {
  status: "idle", // 'idle' | 'loading' | 'success' | 'error'
  data: null,
  error: null,
  lastSearch: null, // Para retry
};

export function getState() {
  return state;
}

export function setState(updates) {
  Object.assign(state, updates);
}
