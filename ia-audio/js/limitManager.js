// ia-audio/js/limitManager.js

import { DOMElements, showCustomMessage } from "../../js/global.js";

// --- Estado ---
// En lugar de créditos, usamos una bandera simple: ¿puede el usuario generar ahora?
let canGenerate = false;
const AD_DURATION_SECONDS = 30;
const AD_URL = "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1"; // URL de ejemplo

/**
 * Actualiza la UI del botón de generar.
 */
function updateGenerateButtonUI() {
  if (!DOMElements.generateAudioBtn) return;

  if (!canGenerate) {
    DOMElements.generateAudioBtn.innerHTML =
      '<i class="fas fa-play-circle mr-2"></i> Ver Anuncio para Generar';
    DOMElements.generateAudioBtn.classList.add(
      "bg-yellow-600",
      "hover:bg-yellow-700"
    );
    DOMElements.generateAudioBtn.classList.remove("btn-primary");
  } else {
    DOMElements.generateAudioBtn.innerHTML = "Generar Música";
    DOMElements.generateAudioBtn.classList.remove(
      "bg-yellow-600",
      "hover:bg-yellow-700"
    );
    DOMElements.generateAudioBtn.classList.add("btn-primary");
  }
}

/**
 * Muestra el modal del anuncio y otorga permiso para UNA generación al terminar.
 * @returns {Promise<boolean>} - Resuelve a 'true' si el anuncio se completó.
 */
function showAd() {
  return new Promise((resolve) => {
    if (
      !DOMElements.adModal ||
      !DOMElements.adIframeContainer ||
      !DOMElements.adTimer
    ) {
      resolve(false);
      return;
    }

    DOMElements.adIframeContainer.innerHTML = `<iframe src="${AD_URL}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    DOMElements.adModal.classList.remove("hidden");

    let timeLeft = AD_DURATION_SECONDS;
    DOMElements.adTimer.textContent = `Puedes continuar en ${timeLeft} segundos...`;

    const timerInterval = setInterval(() => {
      timeLeft--;
      DOMElements.adTimer.textContent = `Puedes continuar en ${timeLeft} segundos...`;

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        DOMElements.adModal.classList.add("hidden");
        DOMElements.adIframeContainer.innerHTML = "";

        canGenerate = true; // Otorga permiso para UNA generación
        updateGenerateButtonUI();
        showCustomMessage(
          "¡Gracias! Ahora puedes generar una pista de audio.",
          "success"
        );
        resolve(true);
      }
    }, 1000);
  });
}

/**
 * Comprueba si el usuario debe ver un anuncio.
 * @returns {Promise<boolean>} - Resuelve a 'true' si el usuario puede proceder.
 */
export async function checkAdRequirement() {
  if (canGenerate) {
    return true;
  } else {
    return await showAd();
  }
}

/**
 * Revoca el permiso de generación después de usarlo.
 */
export function useGenerationCredit() {
  canGenerate = false;
  updateGenerateButtonUI();
}

/**
 * Inicializa el estado del botón al cargar la página.
 */
export function initLimitManager() {
  // El usuario siempre empieza sin permiso para generar.
  canGenerate = false;
  updateGenerateButtonUI();
}
