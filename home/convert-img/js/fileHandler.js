// convert-img/js/fileHandler.js

import {
  DOMElements,
  showCustomMessage,
  showLoadingOverlay,
  hideLoadingOverlay,
} from "../../js/global.js";
import {
  originalImage,
  convertedBlob,
  ctx,
  setOriginalImage,
  setConvertedBlob,
} from "./state.js";
import { drawImageOnCanvas } from "./imageProcessing.js";
import { checkConversionLimit } from "./limitManager.js";

export function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    if (DOMElements.fileNameSpan)
      DOMElements.fileNameSpan.textContent = file.name;
    showCustomMessage("Cargando imagen...", "info", 2000);
    showLoadingOverlay("Cargando imagen, por favor espera...");

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        setOriginalImage(img); // Almacenar la imagen original en el estado
        drawImageOnCanvas(originalImage); // Dibujar en el canvas

        // Habilitar/deshabilitar botones después de la carga
        if (DOMElements.convertBtn) {
          DOMElements.convertBtn.disabled = false;
          DOMElements.convertBtn.classList.remove("disabled-btn");
        }
        if (DOMElements.downloadBtn) {
          DOMElements.downloadBtn.disabled = true; // Deshabilitar hasta que se convierta
          DOMElements.downloadBtn.classList.add("disabled-btn");
        }
        setConvertedBlob(null); // Resetear el blob convertido

        hideLoadingOverlay();
        showCustomMessage("Imagen cargada exitosamente.", "success", 2000);
        checkConversionLimit(); // Verificar límites después de cargar
      };
      img.onerror = function () {
        showCustomMessage(
          "No se pudo cargar la imagen. Asegúrate de que es un archivo de imagen válido.",
          "error"
        );
        resetUIForNewUpload();
        hideLoadingOverlay();
        checkConversionLimit();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    resetUIForNewUpload();
    hideLoadingOverlay(); // Ocultar si no se seleccionó archivo
  }
}

function resetUIForNewUpload() {
  if (DOMElements.fileNameSpan)
    DOMElements.fileNameSpan.textContent = "Ningún archivo seleccionado";
  setOriginalImage(null); // Limpiar imagen original
  setConvertedBlob(null); // Limpiar blob convertido

  if (DOMElements.convertBtn) {
    DOMElements.convertBtn.disabled = true;
    DOMElements.convertBtn.classList.add("disabled-btn");
  }
  if (DOMElements.downloadBtn) {
    DOMElements.downloadBtn.disabled = true;
    DOMElements.downloadBtn.classList.add("disabled-btn");
  }
  if (DOMElements.placeholderText)
    DOMElements.placeholderText.classList.remove("hidden");
  if (ctx && DOMElements.imageCanvas) {
    ctx.clearRect(
      0,
      0,
      DOMElements.imageCanvas.width,
      DOMElements.imageCanvas.height
    );
  }
  if (DOMElements.imageCanvas) {
    DOMElements.imageCanvas.style.width = "";
    DOMElements.imageCanvas.style.height = "";
  }
  showCustomMessage("Selecciona un archivo para empezar.", "info", 2000); // Resetear mensaje
}
