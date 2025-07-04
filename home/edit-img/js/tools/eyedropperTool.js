// edit-img/js/tools/eyedropperTool.js
import { showMessage } from "../ui.js";

/**
 * Selecciona un color del canvas en las coordenadas dadas.
 * @param {number} x - Coordenada X del píxel.
 * @param {number} y - Coordenada Y del píxel.
 * @param {CanvasRenderingContext2D} editorCtx - El contexto 2D del canvas.
 * @param {HTMLInputElement} colorPickerElement - El elemento input de tipo color.
 * @param {HTMLElement} messageAreaElement - Elemento DOM del área de mensajes.
 * @param {function} showMessageCallback - Callback para mostrar mensajes.
 */
export function pickColor(
  x,
  y,
  editorCtx,
  colorPickerElement,
  messageAreaElement,
  showMessageCallback
) {
  if (!editorCtx || !colorPickerElement) return;
  try {
    const pixel = editorCtx.getImageData(x, y, 1, 1).data; // Obtiene los datos del píxel en (x,y)
    const hexColor = `#${(
      (1 << 24) +
      (pixel[0] << 16) +
      (pixel[1] << 8) +
      pixel[2]
    )
      .toString(16)
      .slice(1)
      .toUpperCase()}`;
    colorPickerElement.value = hexColor; // Establece el valor del color picker
    editorCtx.strokeStyle = hexColor; // Actualiza el color de trazo para herramientas futuras
    editorCtx.fillStyle = hexColor; // Actualiza el color de relleno para herramientas futuras
    showMessageCallback(
      `Color seleccionado: ${hexColor}`,
      "success",
      messageAreaElement
    );
  } catch (e) {
    console.error("Error al obtener el color del píxel:", e);
    showMessageCallback(
      "No se pudo seleccionar el color. Puede ser un problema de CORS con la imagen.",
      "error",
      messageAreaElement
    );
  }
}
