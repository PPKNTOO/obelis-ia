// ia-audio/js/limitManager.js

import { DOMElements, showCustomMessage } from "../../js/global.js";

let canGenerate = false;
const AD_DURATION_SECONDS = 30;
const AD_URL = "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"; // URL de ejemplo

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

    DOMElements.adIframeContainer.innerHTML = `<iframe src="${AD_URL}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;

    // ✅ CORRECCIÓN: Usamos .add('show') para hacerlo visible, igual que los otros modales.
    DOMElements.adModal.classList.add("show");

    let timeLeft = AD_DURATION_SECONDS;
    DOMElements.adTimer.textContent = `Puedes continuar en ${timeLeft} segundos...`;

    const timerInterval = setInterval(() => {
      timeLeft--;
      DOMElements.adTimer.textContent = `Puedes continuar en ${timeLeft} segundos...`;

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        // ✅ CORRECCIÓN: Usamos .remove('show') para ocultarlo.
        DOMElements.adModal.classList.remove("show");
        DOMElements.adIframeContainer.innerHTML = "";

        canGenerate = true;
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

export async function checkAdRequirement() {
  if (canGenerate) {
    return true;
  } else {
    return await showAd();
  }
}

export function useGenerationCredit() {
  canGenerate = false;
  updateGenerateButtonUI();
}

export function initLimitManager() {
  canGenerate = false;
  updateGenerateButtonUI();
}
