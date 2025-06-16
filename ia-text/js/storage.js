// ia-text/js/storage.js

import {
  generationsToday,
  adsWatchedToday,
  lastActivityDate,
  setGenerationsToday,
  setAdsWatchedToday,
  setLastActivityDate,
  resetDailyStateIfNeeded,
} from "./state.js";
import { CONFIG } from "./config.js";
import { DOMElements } from "../../js/global.js";
import {
  updateGenerationCounterDisplay,
  checkGenerationLimit,
} from "./limitManager.js"; // Importar funciones del limitManager
import { updateSpecificVoices } from "./voiceManager.js"; // Importar para cargar preferencias de voz

export const savePreferences = () => {
  const preferences = {
    contentType: DOMElements.contentTypeOptions
      ? document.querySelector('input[name="contentType"]:checked')?.value ||
        "story"
      : "story",
    tone: DOMElements.toneSelect ? DOMElements.toneSelect.value : "",
    voiceLanguage: DOMElements.voiceLanguageSelect
      ? DOMElements.voiceLanguageSelect.value
      : "",
    voiceName: DOMElements.voiceSelect ? DOMElements.voiceSelect.value : "",
  };
  localStorage.setItem("userPreferences", JSON.stringify(preferences));
  localStorage.setItem("generationsToday", generationsToday);
  localStorage.setItem("adsWatchedToday", adsWatchedToday);
  localStorage.setItem("lastActivityDate", new Date().toDateString());
};

export const loadPreferences = () => {
  const preferences = JSON.parse(localStorage.getItem("userPreferences"));
  if (preferences) {
    const contentTypeRadio = DOMElements.contentTypeOptions
      ? document.querySelector(
          `input[name="contentType"][value="${preferences.contentType}"]`
        )
      : null;
    if (contentTypeRadio) {
      contentTypeRadio.checked = true;
      if (DOMElements.promptInput) {
        DOMElements.promptInput.placeholder =
          CONFIG.PLACEHOLDERS[preferences.contentType] ||
          CONFIG.PLACEHOLDERS.story;
      }
    }
    if (preferences.tone && DOMElements.toneSelect) {
      DOMElements.toneSelect.value = preferences.tone;
    }
    // Cargar las preferencias de voz después de que las voces estén disponibles
    // Esto se maneja en voiceManager.js, llamando updateSpecificVoices
  }

  const storedGenerationsToday = localStorage.getItem("generationsToday");
  const storedAdsWatchedToday = localStorage.getItem("adsWatchedToday");
  const storedLastActivityDate = localStorage.getItem("lastActivityDate");

  setGenerationsToday(parseInt(storedGenerationsToday || "0", 10));
  setAdsWatchedToday(parseInt(storedAdsWatchedToday || "0", 10));
  setLastActivityDate(storedLastActivityDate || "");

  resetDailyStateIfNeeded(); // Asegura que el estado diario se resetee si es un nuevo día
  savePreferences(); // Guarda el estado actualizado (especialmente la fecha)

  updateGenerationCounterDisplay();
  checkGenerationLimit();

  return preferences; // Devuelve las preferencias cargadas para su uso
};
