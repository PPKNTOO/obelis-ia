// convert-img/js/main.js

// Importaciones desde el directorio global de JS
import {
  DOMElements,
  showCustomMessage,
  updateLocalStorageUsage,
  toggleFaqAnswer,
} from "../../js/global.js";

// Importaciones desde los nuevos módulos de convert-img
import { CONFIG } from "./config.js";
import {
  originalImage,
  ctx,
  setCtx,
  setOriginalImage,
  setConvertedBlob,
  resetDailyCountersIfNeeded,
} from "./state.js";
import { loadPreferences, savePreferences } from "./storage.js";
import { checkConversionLimit, simulateAdViewing } from "./limitManager.js";
import { drawImageOnCanvas, convertImage } from "./imageProcessing.js";
import { handleImageUpload } from "./fileHandler.js";
import { downloadImageFromBlob } from "./downloadManager.js";
import {
  updateConversionCounterUI,
  handleFormatSelectChange,
  toggleControlsState,
} from "./uiUpdater.js";

// initApp: la función principal de inicialización para este módulo
function initApp() {
  // Asignar elementos del DOM a DOMElements (extender el objeto global)
  Object.assign(DOMElements, {
    imageUpload: document.getElementById("imageUpload"),
    fileNameSpan: document.getElementById("fileName"),
    imageCanvas: document.getElementById("imageCanvas"),
    placeholderText: document.getElementById("placeholderText"),
    outputFormatSelect: document.getElementById("outputFormat"),
    convertBtn: document.getElementById("convertBtn"),
    downloadBtn: document.getElementById("downloadBtn"),
    conversionCounterDisplay: document.getElementById(
      "conversionCounterDisplay"
    ),
    watchAdButton: document.getElementById("watchAdButton"),
    fileInputArea: document.querySelector('label[for="imageUpload"]'),
  });

  // Asignar contexto del canvas una vez que el elemento esté en DOMElements
  if (DOMElements.imageCanvas) {
    const canvasCtx = DOMElements.imageCanvas.getContext("2d");
    setCtx(canvasCtx); // Almacenar el contexto en el estado global del módulo
  } else {
    console.error(
      "Error: Canvas element not found! Conversion functionality might be limited."
    );
  }

  // Cargar preferencias de conversiones al inicio
  loadPreferences();

  // --- Event Listeners ESPECÍFICOS DEL MÓDULO ---

  // Input de archivo y arrastrar/soltar
  if (DOMElements.imageUpload)
    DOMElements.imageUpload.addEventListener("change", handleImageUpload);
  if (DOMElements.fileInputArea) {
    DOMElements.fileInputArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      DOMElements.fileInputArea.classList.add("border-cyan-500", "bg-gray-700");
    });
    DOMElements.fileInputArea.addEventListener("dragleave", (e) => {
      e.preventDefault();
      DOMElements.fileInputArea.classList.remove(
        "border-cyan-500",
        "bg-gray-700"
      );
    });
    DOMElements.fileInputArea.addEventListener("drop", (e) => {
      e.preventDefault();
      DOMElements.fileInputArea.classList.remove(
        "border-cyan-500",
        "bg-gray-700"
      );
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        DOMElements.imageUpload.files = files;
        DOMElements.imageUpload.dispatchEvent(new Event("change")); // Disparar el evento change
      }
    });
  }

  // Controles de conversión
  if (DOMElements.outputFormatSelect)
    DOMElements.outputFormatSelect.addEventListener("change", () =>
      handleFormatSelectChange()
    );
  if (DOMElements.convertBtn)
    DOMElements.convertBtn.addEventListener("click", () => convertImage());
  if (DOMElements.downloadBtn)
    DOMElements.downloadBtn.addEventListener("click", () =>
      downloadImageFromBlob()
    );

  // Límite de conversiones y anuncios
  if (DOMElements.watchAdButton)
    DOMElements.watchAdButton.addEventListener("click", () =>
      simulateAdViewing()
    );

  // Reajustar canvas al cambiar el tamaño de la ventana
  window.addEventListener("resize", () => {
    if (originalImage) {
      drawImageOnCanvas(originalImage);
    }
  });

  // Asegurar el estado inicial de los botones
  if (DOMElements.convertBtn) {
    DOMElements.convertBtn.disabled = true;
    DOMElements.convertBtn.classList.add("disabled-btn");
  }
  if (DOMElements.downloadBtn) {
    DOMElements.downloadBtn.disabled = true;
    DOMElements.downloadBtn.classList.add("disabled-btn");
  }

  // La lógica del FAQ ya se maneja en global.js
}

// Llama a initApp cuando el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", initApp);
