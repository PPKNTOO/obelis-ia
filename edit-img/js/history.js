// edit-img/js/history.js

import { DOMElements } from "../../js/global.js";
import { drawImageOnCanvas, editorCtx, imageCanvas } from "./canvas.js";
import { updateUndoRedoButtons, showMessage } from "./ui.js";
import { currentImageBuffer } from "./main.js"; // Importamos el buffer de la imagen

export const history = { current: [] };
export let historyIndex = { current: -1 };

/**
 * Guarda el estado actual del canvas en el historial.
 * @param {HTMLCanvasElement} buffer - El canvas en memoria (buffer) que contiene el estado a guardar.
 */
export function saveState(buffer) {
  if (!buffer) return;

  // Si hemos hecho undo y luego dibujamos algo nuevo, eliminamos el historial "futuro"
  if (historyIndex.current < history.current.length - 1) {
    history.current = history.current.slice(0, historyIndex.current + 1);
  }

  // Guardamos el estado del buffer como una data URL
  history.current.push(buffer.toDataURL());
  historyIndex.current++;

  updateUndoRedoButtons();
}

/**
 * Restaura un estado del historial al canvas.
 * @param {string} dataURL - La DataURL del estado a restaurar.
 */
function restoreState(dataURL) {
  const img = new Image();
  img.onload = () => {
    // Dibuja la imagen del historial en el canvas visible
    drawImageOnCanvas(img);
    // Y también actualiza el buffer en memoria al mismo estado
    if (currentImageBuffer) {
      currentImageBuffer.width = img.width;
      currentImageBuffer.height = img.height;
      currentImageBuffer.getContext("2d").drawImage(img, 0, 0);
    }
    updateUndoRedoButtons();
  };
  img.src = dataURL;
}

/**
 * Función para deshacer la última acción.
 */
export function undo() {
  if (historyIndex.current > 0) {
    historyIndex.current--;
    restoreState(history.current[historyIndex.current]);
    showMessage("Acción deshecha.", "info");
  } else {
    showMessage("No hay más acciones para deshacer.", "warning");
  }
}

/**
 * Función para rehacer la última acción deshecha.
 */
export function redo() {
  if (historyIndex.current < history.current.length - 1) {
    historyIndex.current++;
    restoreState(history.current[historyIndex.current]);
    showMessage("Acción rehecha.", "info");
  } else {
    showMessage("No hay más acciones para rehacer.", "warning");
  }
}

/**
 * Establece o reinicia el estado del historial.
 * @param {Array<string>} newHistory - El nuevo array del historial.
 */
export function setHistoryState(newHistory) {
  history.current = newHistory;
  historyIndex.current = newHistory.length - 1;
  updateUndoRedoButtons();
}
