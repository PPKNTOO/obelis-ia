// edit-img/js/tools/cropTool.js
import { getMousePos, drawImageOnCanvas } from "../canvas.js";
import { saveState, setHistoryState } from "../history.js";
import { showMessage, toggleLoading } from "../ui.js";

let isCropping = false;
let cropStartX, cropStartY, cropCurrentX, cropCurrentY;
let currentCanvasElement, currentCropOverlay, currentCropOptions; // Referencias a elementos DOM

/**
 * Inicializa el modo de recorte.
 * @param {HTMLCanvasElement} canvasElement - El elemento canvas visible.
 * @param {CanvasRenderingContext2D} ctx - El contexto 2D del canvas.
 * @param {HTMLElement} cropOverlayElement - El elemento DOM del overlay de recorte.
 * @param {HTMLElement} cropOptionsElement - El elemento DOM de las opciones de recorte.
 */
export function initCropTool(
  canvasElement,
  ctx,
  cropOverlayElement,
  cropOptionsElement
) {
  isCropping = true;
  cropStartX = undefined;
  cropStartY = undefined;
  currentCanvasElement = canvasElement;
  currentCropOverlay = cropOverlayElement;
  currentCropOptions = cropOptionsElement;

  if (currentCanvasElement) currentCanvasElement.style.cursor = "crosshair";
  if (currentCropOptions) currentCropOptions.classList.remove("hidden");
  if (currentCropOverlay) currentCropOverlay.classList.add("hidden"); // Ocultar hasta que el usuario empiece a arrastrar
}

/**
 * Maneja el inicio del arrastre para definir el área de recorte.
 * @param {number} x - Coordenada X de inicio.
 * @param {number} y - Coordenada Y de inicio.
 */
export function handleCropStart(x, y) {
  if (!isCropping) return;
  cropStartX = x;
  cropStartY = y;
  cropCurrentX = x;
  cropCurrentY = y;
  drawCropOverlay(); // Dibuja el overlay inicial
}

/**
 * Maneja el movimiento del ratón para actualizar el área de recorte.
 * @param {number} x - Coordenada X actual.
 * @param {number} y - Coordenada Y actual.
 * @param {HTMLElement} cropOverlayElement - El elemento DOM del overlay de recorte.
 */
export function handleCropMove(x, y, cropOverlayElement) {
  if (!isCropping || cropStartX === undefined) return;
  cropCurrentX = x;
  cropCurrentY = y;
  drawCropOverlay(cropOverlayElement);
}

/**
 * Maneja el final del arrastre para definir el área de recorte (no aplica el recorte).
 * @param {HTMLElement} cropOverlayElement - El elemento DOM del overlay de recorte.
 */
export function handleCropEnd(cropOverlayElement) {
  // La lógica de aplicación se hace en `applyCrop` al hacer clic en el botón.
  // Esto solo asegura que el overlay se quede dibujado.
}

/**
 * Dibuja el overlay de recorte en el canvas.
 * @param {HTMLElement} [cropOverlayElement=currentCropOverlay] - El elemento DOM del overlay de recorte.
 */
function drawCropOverlay(cropOverlayElement = currentCropOverlay) {
  if (
    isCropping &&
    cropStartX !== undefined &&
    currentCanvasElement &&
    currentCanvasElement.getBoundingClientRect().width > 0 && // Asegura que el canvas tiene tamaño
    cropOverlayElement
  ) {
    const x = Math.min(cropStartX, cropCurrentX);
    const y = Math.min(cropStartY, cropCurrentY);
    const width = Math.abs(cropCurrentX - cropStartX);
    const height = Math.abs(cropCurrentY - cropStartY);

    // Calcular la posición y tamaño del overlay en relación con la pantalla
    const canvasRect = currentCanvasElement.getBoundingClientRect();
    // Escalar las coordenadas del canvas al tamaño del DOM del canvas
    const scaleX = canvasRect.width / currentCanvasElement.width;
    const scaleY = canvasRect.height / currentCanvasElement.height;

    cropOverlayElement.style.left = `${canvasRect.left + x * scaleX}px`;
    cropOverlayElement.style.top = `${canvasRect.top + y * scaleY}px`;
    cropOverlayElement.style.width = `${width * scaleX}px`;
    cropOverlayElement.style.height = `${height * scaleY}px`;
    cropOverlayElement.classList.remove("hidden");
  }
}

