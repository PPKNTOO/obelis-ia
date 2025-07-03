// ia-text/js/state.js

import { CONFIG } from "./config.js";

export let utterance = null;
export let availableVoices = [];
export let isPlayingAudio = false;

export let generationsToday = 0;
export let adsWatchedToday = 0;
export let lastActivityDate = "";

// Funciones para actualizar el estado, para que puedan ser importadas
export function setUtterance(newUtterance) {
  utterance = newUtterance;
}

export function setAvailableVoices(voices) {
  availableVoices = voices;
}

export function setIsPlayingAudio(value) {
  isPlayingAudio = value;
}

export function setGenerationsToday(value) {
  generationsToday = value;
}

export function setAdsWatchedToday(value) {
  adsWatchedToday = value;
}

export function setLastActivityDate(date) {
  lastActivityDate = date;
}

// Resetea el estado diario si la fecha ha cambiado
export function resetDailyStateIfNeeded() {
  const today = new Date().toDateString();
  if (lastActivityDate !== today) {
    generationsToday = 0;
    adsWatchedToday = 0;
    lastActivityDate = today;
  }
}
