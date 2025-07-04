// edit-img/js/tools/textTool.js
import { editorCtx, redrawFromBuffer } from "../canvas.js";
import { saveState, setHistoryState } from "../history.js";
import { showMessage } from "../ui.js";

/**
 * Dibuja texto en el canvas.
 * @param {number} x - Coordenada X donde se dibuja el texto.
 * @param {number} y - Coordenada Y donde se dibuja el texto.
 * @param {string} text - El texto a dibujar.
 * @param {string|number} fontSize - El tamaño de la fuente (ej. "30").
 * @param {string} fontFamily - La familia de la fuente (ej. "Arial, sans-serif").
 * @param {string} color - El color del texto (hex, rgb, etc.).
 * @param {boolean} isBold - Si el texto es negrita.
 * @param {boolean} isItalic - Si el texto es cursiva.
 * @param {number} opacity - La opacidad del texto (0-100).
 * @param {HTMLCanvasElement} currentImageBuffer - El canvas de buffer actual.
 * @param {CanvasRenderingContext2D} editorCtxCurrent - El contexto 2D del canvas visible.
 * @param {HTMLCanvasElement} imageCanvasElement - El elemento canvas visible.
 * @param {function} redrawFromBufferCallback - Callback para redibujar el buffer.
 * @param {function} saveStateCallback - Callback para guardar el estado.
 * @param {function} setHistoryStateCallback - Callback para reiniciar el historial.
 * @param {function} showMessageCallback - Callback para mostrar mensajes.
 * @param {HTMLElement} messageAreaElement - Elemento DOM del área de mensajes.
 */
export function drawText(
  x,
  y,
  text,
  fontSize,
  fontFamily,
  color,
  isBold,
  isItalic,
  opacity,
  currentImageBuffer,
  editorCtxCurrent,
  imageCanvasElement,
  redrawFromBufferCallback,
  saveStateCallback,
  setHistoryStateCallback,
  showMessageCallback,
  messageAreaElement
) {
  if (!text) {
    showMessageCallback(
      "Por favor, introduce el texto a añadir.",
      "warning",
      messageAreaElement
    );
    return;
  }
  if (!currentImageBuffer) {
    showMessageCallback(
      "Carga una imagen antes de añadir texto.",
      "warning",
      messageAreaElement
    );
    return;
  }

  // Redibujar el buffer primero para tener el fondo correcto antes de dibujar el texto temporalmente
  redrawFromBufferCallback(
    currentImageBuffer,
    imageCanvasElement,
    editorCtxCurrent
  );

  editorCtxCurrent.save(); // Guarda el estado actual del contexto
  editorCtxCurrent.fillStyle = color;
  editorCtxCurrent.globalAlpha = parseInt(opacity) / 100;

  let fontStyle = "";
  if (isBold) fontStyle += "bold ";
  if (isItalic) fontStyle += "italic ";
  editorCtxCurrent.font = `${fontStyle}${fontSize}px ${fontFamily}`;
  editorCtxCurrent.textAlign = "left";
  editorCtxCurrent.textBaseline = "top"; // Dibuja desde la parte superior de la línea de texto

  editorCtxCurrent.fillText(text, x, y);
  editorCtxCurrent.restore(); // Restaura el estado previo del contexto

  // Una vez que el texto se ha dibujado en el canvas visible, hazlo permanente en el buffer
  const tempCtx = currentImageBuffer.getContext("2d");
  tempCtx.drawImage(imageCanvasElement, 0, 0);

  saveStateCallback(imageCanvasElement, setHistoryStateCallback);
  showMessageCallback("Texto añadido.", "success", messageAreaElement);
}
