// convert-img/js/uiUpdater.js

import {
  DOMElements,
  showCustomMessage,
  showLoadingOverlay,
  hideLoadingOverlay,
} from "../../js/global.js";
import { conversionsToday, adsWatchedToday } from "./state.js";
import { CONFIG } from "./config.js";

export function updateConversionCounterUI() {
  if (!DOMElements.conversionCounterDisplay) return;
  const totalAllowed =
    CONFIG.MAX_FREE_CONVERSIONS +
    adsWatchedToday * CONFIG.CONVERSIONS_PER_AD_WATCH;
  DOMElements.conversionCounterDisplay.textContent = `Conversiones gratuitas restantes: ${Math.max(
    0,
    totalAllowed - conversionsToday
  )}/${totalAllowed}`;
}

export function handleFormatSelectChange() {
  if (!DOMElements.outputFormatSelect || !DOMElements.downloadBtn) return;

  const selectedValue = DOMElements.outputFormatSelect.value;
  // Habilitar el botón de descarga solo si hay un blob convertido Y se cambia el formato
  // Esto puede ser opcional, dependiendo de si quieres que el usuario descargue en el formato actual o siempre después de una nueva conversión.
  // Por simplicidad, el botón de descarga se gestiona principalmente después de la conversión exitosa.
  // Aquí solo se muestra el mensaje de advertencia si el formato tiene problemas.

  if (
    selectedValue === "image/gif" ||
    selectedValue === "image/bmp" ||
    selectedValue === "image/tiff" ||
    selectedValue === "image/x-icon" ||
    selectedValue === "application/pdf" ||
    selectedValue === "image/vnd.adobe.photoshop" ||
    selectedValue === "image/x-raw" ||
    selectedValue === "image/dng" ||
    selectedValue === "image/svg+xml" ||
    selectedValue === "image/heif" ||
    selectedValue === "image/avif" ||
    selectedValue === "image/jp2" ||
    selectedValue === "image/jpx"
  ) {
    let formatName = selectedValue.split("/")[1].toUpperCase();
    if (formatName === "X-ICON") formatName = "ICO";
    else if (formatName === "VND.ADOBE.PHOTOSHOP") formatName = "PSD";
    else if (formatName === "X-RAW") formatName = "RAW";
    else if (formatName === "SVG+XML") formatName = "SVG";
    else if (formatName === "JP2") formatName = "JPEG 2000 (JP2)";
    else if (formatName === "JPX") formatName = "JPEG 2000 (JPX)";

    showCustomMessage(
      `La conversión a ${formatName} tiene compatibilidad limitada o requiere librerías/servidor. Es posible que el navegador no soporte la salida directa, o que GIFs animados se conviertan a estáticos.`,
      "warning",
      8000
    );
  } else {
    // hideCustomMessage(); // Comentar si no quieres que el mensaje desaparezca inmediatamente
  }
}

/**
 * Controla la visibilidad y estado de los controles durante una operación de carga/conversión.
 * @param {boolean} show - true para mostrar carga y deshabilitar, false para ocultar y habilitar.
 */
export function toggleControlsState(show) {
  // Aquí usamos showLoadingOverlay/hideLoadingOverlay directamente desde global.js
  if (show) {
    showLoadingOverlay("Procesando imagen, por favor espera...");
  } else {
    hideLoadingOverlay();
  }

  // Deshabilitar/Habilitar controles
  const controlsToDisable = document.querySelectorAll(
    'button:not(#watchAdButton):not(#loadingModalCloseButton), input[type="file"], select'
  );
  controlsToDisable.forEach((control) => {
    control.disabled = show;
    control.classList.toggle("disabled-btn", show);
  });

  // Habilitar el input de archivo incluso durante la carga (para permitir reemplazar)
  if (DOMElements.imageUpload) {
    DOMElements.imageUpload.disabled = false;
  }
  // Asegurarse de que el área de arrastrar/soltar también esté activa
  if (DOMElements.fileInputArea) {
    DOMElements.fileInputArea.classList.toggle("pointer-events-none", show);
  }

  // Los botones de convertir y descargar se manejan individualmente en sus respectivas funciones
  // para evitar conflictos con el estado de `originalImage` y `convertedBlob`.
  if (DOMElements.convertBtn) {
    DOMElements.convertBtn.disabled = show || !originalImage;
    DOMElements.convertBtn.classList.toggle(
      "disabled-btn",
      show || !originalImage
    );
  }
  if (DOMElements.downloadBtn) {
    DOMElements.downloadBtn.disabled = show || !convertedBlob;
    DOMElements.downloadBtn.classList.toggle(
      "disabled-btn",
      show || !convertedBlob
    );
  }

  // El botón de anuncio se gestiona en limitManager.js
  if (DOMElements.watchAdButton) {
    DOMElements.watchAdButton.disabled = show; // Deshabilita durante cualquier carga
    DOMElements.watchAdButton.classList.toggle("opacity-50", show);
    DOMElements.watchAdButton.classList.toggle("cursor-not-allowed", show);
  }
}
