// ia-audio/js/main.js

// 1. Importa el DOMElements compartido y las funciones que necesites.
import { DOMElements, showCustomMessage } from "../../js/global.js";
import { handleGenerateAudio } from "./aiService.js";

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
    audioPlayerContainer: document.getElementById("audio-player-container"),
    audioPlayer: document.getElementById("audio-player"),
    downloadAudioLink: document.getElementById("download-audio-link"),
  });

  // 3. Asigna los listeners a los botones y controles.
  setupEventListeners();
}

/**
 * Función interna para configurar todos los event listeners de la página.
 */
function setupEventListeners() {
  if (DOMElements.generateAudioBtn) {
    // Llama a la función desde aiService.js cuando se hace clic.
    DOMElements.generateAudioBtn.addEventListener("click", handleGenerateAudio);
  }

  if (DOMElements.durationSlider && DOMElements.durationValue) {
    // Actualiza el texto de la duración cuando se mueve el slider.
    DOMElements.durationSlider.addEventListener("input", (event) => {
      DOMElements.durationValue.textContent = `${event.target.value}s`;
    });
  }
}
