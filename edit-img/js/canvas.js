// edit-img/js/canvas.js

// Usamos un objeto para poder pasar la referencia y que se actualice globalmente
export const editorCtx = { current: null };
export const imageCanvas = { current: null };

/**
 * Dibuja una imagen en el canvas, ajustando su tamaño para encajar en el contenedor.
 * @param {HTMLImageElement|HTMLCanvasElement} img - La imagen o canvas a dibujar.
 * @param {HTMLCanvasElement} canvas - El elemento canvas HTML.
 * @param {CanvasRenderingContext2D} ctx - El contexto 2D del canvas.
 * @param {HTMLElement} placeholderText - El elemento de texto placeholder.
 */
export function drawImageOnCanvas(img, canvas, ctx, placeholderText) {
  if (placeholderText) placeholderText.classList.add("hidden");

  if (!canvas || !ctx) {
    console.error("Canvas or context not available for drawing.");
    return;
  }

  // Establece el tamaño interno del canvas a las dimensiones de la imagen
  canvas.width = img.width;
  canvas.height = img.height;

  // Ajusta el tamaño visual del canvas para que quepa en su contenedor
  const parentContainer = canvas.parentElement;
  const parentWidth = parentContainer.clientWidth;
  const parentHeight = parentContainer.clientHeight;

  let ratio = 1;
  if (img.width > parentWidth) {
    ratio = parentWidth / img.width;
  }
  // Asegurarse de que la imagen no exceda la altura disponible después de ajustar el ancho
  if (img.height * ratio > parentHeight && img.height * ratio !== 0) {
    ratio = parentHeight / img.height;
  }

  canvas.style.width = `${img.width * ratio}px`;
  canvas.style.height = `${img.height * ratio}px`;

  // Limpia y dibuja la imagen
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
}

/**
 * Obtiene las coordenadas del ratón relativas al canvas.
 * @param {MouseEvent} e - El evento del ratón.
 * @param {HTMLCanvasElement} canvas - El elemento canvas HTML.
 * @returns {{x: number, y: number}} - Las coordenadas X e Y.
 */
export function getMousePos(e, canvas) {
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

/**
 * Redibuja el contenido de un canvas de buffer al canvas visible.
 * Se usa para restablecer el estado antes de un dibujo temporal o una operación.
 * @param {HTMLCanvasElement} buffer - El canvas de buffer con el estado actual de la imagen.
 * @param {HTMLCanvasElement} canvas - El canvas visible.
 * @param {CanvasRenderingContext2D} ctx - El contexto 2D del canvas visible.
 */
export function redrawFromBuffer(buffer, canvas, ctx) {
  if (buffer && ctx && canvas) {
    // Asegúrate de que el tamaño del canvas visible coincida con el buffer si ha cambiado
    if (canvas.width !== buffer.width || canvas.height !== buffer.height) {
      canvas.width = buffer.width;
      canvas.height = buffer.height;
      // Re-ajustar el estilo del canvas para que encaje visualmente
      const parentContainer = canvas.parentElement;
      const parentWidth = parentContainer.clientWidth;
      const parentHeight = parentContainer.clientHeight;
      let ratio = 1;
      if (buffer.width > parentWidth) {
        ratio = parentWidth / buffer.width;
      }
      if (buffer.height * ratio > parentHeight && buffer.height * ratio !== 0) {
        ratio = parentHeight / buffer.height;
      }
      canvas.style.width = `${buffer.width * ratio}px`;
      canvas.style.height = `${buffer.height * ratio}px`;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(buffer, 0, 0);
  }
}

/**
 * Limpia el canvas completamente y muestra el texto placeholder.
 * @param {HTMLCanvasElement} canvas - El elemento canvas HTML.
 * @param {CanvasRenderingContext2D} ctx - El contexto 2D del canvas.
 * @param {HTMLElement} placeholderText - El elemento de texto placeholder.
 */
export function clearCanvas(canvas, ctx, placeholderText) {
  if (ctx && canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0; // Reduce las dimensiones del canvas para que no ocupe espacio si no hay imagen
    canvas.height = 0;
  }
  if (placeholderText) placeholderText.classList.remove("hidden");
}