/**
 * Aplica el recorte al canvas.
 * @param {HTMLCanvasElement} currentImageBuffer - El canvas de buffer actual.
 * @param {CanvasRenderingContext2D} editorCtx - El contexto 2D del canvas visible.
 * @param {HTMLElement} cropOverlay - El elemento DOM del overlay de recorte.
 * @param {HTMLCanvasElement} imageCanvas - El elemento canvas visible.
 * @param {HTMLImageElement} originalImage - La imagen original (se actualiza su src).
 * @param {function} drawImageOnCanvasCallback - Callback para dibujar la imagen en el canvas.
 * @param {function} saveStateCallback - Callback para guardar el estado.
 * @param {function} setHistoryStateCallback - Callback para reiniciar el historial.
 * @param {function} toggleLoadingCallback - Callback para alternar el estado de carga.
 * @param {HTMLElement} loadingSpinnerElement - El elemento DOM del spinner de carga.
 * @param {HTMLElement} messageAreaElement - Elemento DOM del área de mensajes.
 * @param {function} showMessageCallback - Callback para mostrar mensajes.
 * @param {HTMLElement} cropOptionsElement - El elemento DOM de las opciones de recorte.
 */
export function applyCrop(
  currentImageBuffer,
  editorCtx,
  cropOverlay,
  imageCanvas,
  originalImage,
  drawImageOnCanvasCallback,
  saveStateCallback,
  setHistoryStateCallback,
  toggleLoadingCallback,
  loadingSpinnerElement,
  messageAreaElement,
  showMessageCallback,
  cropOptionsElement
) {
  if (
    !currentImageBuffer ||
    !editorCtx ||
    !cropOverlay ||
    cropStartX === undefined
  ) {
    showMessageCallback(
      "No hay área de recorte seleccionada o imagen cargada.",
      "warning",
      messageAreaElement
    );
    return;
  }

  const x = Math.min(cropStartX, cropCurrentX);
  const y = Math.min(cropStartY, cropCurrentY);
  const width = Math.abs(cropCurrentX - cropStartX);
  const height = Math.abs(cropCurrentY - cropStartY);

  if (width === 0 || height === 0) {
    showMessageCallback(
      "Selecciona un área de recorte válida.",
      "warning",
      messageAreaElement
    );
    return;
  }

  toggleLoadingCallback(true, loadingSpinnerElement);
  showMessageCallback("Recortando imagen...", "info", messageAreaElement);

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  tempCanvas.width = width;
  tempCanvas.height = height;
  tempCtx.drawImage(
    currentImageBuffer, // Dibuja del buffer actual
    x,
    y,
    width,
    height, // Origen en el buffer
    0,
    0,
    width,
    height // Destino en el tempCanvas
  );

  // Actualizar el buffer de la imagen con la imagen recortada
  currentImageBuffer.width = tempCanvas.width;
  currentImageBuffer.height = tempCanvas.height;
  currentImageBuffer.getContext("2d").drawImage(tempCanvas, 0, 0);

  // Actualiza la imagen original para que un "reset" use la imagen recortada
  originalImage.src = tempCanvas.toDataURL();
  originalImage.width = tempCanvas.width;
  originalImage.height = tempCanvas.height;

  // Dibuja el buffer actualizado en el canvas visible
  drawImageOnCanvasCallback(
    currentImageBuffer,
    imageCanvas,
    editorCtx,
    document.getElementById("placeholderText")
  );
  saveStateCallback(imageCanvas, setHistoryStateCallback); // Guarda el nuevo estado recortado
  toggleLoadingCallback(false, loadingSpinnerElement);
  showMessageCallback(
    "Imagen recortada con éxito.",
    "success",
    messageAreaElement
  );

  // Ocultar UI de recorte y restablecer estado
  isCropping = false;
  cropStartX = undefined;
  cropStartY = undefined;
  cropOverlay.classList.add("hidden");
  if (cropOptionsElement) cropOptionsElement.classList.add("hidden");
  if (imageCanvas) imageCanvas.style.cursor = "default";
}

/**
 * Cancela el modo de recorte y limpia la UI.
 * @param {HTMLElement} cropOverlayElement - El elemento DOM del overlay de recorte.
 * @param {HTMLElement} cropOptionsElement - El elemento DOM de las opciones de recorte.
 * @param {HTMLCanvasElement} imageCanvasElement - El elemento canvas visible.
 * @param {function} activateToolCallback - Callback para activar una herramienta.
 * @param {function} showMessageCallback - Callback para mostrar mensajes.
 * @param {HTMLElement} messageAreaElement - Elemento DOM del área de mensajes.
 * @param {Object} DOMElements - Referencias a los elementos DOM.
 */
export function cancelCrop(
  cropOverlayElement,
  cropOptionsElement,
  imageCanvasElement,
  activateToolCallback,
  showMessageCallback,
  messageAreaElement,
  DOMElements
) {
  isCropping = false;
  cropStartX = undefined;
  cropStartY = undefined;
  if (cropOverlayElement) cropOverlayElement.classList.add("hidden");
  if (cropOptionsElement) cropOptionsElement.classList.add("hidden");
  if (imageCanvasElement) imageCanvasElement.style.cursor = "default";
  activateToolCallback("brush", DOMElements); // Vuelve al pincel
  showMessageCallback("Recorte cancelado.", "info", messageAreaElement);
}
