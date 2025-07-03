// ia-audio/js/limitManager.js

import { DOMElements, showCustomMessage } from "../../js/global.js";

// --- Estado ---
let generationCredits = 2; // El usuario empieza con 2 generaciones gratuitas
const AD_DURATION_SECONDS = 30; // Duración del anuncio
const AD_URL = "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1"; // URL de ejemplo para el iframe del anuncio

/**
 * Actualiza la UI del botón de generar para reflejar los créditos restantes.
 */
function updateGenerateButtonUI() {
  if (!DOMElements.generateAudioBtn) return;

  if (generationCredits <= 0) {
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
 * Muestra el modal del anuncio y resuelve una promesa cuando el temporizador termina.
 * @returns {Promise<boolean>} - Resuelve a 'true' si el anuncio se completó.
 */
function showAd() {
  return new Promise((resolve) => {
    if (
      !DOMElements.adModal ||
      !DOMElements.adIframeContainer ||
      !DOMElements.adTimer
    ) {
      showCustomMessage(
        "Error: No se encontraron los elementos del modal de anuncio.",
        "error"
      );
      resolve(false);
      return;
    }

    // Inserta el iframe del anuncio
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
        DOMElements.adIframeContainer.innerHTML = ""; // Limpia el iframe

        generationCredits = 2; // Otorga 2 nuevos créditos de generación
        updateGenerateButtonUI();
        showCustomMessage(
          "¡Gracias! Has obtenido 2 nuevos créditos de generación.",
          "success"
        );
        resolve(true); // El anuncio se completó exitosamente
      }
    }, 1000);
  });
}

/**
 * Comprueba si el usuario tiene créditos. Si no, fuerza a ver un anuncio.
 * @returns {Promise<boolean>} - Resuelve a 'true' si el usuario puede generar, 'false' si no.
 */
export async function checkAdRequirement() {
  if (generationCredits > 0) {
    return true; // El usuario tiene créditos, puede continuar.
  } else {
    // El usuario no tiene créditos, muestra el anuncio.
    // La función showAd() se encargará de todo el proceso.
    const adWatched = await showAd();
    return adWatched; // Devuelve true si el anuncio se completó, permitiendo la generación.
  }
}

/**
 * Decrementa un crédito después de una generación exitosa.
 */
export function useGenerationCredit() {
  if (generationCredits > 0) {
    generationCredits--;
  }
  updateGenerateButtonUI();
}

/**
 * Inicializa el estado del botón al cargar la página.
 */
export function initLimitManager() {
  // Podrías cargar los créditos desde localStorage si quisieras persistencia
  updateGenerateButtonUI();
}
