// ia-audio/js/main.js

// 1. Importa el DOMElements compartido y las funciones que necesites.
import { DOMElements } from "../../js/global.js";
import { handleGenerateAudio, handleImprovePrompt } from "./aiService.js";
import { initLimitManager } from "./limitManager.js";

/**
 * Función principal que se exporta para ser llamada por app.js
 */
export function initApp() {
  // 2. Añade los elementos de ESTA PÁGINA al objeto DOMElements.
  Object.assign(DOMElements, {
    promptAudio: document.getElementById("prompt-audio"),
    genreSelect: document.getElementById("genre-select"),
    moodSelect: document.getElementById("mood-select"),
    durationSlider: document.getElementById("duration-slider"),
    durationValue: document.getElementById("duration-value"),
    generateAudioBtn: document.getElementById("generate-audio-btn"),
    improvePromptBtn: document.getElementById("improve-prompt-btn"), // ✅ Nuevo botón
    audioPlayerContainer: document.getElementById("audio-player-container"),
    audioPlayer: document.getElementById("audio-player"),
    downloadAudioLink: document.getElementById("download-audio-link"),
    adModal: document.getElementById("ad-modal"),
    adIframeContainer: document.getElementById("ad-iframe-container"),
    adTimer: document.getElementById("ad-timer"),
  });

  // 3. Inicializa el gestor de límites para configurar la UI de los créditos.
  initLimitManager();

  // 4. Asigna los listeners a los botones y controles.
  setupEventListeners();
}

/**
 * Función interna para configurar todos los event listeners de la página.
 */
function setupEventListeners() {
  // Asigna la función de generar audio al botón principal.
  if (DOMElements.generateAudioBtn) {
    DOMElements.generateAudioBtn.addEventListener("click", handleGenerateAudio);
  }

  // ✅ Asigna la nueva función de mejorar prompt al botón correspondiente.
  if (DOMElements.improvePromptBtn) {
    DOMElements.improvePromptBtn.addEventListener("click", handleImprovePrompt);
  }

  // Actualiza el texto de la duración cuando se mueve el slider.
  if (DOMElements.durationSlider && DOMElements.durationValue) {
    DOMElements.durationSlider.addEventListener("input", (event) => {
      DOMElements.durationValue.textContent = `${event.target.value}s`;
    });
  }
}
