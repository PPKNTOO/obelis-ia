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
    adModal: document.getElementById("ad-modal"), // ✅ Nuevo modal
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
      updateSliderFill(event.target); // <-- Línea añadida
    });
  }
}

/**
 * Actualiza el fondo del slider para mostrar el progreso.
 * @param {HTMLInputElement} slider - El elemento del slider.
 */
// Esta función se llama cada vez que el usuario mueve el slider.
// Actualiza el fondo del slider para reflejar el valor actual.
// Utiliza un gradiente lineal para mostrar el porcentaje de progreso.
// El color del progreso es #0891b2 y el color del fondo es #374151.
// El porcentaje se calcula como ((valor actual - valor mínimo) / (valor máximo - valor mínimo)) * 100.
// El gradiente se aplica de izquierda a derecha, mostrando el progreso en el color #0891b2 y el resto en #374151.
// Esto proporciona una visualización clara del progreso del slider.
function updateSliderFill(slider) {
  const percentage =
    ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
  slider.style.background = `linear-gradient(to right, #0891b2 ${percentage}%, #374151 ${percentage}%)`;
}
