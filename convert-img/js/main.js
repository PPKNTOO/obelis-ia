// convert-img/js/main.js

// Importaciones desde el directorio global de JS
import { DOMElements, showCustomMessage } from "../../js/global.js";

// Importaciones desde los nuevos módulos de convert-img
import { originalImage } from "./state.js";
import { loadPreferences } from "./storage.js";
import { convertImage, drawImageOnCanvas } from "./imageProcessing.js";
import { handleImageUpload } from "./fileHandler.js";
import { downloadImageFromBlob } from "./downloadManager.js";
import { handleFormatSelectChange } from "./uiUpdater.js";
import { simulateAdViewing } from "./limitManager.js";

// ✅ Exportamos la función para que app.js la pueda llamar
export function initApp() {
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
    adModal: document.getElementById("adModal"), // Necesario para limitManager
    adTimerDisplay: document.getElementById("adTimer"), // Necesario para limitManager
  });

  // Asignar contexto del canvas
  if (DOMElements.imageCanvas) {
    const canvasCtx = DOMElements.imageCanvas.getContext("2d");
    DOMElements.ctx = canvasCtx; // Lo añadimos directamente a DOMElements para que otros módulos lo usen
  } else {
    console.error("Error: Elemento canvas no encontrado.");
  }

  // Cargar preferencias al inicio
  loadPreferences();

  // --- Event Listeners ESPECÍFICOS DEL MÓDULO ---

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
      if (e.dataTransfer.files.length > 0) {
        DOMElements.imageUpload.files = e.dataTransfer.files;
        handleImageUpload({ target: DOMElements.imageUpload });
      }
    });
  }

  if (DOMElements.outputFormatSelect)
    DOMElements.outputFormatSelect.addEventListener(
      "change",
      handleFormatSelectChange
    );
  if (DOMElements.convertBtn)
    DOMElements.convertBtn.addEventListener("click", convertImage);
  if (DOMElements.downloadBtn)
    DOMElements.downloadBtn.addEventListener("click", downloadImageFromBlob);
  if (DOMElements.watchAdButton)
    DOMElements.watchAdButton.addEventListener("click", simulateAdViewing);

  window.addEventListener("resize", () => {
    if (originalImage) {
      drawImageOnCanvas(originalImage);
    }
  });

  // Estado inicial de los botones
  if (DOMElements.convertBtn) {
    DOMElements.convertBtn.disabled = true;
    DOMElements.convertBtn.classList.add("disabled-btn");
  }
  if (DOMElements.downloadBtn) {
    DOMElements.downloadBtn.disabled = true;
    DOMElements.downloadBtn.classList.add("disabled-btn");
  }
}

// ❌ ELIMINAMOS EL 'DOMContentLoaded' DE AQUÍ
