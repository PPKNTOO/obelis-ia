// ia-text/js/limitManager.js

import {
  generationsToday,
  adsWatchedToday,
  setGenerationsToday,
  setAdsWatchedToday,
} from "./state.js";
import { CONFIG } from "./config.js";
import { DOMElements, showCustomMessage } from "../../js/global.js";
import { savePreferences } from "./storage.js";

export const updateGenerationCounterDisplay = () => {
  if (!DOMElements.generationCounterDisplay) return;
  const totalAllowed =
    CONFIG.MAX_GENERATIONS_FREE + adsWatchedToday * CONFIG.AD_BONUS_GENERATIONS;
  DOMElements.generationCounterDisplay.textContent = `Generaciones disponibles hoy: ${Math.max(
    0,
    totalAllowed - generationsToday
  )}/${totalAllowed}`;
};

export const checkGenerationLimit = () => {
  const totalAllowed =
    CONFIG.MAX_GENERATIONS_FREE + adsWatchedToday * CONFIG.AD_BONUS_GENERATIONS;
  if (generationsToday >= totalAllowed) {
    if (DOMElements.generateButton) {
      DOMElements.generateButton.disabled = true;
      DOMElements.generateButton.classList.add(
        "opacity-50",
        "cursor-not-allowed"
      );
    }
    if (adsWatchedToday < CONFIG.MAX_ADS_PER_DAY) {
      if (DOMElements.watchAdButton) {
        DOMElements.watchAdButton.classList.remove("hidden");
        DOMElements.watchAdButton.disabled = false;
        DOMElements.watchAdButton.classList.remove(
          "opacity-50",
          "cursor-not-allowed"
        );
      }
    } else {
      if (DOMElements.watchAdButton) {
        DOMElements.watchAdButton.classList.add("hidden");
      }
      showCustomMessage(
        "Has alcanzado el límite de generaciones gratuitas y de anuncios por hoy. Vuelve mañana para más o considera una suscripción premium.",
        "info",
        7000
      );
    }
  } else {
    if (DOMElements.generateButton) {
      DOMElements.generateButton.disabled = false;
      DOMElements.generateButton.classList.remove(
        "opacity-50",
        "cursor-not-allowed"
      );
    }
    if (DOMElements.watchAdButton) {
      DOMElements.watchAdButton.classList.add("hidden");
    }
  }
};

export const simulateAdViewing = () => {
  if (!DOMElements.adModal || !DOMElements.adTimerDisplay) {
    showCustomMessage(
      "Error: Elementos del modal de anuncio no encontrados.",
      "error"
    );
    return;
  }

  DOMElements.adModal.classList.add("show");
  let timer = CONFIG.AD_VIEW_DURATION_SECONDS;
  DOMElements.adTimerDisplay.textContent = `Tiempo restante: ${timer} segundos`;

  const adInterval = setInterval(() => {
    timer--;
    DOMElements.adTimerDisplay.textContent = `Tiempo restante: ${timer} segundos`;
    if (timer <= 0) {
      clearInterval(adInterval);
      DOMElements.adModal.classList.remove("show");
      setAdsWatchedToday(adsWatchedToday + 1);
      setGenerationsToday(
        Math.max(0, generationsToday - CONFIG.AD_BONUS_GENERATIONS)
      ); // Resta de las generaciones usadas
      savePreferences();
      updateGenerationCounterDisplay();
      checkGenerationLimit();
      showCustomMessage(
        "¡Gracias por ver el anuncio! Has recibido +3 generaciones.",
        "success",
        3000
      );
    }
  }, 1000);
};
