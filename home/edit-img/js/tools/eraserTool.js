// edit-img/js/tools/eraserTool.js
import { editorCtx, redrawFromBuffer } from "../canvas.js";
import { saveState, setHistoryState } from "../history.js";
import { showMessage } from "../ui.js";

// Variables de estado para el borrador
let isErasing = false;
let lastPoint = { x: 0, y: 0 }; // Almacena el último punto para conectar los trazos

/**
 * Dibuja un "punto" de borrado suave en un contexto dado.
 * Esta función es la que genera la "forma" de cada aplicación individual del borrador.
 * @param {CanvasRenderingContext2D} ctx - El contexto del canvas donde dibujar el borrado.
 * @param {number} x - Coordenada X del centro del punto.
 * @param {number} y - Coordenada Y del centro del punto.
 * @param {number} lineWidth - Ancho del trazo (tamaño del borrador).
 * @param {number} hardness - Dureza del borrador (0-100).
 * @param {number} globalOpacity - Opacidad global del borrador (0-1).
 */
function applySoftEraserSpot(ctx, x, y, lineWidth, hardness, globalOpacity) {
  ctx.save(); // Guarda el estado actual del contexto

  // La operación de composición para borrar es 'destination-out'
  // Esto significa que donde dibujemos, se eliminarán los píxeles existentes.
  ctx.globalCompositeOperation = "destination-out";

  const radius = lineWidth / 2;
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

  // Define los puntos de color del degradado para simular la dureza.
  // El color en sí no importa mucho con "destination-out", lo que importa es el canal alfa.
  // Un valor de 1 en alfa significa borrado completo, 0 significa no borra.
  // El "hardness" controla cuánto del círculo interior es completamente borrado.
  const hardStop = Math.min(1, Math.max(0, hardness / 100)); // Asegura valores entre 0 y 1

  gradient.addColorStop(0, `rgba(0, 0, 0, ${globalOpacity})`); // Centro: opacidad total (borra)
  gradient.addColorStop(hardStop, `rgba(0, 0, 0, ${globalOpacity})`); // Hasta este punto, opacidad total
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)"); // Borde: completamente transparente (no borra)

  ctx.fillStyle = gradient; // Aplicar el degradado como estilo de relleno

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2, false);
  ctx.fill();

  ctx.restore(); // Restaura el estado del contexto
}

/**
 * Inicia el borrado.
 * @param {{offsetX: number, offsetY: number}} coords - Coordenadas de inicio del borrado.
 * @param {Object} DOMElements - Referencias a los elementos DOM.
 * @param {HTMLCanvasElement} currentImageBuffer - El canvas de buffer actual.
 */
export function startEraser(coords, DOMElements, currentImageBuffer) {
  if (
    !currentImageBuffer ||
    currentImageBuffer.width === 0 ||
    currentImageBuffer.height === 0
  ) {
    showMessage(
      "Carga una imagen antes de usar el borrador.",
      "warning",
      DOMElements.messageArea
    );
    return;
  }
  isErasing = true;
  lastPoint = { x: coords.offsetX, y: coords.offsetY };

  const bufferCtx = currentImageBuffer.getContext("2d");
  const lineWidth = parseInt(DOMElements.lineWidthRange.value);
  const hardness = parseInt(DOMElements.brushHardnessRange.value);
  const globalOpacity = parseInt(DOMElements.globalOpacityRange.value) / 100;

  // Aplica el primer "punto" de borrado directamente al buffer
  applySoftEraserSpot(
    bufferCtx,
    lastPoint.x,
    lastPoint.y,
    lineWidth,
    hardness,
    globalOpacity
  );

  // Redibujar el canvas principal desde el buffer para mostrar el trazo inicial
  redrawFromBuffer(
    currentImageBuffer,
    DOMElements.imageCanvas,
    editorCtx.current
  );
}

/**
 * Realiza el borrado continuo.
 * @param {{offsetX: number, offsetY: number}} coords - Coordenadas actuales del borrado.
 * @param {Object} DOMElements - Referencias a los elementos DOM.
 * @param {HTMLCanvasElement} currentImageBuffer - El canvas de buffer actual.
 */
export function drawEraser(coords, DOMElements, currentImageBuffer) {
  if (
    !isErasing ||
    !currentImageBuffer ||
    currentImageBuffer.width === 0 ||
    currentImageBuffer.height === 0
  )
    return;

  const currentX = coords.offsetX;
  const currentY = coords.offsetY;
  const lineWidth = parseInt(DOMElements.lineWidthRange.value);
  const hardness = parseInt(DOMElements.brushHardnessRange.value);
  const globalOpacity = parseInt(DOMElements.globalOpacityRange.value) / 100;

  const bufferCtx = currentImageBuffer.getContext("2d");

  // Calcular la distancia entre el último punto y el punto actual
  const dx = currentX - lastPoint.x;
  const dy = currentY - lastPoint.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Número de pasos para interpolar entre los dos puntos
  // Esto asegura un trazo suave incluso con movimientos rápidos del ratón
  const spacing = lineWidth * 0.2; // Espaciado entre "manchas" (ajustable)
  const steps = Math.ceil(distance / spacing);

  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps; // Interpolar linealmente entre lastPoint y currentPoint
    const interpolatedX = lastPoint.x + dx * t;
    const interpolatedY = lastPoint.y + dy * t;

    // Aplica el "punto" de borrado en cada paso interpolado al buffer
    applySoftEraserSpot(
      bufferCtx,
      interpolatedX,
      interpolatedY,
      lineWidth,
      hardness,
      globalOpacity
    );
  }

  // Después de aplicar todos los "puntos" al buffer, redibuja el canvas visible
  redrawFromBuffer(
    currentImageBuffer,
    DOMElements.imageCanvas,
    editorCtx.current
  );

  lastPoint = { x: currentX, y: currentY }; // Actualiza el último punto
}

/**
 * Finaliza el borrado, haciendo los cambios permanentes y guardando en el historial.
 * @param {Object} DOMElements - Referencias a los elementos DOM.
 * @param {HTMLCanvasElement} currentImageBuffer - El canvas de buffer actual.
 */
export function endEraser(DOMElements, currentImageBuffer) {
  if (!isErasing) return;

  isErasing = false;

  // Restaurar la operación de composición global del contexto principal a la predeterminada
  editorCtx.current.globalCompositeOperation = "source-over";

  // Guardar el estado final del buffer en el historial
  saveState(DOMElements.imageCanvas, setHistoryState);
  showMessage("Borrado aplicado.", "success", DOMElements.messageArea);
}
