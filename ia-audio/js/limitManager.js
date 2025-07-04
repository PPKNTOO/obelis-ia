// ia-audio/js/limitManager.js

import { DOMElements, showCustomMessage } from "../../js/global.js";

let canGenerate = false;
const AD_DURATION_SECONDS = 30;
// URL de un video de YouTube de 30 segundos como ejemplo.
// Reemplázala con la URL de tu anuncio real. El &autoplay=1 es clave.
// Puedes usar un video de YouTube o un iframe de otro proveedor de anuncios.
// Asegúrate de que el video tenga una duración de 30 segundos para que coincida con AD_DURATION_SECONDS.
// Si usas un video de YouTube, asegúrate de que tenga la opción de autoplay habilitada
// y que no tenga controles visibles para una mejor experiencia de usuario.
// Aquí usamos un video de YouTube como ejemplo, pero puedes reemplazarlo con tu propio anuncio.
const AD_URL =
  "https://www.youtube.com/embed/1xUuAITuzHI?si=ccJLMPCKL_srgev_&amp;controls=0&autoplay=1";

// Actualiza el botón de generación de audio según el estado de canGenerate
// Si canGenerate es false, el botón muestra "Generar Música" y tiene la clase
// "btn-primary" para indicar que está disponible.
// Si canGenerate es true, el botón muestra "Generar Música" pero sin la clase
// "btn-primary", indicando que no está disponible para generar más música
function updateGenerateButtonUI() {
  if (!DOMElements.generateAudioBtn) return;

  if (!canGenerate) {
    DOMElements.generateAudioBtn.innerHTML = "Generar Música";
    DOMElements.generateAudioBtn.classList.add("btn-primary");
  } else {
    DOMElements.generateAudioBtn.innerHTML = "Generar Música";
    DOMElements.generateAudioBtn.classList.remove("btn-primary");
  }
}

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

    DOMElements.adIframeContainer.innerHTML = `<iframe src="${AD_URL}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    DOMElements.adModal.classList.add("show");
    DOMElements.adTimer.textContent = "El anuncio comenzará en breve...";

    const startTimer = () => {
      // Eliminar el listener para que no se active múltiples veces
      window.removeEventListener("message", messageListener);

      let timeLeft = AD_DURATION_SECONDS;
      DOMElements.adTimer.textContent = `Puedes continuar en ${timeLeft} segundos...`;

      const timerInterval = setInterval(() => {
        timeLeft--;
        DOMElements.adTimer.textContent = `Puedes continuar en ${timeLeft} segundos...`;

        if (timeLeft <= 0) {
          clearInterval(timerInterval);
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
    };

    // Listener para esperar el mensaje del iframe (o simularlo)
    const messageListener = (event) => {
      // Para una integración real, verificarías event.origin
      if (event.data === "video-started") {
        startTimer();
      }
    };
    window.addEventListener("message", messageListener);

    // SIMULACIÓN: Si el iframe no envía un mensaje (como en el caso de YouTube),
    // iniciamos el temporizador después de un breve retraso para simular la carga.
    // Para una integración real con un proveedor de anuncios, usarías el listener de arriba.
    setTimeout(() => {
      // Verificamos si el temporizador ya ha comenzado (por si el mensaje llegó)
      if (DOMElements.adTimer.textContent.includes("breve")) {
        startTimer();
      }
    }, 15000); // Espera 3 segundos para que el video cargue y empiece
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
