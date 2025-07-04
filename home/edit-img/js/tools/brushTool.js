// edit-img/js/tools/brushTool.js
import { editorCtx, redrawFromBuffer } from "../canvas.js";
import { saveState, setHistoryState } from "../history.js";
import { showMessage } from "../ui.js";

/**
 * Inicia el trazo del pincel.
 * @param {{offsetX: number, offsetY: number}} coords - Coordenadas de inicio del trazo.
 * @param {Object} DOMElements - Referencias a los elementos DOM.
 * @param {HTMLCanvasElement} currentImageBuffer - El canvas de buffer actual.
 */
export function startBrush(coords, DOMElements, currentImageBuffer) {
  editorCtx.current.globalCompositeOperation = "source-over"; // Dibuja normalmente
  editorCtx.current.strokeStyle = DOMElements.colorPicker.value;
  editorCtx.current.lineWidth = parseInt(DOMElements.lineWidthRange.value);
  editorCtx.current.globalAlpha =
    parseInt(DOMElements.globalOpacityRange.value) / 100;
  // La dureza del pincel es más compleja y requeriría un renderizado diferente (ej. degradado en los bordes).
  // Por ahora, se considera un pincel sólido con el color y opacidad.
  editorCtx.current.beginPath();
  editorCtx.current.moveTo(coords.offsetX, coords.offsetY);
}

/**
 * Dibuja un trazo continuo del pincel.
 * @param {{offsetX: number, offsetY: number}} coords - Coordenadas actuales del trazo.
 * @param {Object} DOMElements - Referencias a los elementos DOM.
 * @param {HTMLCanvasElement} currentImageBuffer - El canvas de buffer actual.
 */
export function drawBrush(coords, DOMElements, currentImageBuffer) {
  // Redibuja el buffer para mostrar el trazo temporal sobre el estado actual
  redrawFromBuffer(
    currentImageBuffer,
    DOMElements.imageCanvas,
    editorCtx.current
  );
  editorCtx.current.lineTo(coords.offsetX, coords.offsetY);
  editorCtx.current.stroke();
}

/**
 * Finaliza el trazo del pincel, haciendo el dibujo permanente.
 * @param {Object} DOMElements - Referencias a los elementos DOM.
 * @param {HTMLCanvasElement} currentImageBuffer - El canvas de buffer actual.
 */
export function endBrush(DOMElements, currentImageBuffer) {
  // Dibuja el contenido actual del canvas visible (que incluye el último trazo temporal)
  // en el buffer para que sea permanente.
  const tempCtx = currentImageBuffer.getContext("2d");
  tempCtx.globalCompositeOperation = "source-over"; // Asegurar que dibuja normalmente
  tempCtx.globalAlpha = editorCtx.current.globalAlpha; // Copiar la opacidad
  tempCtx.drawImage(DOMElements.imageCanvas, 0, 0);

  // Restablece la operación de composición para el canvas visible
  editorCtx.current.globalCompositeOperation = "source-over";
  saveState(DOMElements.imageCanvas, setHistoryState);
  showMessage("Dibujo aplicado.", "success", DOMElements.messageArea);
}
