// ia-audio/js/state.js

// --- Estado de Uso y Límites ---
export let generationsToday = 0;
export let adsWatchedToday = 0;
export let lastActivityDate = "";

// --- Funciones para actualizar el estado (Setters) ---
export function setGenerationsToday(count) {
  generationsToday = count;
}

export function setAdsWatchedToday(count) {
  adsWatchedToday = count;
}

export function setLastActivityDate(date) {
  lastActivityDate = date;
}

/**
 * Reinicia los contadores diarios si la fecha de última actividad
 * es diferente a la fecha actual.
 */
export function resetDailyCountersIfNeeded() {
  const today = new Date().toDateString();
  if (lastActivityDate !== today) {
    setGenerationsToday(0);
    setAdsWatchedToday(0);
    setLastActivityDate(today);
    console.log("Contadores diarios reiniciados.");
  }
}
