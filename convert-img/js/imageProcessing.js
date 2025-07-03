// convert-img/js/imageProcessing.js

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
  conversionsToday,
  setConvertedBlob,
  setConversionsToday,
} from "./state.js"; // <-- AÑADIDO conversionsToday
import { savePreferences } from "./storage.js";
import { updateConversionCounterUI } from "./uiUpdater.js";
import { checkConversionLimit } from "./limitManager.js";

export function drawImageOnCanvas(img) {
  if (!DOMElements.placeholderText || !DOMElements.imageCanvas || !ctx) return;

  DOMElements.placeholderText.classList.add("hidden");

  DOMElements.imageCanvas.width = img.width;
  DOMElements.imageCanvas.height = img.height;

  const parentContainer = DOMElements.imageCanvas.parentElement;
  const maxWidth = parentContainer.offsetWidth;
  const maxHeight = parentContainer.offsetHeight;
  let ratio = 1;
  if (img.width > maxWidth) {
    ratio = maxWidth / img.width;
  }
  // Asegura que la imagen no exceda la altura máxima si el ancho ya se ajustó
  if (img.height * ratio > maxHeight && img.height * ratio !== 0) {
    ratio = maxHeight / img.height;
  }

  DOMElements.imageCanvas.style.width = `${img.width * ratio}px`;
  DOMElements.imageCanvas.style.height = `${img.height * ratio}px`;

  ctx.clearRect(
    0,
    0,
    DOMElements.imageCanvas.width,
    DOMElements.imageCanvas.height
  );
  ctx.drawImage(img, 0, 0);
}

export function convertImage() {
  if (!originalImage) {
    showCustomMessage("Por favor, selecciona una imagen primero.", "error");
    return;
  }

  // La verificación de límite se hace aquí también antes de empezar la carga
  checkConversionLimit();
  if (DOMElements.convertBtn.disabled) {
    // Si checkConversionLimit deshabilitó el botón
    showCustomMessage(
      "Has alcanzado tu límite de conversiones.",
      "error",
      5000
    );
    return;
  }

  showCustomMessage("Realizando conversión...", "info", 5000);
  showLoadingOverlay("Procesando imagen, por favor espera..."); // Usar showLoadingOverlay global

  const targetFormat = DOMElements.outputFormatSelect.value;
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  tempCanvas.width = originalImage.width;
  tempCanvas.height = originalImage.height;

  // Si el formato de destino no soporta transparencia, rellenar con blanco
  if (
    targetFormat === "image/jpeg" ||
    targetFormat === "image/bmp" ||
    targetFormat === "image/tiff"
  ) {
    // Verificar si la imagen original podría tener transparencia
    if (
      originalImage.src.startsWith("data:image/png") ||
      originalImage.src.startsWith("data:image/gif") ||
      originalImage.src.startsWith("data:image/webp")
    ) {
      tempCtx.fillStyle = "#ffffff"; // Fondo blanco
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    }
  }

  tempCtx.drawImage(originalImage, 0, 0);

  const quality = 0.9; // Calidad para formatos con pérdida

  // Manejo de formatos no soportados directamente por toBlob o que requieren consideración
  if (
    targetFormat === "application/pdf" ||
    targetFormat === "image/vnd.adobe.photoshop" ||
    targetFormat === "image/x-raw" ||
    targetFormat === "image/dng" ||
    targetFormat === "image/svg+xml"
  ) {
    showCustomMessage(
      `La conversión a ${targetFormat
        .split("/")[1]
        .toUpperCase()} no es directamente compatible desde el navegador para todos los tipos de imagen sin librerías avanzadas o procesamiento en el servidor. La imagen será convertida a PNG para descarga.`,
      "warning",
      8000
    );
    tempCanvas.toBlob(handleBlobConversion, "image/png", quality); // Se convierte a PNG como fallback
  } else if (
    targetFormat === "image/gif" ||
    targetFormat === "image/bmp" ||
    targetFormat === "image/tiff" ||
    targetFormat === "image/x-icon" ||
    targetFormat === "image/avif" ||
    targetFormat === "image/heif" || // HEIF es complejo de salida
    targetFormat === "image/jp2" ||
    targetFormat === "image/jpx"
  ) {
    showCustomMessage(
      `La conversión a ${targetFormat
        .split("/")[1]
        .toUpperCase()} tiene compatibilidad limitada y puede no funcionar correctamente en todos los navegadores o convertir GIFs a estáticos.`,
      "warning",
      5000
    );
    tempCanvas.toBlob(handleBlobConversion, targetFormat, quality);
  } else {
    // Formatos comunes y bien soportados
    tempCanvas.toBlob(handleBlobConversion, targetFormat, quality);
  }
}

function handleBlobConversion(blob) {
  const targetFormat = DOMElements.outputFormatSelect.value;
  if (blob) {
    setConvertedBlob(blob); // Actualizar el estado global
    if (DOMElements.downloadBtn) {
      DOMElements.downloadBtn.disabled = false;
      DOMElements.downloadBtn.classList.remove("disabled-btn");
    }
    showCustomMessage(
      `Imagen convertida a ${targetFormat.split("/")[1].toUpperCase()}.`,
      "success"
    );

    setConversionsToday(conversionsToday + 1); // Aumentar el contador de conversiones
    savePreferences(); // Guardar las preferencias actualizadas
    updateConversionCounterUI(); // Actualizar el contador en la UI
    checkConversionLimit(); // Volver a verificar límites
  } else {
    setConvertedBlob(null); // Asegurarse de que no hay un blob si falló
    if (DOMElements.downloadBtn) {
      DOMElements.downloadBtn.disabled = true;
      DOMElements.downloadBtn.classList.add("disabled-btn");
    }
    showCustomMessage(
      `Error al convertir la imagen a ${targetFormat
        .split("/")[1]
        .toUpperCase()}. Es posible que su navegador no admita este formato de salida o la conversión falló.`,
      "error"
    );
  }
  hideLoadingOverlay(); // Ocultar el modal de carga
}
