// ia-text/js/main.js

// Importaciones desde el directorio global de JS
import {
  DOMElements,
  showCustomMessage,
  showLoadingOverlay,
  hideLoadingOverlay,
} from "../../js/global.js";

// Importaciones desde los nuevos módulos de ia-text
import { CONFIG } from "./config.js";
import {
  setGenerationsToday,
  setAdsWatchedToday,
  setLastActivityDate,
  resetDailyStateIfNeeded,
  isPlayingAudio, // Importar isPlayingAudio para el listener del botón
} from "./state.js";
import { savePreferences, loadPreferences } from "./storage.js";
import { loadVoices, updateSpecificVoices } from "./voiceManager.js";
import {
  updateGenerationCounterDisplay,
  checkGenerationLimit,
  simulateAdViewing,
} from "./limitManager.js";
import { handleGenerateContent } from "./aiService.js";
import { playAudio, stopAudio } from "./audioPlayer.js";
import { copyTextToClipboard, downloadPdf } from "./clipboardDownload.js";
import { renderContentHistory, clearContentHistory } from "./historyManager.js";

// initApp: la función principal de inicialización para este módulo
function initApp() {
  // Asignar elementos del DOM a DOMElements
  // Es crucial que estos IDs existan en el HTML
  Object.assign(DOMElements, {
    contentForm: document.getElementById("contentForm"),
    promptInput: document.getElementById("prompt"),
    generateButton: document.getElementById("generateButton"),
    buttonText: document.getElementById("buttonText"),
    spinner: document.getElementById("spinner"), // Spinner dentro del botón
    generatedTextDiv: document.getElementById("generatedText"),
    togglePlayPauseButton: document.getElementById("togglePlayPauseButton"),
    playIcon: document.getElementById("playIcon"),
    pauseIcon: document.getElementById("pauseIcon"),
    voiceLanguageSelect: document.getElementById("voiceLanguage"),
    voiceSelect: document.getElementById("voiceSelect"),
    downloadPdfButton: document.getElementById("downloadPdfButton"),
    contentTypeOptions: document.getElementById("contentTypeOptions"),
    copyTextButton: document.getElementById("copyTextButton"),
    toneSelect: document.getElementById("toneSelect"),

    contentModal: document.getElementById("contentModal"), // Modal de contenido generado
    modalCloseButton: document.getElementById("modalCloseButton"),
    contentHistoryContainer: document.getElementById("contentHistoryContainer"), // Contenedor del historial
    clearHistoryButton: document.getElementById("clearHistoryButton"), // Botón de limpiar historial
    generationCounterDisplay: document.getElementById(
      "generationCounterDisplay"
    ), // Contador de generaciones
    watchAdButton: document.getElementById("watchAdButton"), // Botón de ver anuncio

    // adModal específico de ia-text (el que simula el anuncio)
    adModal: document.getElementById("adModal"),
    adTimerDisplay: document.getElementById("adTimer"),
  });

  // --- Inicialización Específica del Módulo ---
  loadPreferences(); // Carga las preferencias y el estado del día
  renderContentHistory(); // Renderiza el historial al inicio

  // --- LISTENERS DE EVENTOS ESPECÍFICOS DEL MÓDULO ---
  if (DOMElements.contentTypeOptions) {
    DOMElements.contentTypeOptions.addEventListener("change", (event) => {
      if (event.target.name === "contentType") {
        const selectedType = event.target.value;
        if (DOMElements.promptInput) {
          DOMElements.promptInput.placeholder =
            CONFIG.PLACEHOLDERS[selectedType] || CONFIG.PLACEHOLDERS.story;
        }
        savePreferences();
      }
    });
  }

  if (DOMElements.toneSelect) {
    DOMElements.toneSelect.addEventListener("change", savePreferences);
  }
  if (DOMElements.voiceLanguageSelect) {
    DOMElements.voiceLanguageSelect.addEventListener("change", () => {
      updateSpecificVoices();
      savePreferences();
    });
  }
  if (DOMElements.voiceSelect) {
    DOMElements.voiceSelect.addEventListener("change", savePreferences);
  }

  if (DOMElements.contentForm) {
    DOMElements.contentForm.addEventListener("submit", handleGenerateContent);
  }
  if (DOMElements.togglePlayPauseButton) {
    DOMElements.togglePlayPauseButton.addEventListener("click", () => {
      if (isPlayingAudio) {
        stopAudio();
      } else {
        playAudio();
      }
    });
  }
  if (DOMElements.copyTextButton) {
    DOMElements.copyTextButton.addEventListener("click", copyTextToClipboard);
  }
  if (DOMElements.downloadPdfButton) {
    DOMElements.downloadPdfButton.addEventListener("click", downloadPdf);
  }

  if (DOMElements.modalCloseButton) {
    DOMElements.modalCloseButton.addEventListener("click", () => {
      if (DOMElements.contentModal)
        DOMElements.contentModal.classList.remove("show");
      stopAudio();
    });
  }
  if (DOMElements.contentModal) {
    DOMElements.contentModal.addEventListener("click", (event) => {
      if (event.target === DOMElements.contentModal) {
        DOMElements.contentModal.classList.remove("show");
        stopAudio();
      }
    });
  }

  if (DOMElements.clearHistoryButton) {
    DOMElements.clearHistoryButton.addEventListener(
      "click",
      clearContentHistory
    );
  }
  if (DOMElements.watchAdButton) {
    DOMElements.watchAdButton.addEventListener("click", simulateAdViewing);
  }

  // Los event listeners para loadingModalCloseButton, subscriptionModal, cookieConsent, messageModal
  // ya están en global.js y deberían funcionar globalmente.
}

// Llama a initApp cuando el DOM esté completamente cargado
// NOTA: Asegúrate de que global.js se cargue ANTES de este script en el HTML.
document.addEventListener("DOMContentLoaded", initApp);
