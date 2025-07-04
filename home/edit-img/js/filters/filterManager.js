// edit-img/js/filters/filterManager.js
import { applyGrayscaleFilter } from "./grayscaleFilter.js";
import { applySepiaFilter } from "./sepiaFilter.js";
import { applyInvertFilter } from "./invertFilter.js";
import { applyBlurFilter } from "./blurFilter.js";
import { applySharpenFilter } from "./sharpenFilter.js";
import { showMessage } from "../ui.js";
import { saveState, setHistoryState } from "../history.js";
import { drawImageOnCanvas } from "../canvas.js";

/**
 * Aplica un filtro a la imagen en el canvas.
 * @param {string} filterType - El tipo de filtro a aplicar ('grayscale', 'sepia', 'invert', 'blur', 'sharpen').
 * @param {HTMLCanvasElement} currentImageBuffer - El canvas de buffer actual.
 * @param {CanvasRenderingContext2D} editorCtx - El contexto 2D del canvas visible.
 * @param {function} drawImageOnCanvasCallback - Callback para dibujar la imagen en el canvas.
 * @param {function} saveStateCallback - Callback para guardar el estado.
 * @param {HTMLCanvasElement} imageCanvasElement - El elemento canvas visible.
 * @param {function} setHistoryStateCallback - Callback para reiniciar el historial.
 * @param {function} showMessageCallback - Callback para mostrar mensajes.
 * @param {HTMLElement} messageAreaElement - Elemento DOM del área de mensajes.
 * @param {HTMLInputElement} blurIntensityRange - Slider de intensidad de desenfoque.
 * @param {HTMLInputElement} sharpenIntensityRange - Slider de intensidad de enfoque.
 * @param {function} toggleLoadingCallback - Callback para alternar el estado de carga.
 * @param {HTMLElement} loadingSpinnerElement - El elemento DOM del spinner de carga.
 * @param {Object} DOMElements - Referencias a los elementos DOM.
 */
export function applyFilter(
  filterType,
  currentImageBuffer,
  editorCtx,
  drawImageOnCanvasCallback,
  saveStateCallback,
  imageCanvasElement,
  setHistoryStateCallback,
  showMessageCallback,
  messageAreaElement,
  blurIntensityRange,
  sharpenIntensityRange,
  toggleLoadingCallback,
  loadingSpinnerElement,
  DOMElements
) {
  if (!currentImageBuffer || !editorCtx || !imageCanvasElement) {
    showMessageCallback(
      "Carga una imagen antes de aplicar filtros.",
      "warning",
      messageAreaElement
    );
    toggleLoadingCallback(false, loadingSpinnerElement, DOMElements);
    return;
  }

  // Clonar el buffer actual para aplicar el filtro sobre él
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  tempCanvas.width = currentImageBuffer.width;
  tempCanvas.height = currentImageBuffer.height;
  tempCtx.drawImage(currentImageBuffer, 0, 0); // Dibuja el contenido del buffer

  const imageData = tempCtx.getImageData(
    0,
    0,
    tempCanvas.width,
    tempCanvas.height
  );
  const pixels = imageData.data;

  let filterApplied = true;
  switch (filterType) {
    case "grayscale":
      applyGrayscaleFilter(pixels);
      break;
    case "sepia":
      applySepiaFilter(pixels);
      break;
    case "invert":
      applyInvertFilter(pixels);
      break;
    case "blur":
      const blurRadius = parseFloat(blurIntensityRange.value) * 2; // Multiplicar por 2 para mayor efecto
      if (blurRadius === 0) {
        filterApplied = false;
        showMessageCallback(
          "Desenfoque en 0, no se aplicó filtro.",
          "info",
          messageAreaElement
        );
      } else {
        applyBlurFilter(
          pixels,
          tempCanvas.width,
          tempCanvas.height,
          blurRadius
        );
      }
      break;
    case "sharpen":
      const sharpenAmount = parseFloat(sharpenIntensityRange.value);
      if (sharpenAmount === 0) {
        filterApplied = false;
        showMessageCallback(
          "Enfoque en 0, no se aplicó filtro.",
          "info",
          messageAreaElement
        );
      } else {
        applySharpenFilter(
          pixels,
          tempCanvas.width,
          tempCanvas.height,
          sharpenAmount
        );
      }
      break;
    default:
      filterApplied = false;
      showMessageCallback(
        `Filtro "${filterType}" no reconocido o no implementado.`,
        "warning",
        messageAreaElement
      );
      break;
  }

  if (filterApplied) {
    tempCtx.putImageData(imageData, 0, 0);

    // Actualizar el buffer con la imagen filtrada
    currentImageBuffer.width = tempCanvas.width;
    currentImageBuffer.height = tempCanvas.height;
    currentImageBuffer.getContext("2d").drawImage(tempCanvas, 0, 0);

    drawImageOnCanvasCallback(
      currentImageBuffer,
      imageCanvasElement,
      editorCtx,
      document.getElementById("placeholderText")
    );
    saveStateCallback(imageCanvasElement, setHistoryStateCallback);
    showMessageCallback(
      `Filtro ${filterType} aplicado.`,
      "success",
      messageAreaElement
    );
  }
  toggleLoadingCallback(false, loadingSpinnerElement, DOMElements);
}
