// convert-img/js/storage.js

import {
  conversionsToday,
  adsWatchedToday,
  lastActivityDate,
  setConversionsToday,
  setAdsWatchedToday,
  setLastActivityDate,
  resetDailyCountersIfNeeded,
} from "./state.js";
import { checkConversionLimit } from "./limitManager.js"; // Importa checkConversionLimit desde limitManager.js
import { updateConversionCounterUI } from "./uiUpdater.js"; // Importa updateConversionCounterUI desde uiUpdater.js

export function savePreferences() {
  localStorage.setItem("conversionsToday", conversionsToday.toString());
  localStorage.setItem("adsWatchedToday", adsWatchedToday.toString());
  localStorage.setItem("lastActivityDate", new Date().toDateString());
}

export function loadPreferences() {
  const storedConversionsToday = localStorage.getItem("conversionsToday");
  const storedAdsWatchedToday = localStorage.getItem("adsWatchedToday");
  const storedLastActivityDate = localStorage.getItem("lastActivityDate");

  setConversionsToday(parseInt(storedConversionsToday || "0", 10));
  setAdsWatchedToday(parseInt(storedAdsWatchedToday || "0", 10));
  setLastActivityDate(storedLastActivityDate || "");

  resetDailyCountersIfNeeded(); // Asegura que los contadores se reinicien si es un nuevo día
  savePreferences(); // Guarda las preferencias actualizadas (especialmente la fecha)

  updateConversionCounterUI();
  checkConversionLimit();
}
