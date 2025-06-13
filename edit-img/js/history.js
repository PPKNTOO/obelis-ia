// edit-img/js/history.js
import { drawImageOnCanvas } from "./canvas.js";
import { updateUndoRedoButtons } from "./ui.js";

// Usamos objetos para las referencias para que los valores se puedan actualizar globalmente
export const history = { current: [] };
export const historyIndex = { current: -1 };

/**
 * Guarda el estado actual del canvas en el historial.
 * @param {HTMLCanvasElement} canvas - El elemento canvas a guardar.
 * @param {function} setHistoryStateCallback - Callback para actualizar el estado del historial.
 */
export function saveState(canvas, setHistoryStateCallback) {
  if (!canvas) return;

  if (historyIndex.current < history.current.length - 1) {
    history.current = history.current.slice(0, historyIndex.current + 1);
  }
  history.current.push(canvas.toDataURL());
  historyIndex.current++;
  updateUndoRedoButtons(
    document.getElementById("undoBtn"),
    document.getElementById("redoBtn"),
    historyIndex.current,
    history.current.length
  );
}

/**
 * Restaura un estado del historial al canvas.
 * @param {string} dataURL - La DataURL del estado a restaurar.
 * @param {HTMLCanvasElement} canvas - El elemento canvas HTML.
 * @param {CanvasRenderingContext2D} ctx - El contexto 2D del canvas.
 * @param {HTMLElement} placeholderText - El elemento de texto placeholder.
 * @param {HTMLCanvasElement} currentImageBuffer - El canvas de buffer para actualizar.
 * @param {Object} historyIndexRef - Referencia al objeto historyIndex (para actualizar su 'current').
 * @param {function} updateUndoRedoButtonsCallback - Callback para actualizar los botones Deshacer/Rehacer.
 * @param {HTMLElement} undoBtn - El botón de deshacer.
 * @param {HTMLElement} redoBtn - El botón de rehacer.
 * @param {Array<string>} historyArray - El array del historial.
 */
export function restoreState(
  dataURL,
  canvas,
  ctx,
  placeholderText,
  currentImageBuffer,
  historyIndexRef,
  updateUndoRedoButtonsCallback,
  undoBtn,
  redoBtn,
  historyArray
) {
  const img = new Image();
  img.onload = () => {
    drawImageOnCanvas(img, canvas, ctx, placeholderText);
    if (currentImageBuffer) {
      currentImageBuffer.width = img.width;
      currentImageBuffer.height = img.height;
      currentImageBuffer.getContext("2d").drawImage(img, 0, 0);
    }
    updateUndoRedoButtonsCallback(
      undoBtn,
      redoBtn,
      historyIndexRef.current,
      historyArray.length
    );
  };
  img.src = dataURL;
}

/**
 * Establece o reinicia el estado del historial.
 * @param {Array<string>} newHistory - El nuevo array del historial.
 */
export function setHistoryState(newHistory) {
  history.current = newHistory;
  historyIndex.current = newHistory.length - 1;
  // Opcional: Llamar a updateUndoRedoButtons si necesitas actualizar los botones inmediatamente.
  updateUndoRedoButtons(
    document.getElementById("undoBtn"),
    document.getElementById("redoBtn"),
    historyIndex.current,
    history.current.length
  );
}
