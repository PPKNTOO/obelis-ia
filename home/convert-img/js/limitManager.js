// convert-img/js/limitManager.js

import {
  conversionsToday,
  adsWatchedToday,
  setAdsWatchedToday,
  setConversionsToday,
} from "./state.js";
import { CONFIG } from "./config.js";
import {
  DOMElements,
  showCustomMessage,
  showLoadingOverlay,
  hideLoadingOverlay,
} from "../../js/global.js";
import { savePreferences } from "./storage.js";
import { updateConversionCounterUI } from "./uiUpdater.js"; // Importar para asegurar la actualización de UI

export function checkConversionLimit() {
  if (!DOMElements.convertBtn || !DOMElements.watchAdButton) return;

  const totalAllowed =
    CONFIG.MAX_FREE_CONVERSIONS +
    adsWatchedToday * CONFIG.CONVERSIONS_PER_AD_WATCH;

  if (conversionsToday >= totalAllowed) {
    DOMElements.convertBtn.disabled = true;
    DOMElements.convertBtn.classList.add("disabled-btn");

    if (adsWatchedToday < CONFIG.MAX_ADS_PER_DAY) {
      DOMElements.watchAdButton.classList.remove("hidden");
      DOMElements.watchAdButton.disabled = false;
      DOMElements.watchAdButton.classList.remove(
        "opacity-50",
        "cursor-not-allowed"
      );
    } else {
      DOMElements.watchAdButton.classList.add("hidden");
      showCustomMessage(
        "Has alcanzado el límite de conversiones gratuitas y de anuncios por hoy. Vuelve mañana para más o considera una suscripción premium.",
        "info",
        10000
      );
    }
  } else {
    DOMElements.convertBtn.disabled = false;
    DOMElements.convertBtn.classList.remove("disabled-btn");
    DOMElements.watchAdButton.classList.add("hidden");
  }
}

export function simulateAdViewing() {
  if (
    !DOMElements.adModal ||
    !DOMElements.adTimerDisplay ||
    !DOMElements.watchAdButton
  ) {
    showCustomMessage(
      "Error: Elementos del modal de anuncio no encontrados.",
      "error"
    );
    return;
  }

  DOMElements.adModal.classList.add("show");
  let timer = CONFIG.AD_VIEW_DURATION_SECONDS;
  DOMElements.adTimerDisplay.textContent = `Tiempo restante: ${timer} segundos`;

  // Deshabilitar botón de anuncio inmediatamente
  DOMElements.watchAdButton.disabled = true;
  DOMElements.watchAdButton.classList.add("opacity-50", "cursor-not-allowed");

  const adInterval = setInterval(() => {
    timer--;
    DOMElements.adTimerDisplay.textContent = `Tiempo restante: ${timer} segundos`;
    if (timer <= 0) {
      clearInterval(adInterval);
      DOMElements.adModal.classList.remove("show");
      setAdsWatchedToday(adsWatchedToday + 1);
      // Restar conversiones usadas para darle al usuario más capacidad de conversión
      setConversionsToday(
        Math.max(0, conversionsToday - CONFIG.CONVERSIONS_PER_AD_WATCH)
      );
      savePreferences();
      updateConversionCounterUI(); // Llama a la función de UI
      checkConversionLimit(); // Vuelve a verificar límites
      showCustomMessage(
        `¡Gracias por ver el anuncio! Has recibido +${CONFIG.CONVERSIONS_PER_AD_WATCH} conversiones.`,
        "success",
        3000
      );
    }
  }, 1000);
}
