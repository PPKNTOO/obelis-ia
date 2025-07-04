// convert-img/js/state.js

export let originalImage = null; // Para almacenar la imagen original cargada (Image object)
export let convertedBlob = null; // Para almacenar el blob de la imagen convertida

export let conversionsToday = 0;
export let adsWatchedToday = 0;
export let lastActivityDate = ""; // Para reiniciar los contadores diariamente

export let ctx = null; // Contexto del canvas

// Funciones para actualizar el estado
export function setOriginalImage(image) {
  originalImage = image;
}

export function setConvertedBlob(blob) {
  convertedBlob = blob;
}

export function setConversionsToday(count) {
  conversionsToday = count;
}

export function setAdsWatchedToday(count) {
  adsWatchedToday = count;
}

export function setLastActivityDate(date) {
  lastActivityDate = date;
}

export function setCtx(context) {
  ctx = context;
}

// Función para reiniciar contadores si es un nuevo día
export function resetDailyCountersIfNeeded() {
  const today = new Date().toDateString();
  if (lastActivityDate !== today) {
    conversionsToday = 0;
    adsWatchedToday = 0;
    lastActivityDate = today;
  }
}
