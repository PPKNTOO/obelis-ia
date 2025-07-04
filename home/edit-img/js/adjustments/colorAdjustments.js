// edit-img/js/adjustments/colorAdjustments.js
import { drawImageOnCanvas } from "../canvas.js";
import { saveState, setHistoryState } from "../history.js";
import { showMessage } from "../ui.js";

/**
 * Aplica una combinación de ajustes de color a la imagen.
 * @param {HTMLImageElement} originalImage - La imagen original (para siempre aplicar ajustes desde una base limpia).
 * @param {HTMLCanvasElement} currentImageBuffer - El canvas de buffer que almacena el estado actual.
 * @param {CanvasRenderingContext2D} editorCtx - El contexto 2D del canvas visible.
 * @param {function} drawImageOnCanvasCallback - Función para dibujar la imagen en el canvas.
 * @param {function} saveStateCallback - Función para guardar el estado en el historial.
 * @param {HTMLCanvasElement} imageCanvasElement - El elemento canvas visible.
 * @param {function} setHistoryStateCallback - Función para manipular el historial.
 * @param {HTMLElement} messageAreaElement - Elemento DOM del área de mensajes.
 * @param {number} brightness - Valor de brillo (-100 a 100).
 * @param {number} contrast - Valor de contraste (-100 a 100).
 * @param {number} saturation - Valor de saturación (0 a 200).
 * @param {number} hueRotate - Valor de tonalidad (0 a 360 grados).
 * @param {number} exposure - Valor de exposición (-100 a 100).
 * @param {number} gamma - Valor de gamma (1 a 300, representa 0.01 a 3.0).
 */
export function applyAdjustments(
  originalImage,
  currentImageBuffer,
  editorCtx,
  drawImageOnCanvasCallback,
  saveStateCallback,
  imageCanvasElement,
  setHistoryStateCallback,
  messageAreaElement,
  brightness,
  contrast,
  saturation,
  hueRotate,
  exposure,
  gamma
) {
  if (!originalImage || !editorCtx) return;

  // Crear un canvas temporal y dibujar la imagen original en él
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  tempCanvas.width = originalImage.width;
  tempCanvas.height = originalImage.height;
  tempCtx.drawImage(originalImage, 0, 0); // Dibuja la imagen original aquí

  const imageData = tempCtx.getImageData(
    0,
    0,
    tempCanvas.width,
    tempCanvas.height
  );
  const pixels = imageData.data;

  // Convertir valores de slider a factores
  const brightFactor = brightness / 100; // -1 a 1
  const contrastFactor = contrast / 100 + 1; // 0 a 2
  const saturationFactor = saturation / 100; // 0 a 2
  const hueRadians = (hueRotate * Math.PI) / 180; // 0 a 2PI
  const exposureFactor = exposure / 100; // -1 a 1
  const gammaFactor = gamma / 100; // 0.01 a 3.0

  // Matriz de rotación de tonalidad (Hue rotation)
  const cosHue = Math.cos(hueRadians);
  const sinHue = Math.sin(hueRadians);
  const hueMatrix = [
    [
      0.213 + cosHue * 0.787 - sinHue * 0.213,
      0.715 - cosHue * 0.715 - sinHue * 0.715,
      0.072 - cosHue * 0.072 + sinHue * 0.928,
    ],
    [
      0.213 - cosHue * 0.213 + sinHue * 0.143,
      0.715 + cosHue * 0.285 + sinHue * 0.14,
      0.072 - cosHue * 0.072 - sinHue * 0.283,
    ],
    [
      0.213 - cosHue * 0.213 - sinHue * 0.787,
      0.715 - cosHue * 0.715 + sinHue * 0.072,
      0.072 + cosHue * 0.928 + sinHue * 0.072,
    ],
  ];

  for (let i = 0; i < pixels.length; i += 4) {
    let r = pixels[i];
    let g = pixels[i + 1];
    let b = pixels[i + 2];

    // 1. Exposición
    r = r * (1 + exposureFactor * 2); // Factor de 2 para un rango de efecto más amplio
    g = g * (1 + exposureFactor * 2);
    b = b * (1 + exposureFactor * 2);

    // 2. Brillo
    r += brightFactor * 255;
    g += brightFactor * 255;
    b += brightFactor * 255;

    // 3. Contraste
    r = (r - 128) * contrastFactor + 128;
    g = (g - 128) * contrastFactor + 128;
    b = (b - 128) * contrastFactor + 128;

    // 4. Saturación
    const avg = (r + g + b) / 3; // Promedio de luminosidad
    r = avg + (r - avg) * saturationFactor;
    g = avg + (g - avg) * saturationFactor;
    b = avg + (b - avg) * saturationFactor;

    // 5. Tonalidad (Hue)
    const originalR = r; // Guardar valores para la matriz de hue
    const originalG = g;
    const originalB = b;

    r =
      originalR * hueMatrix[0][0] +
      originalG * hueMatrix[0][1] +
      originalB * hueMatrix[0][2];
    g =
      originalR * hueMatrix[1][0] +
      originalG * hueMatrix[1][1] +
      originalB * hueMatrix[1][2];
    b =
      originalR * hueMatrix[2][0] +
      originalG * hueMatrix[2][1] +
      originalB * hueMatrix[2][2];

    // 6. Gamma (corrección no lineal)
    // Se aplica pow(color/255, 1/gamma), donde gamma es gammaFactor
    r = 255 * Math.pow(r / 255, 1 / gammaFactor);
    g = 255 * Math.pow(g / 255, 1 / gammaFactor);
    b = 255 * Math.pow(b / 255, 1 / gammaFactor);

    // Asegurar que los valores estén dentro del rango 0-255
    pixels[i] = Math.max(0, Math.min(255, r));
    pixels[i + 1] = Math.max(0, Math.min(255, g));
    pixels[i + 2] = Math.max(0, Math.min(255, b));
  }
  tempCtx.putImageData(imageData, 0, 0);

  // Dibuja el resultado en el buffer para que sea el nuevo estado actual
  if (currentImageBuffer) {
    currentImageBuffer.width = tempCanvas.width;
    currentImageBuffer.height = tempCanvas.height;
    currentImageBuffer.getContext("2d").drawImage(tempCanvas, 0, 0);
  }

  // Y luego dibuja el buffer en el canvas visible
  drawImageOnCanvasCallback(
    currentImageBuffer,
    imageCanvasElement,
    editorCtx,
    document.getElementById("placeholderText")
  );
  saveStateCallback(imageCanvasElement, setHistoryStateCallback); // Guarda el estado después de aplicar los ajustes
  showMessageCallback("Ajustes aplicados.", "success", messageAreaElement);
}

/**
 * Reinicia todos los sliders de ajuste a sus valores por defecto.
 * @param {Object} DOMElements - Referencias a los elementos DOM.
 */
export function resetAdjustments(DOMElements) {
  // Restablece los valores de los sliders a su estado por defecto
  if (DOMElements.brightnessRange) DOMElements.brightnessRange.value = 0;
  if (DOMElements.contrastRange) DOMElements.contrastRange.value = 0;
  if (DOMElements.saturationRange) DOMElements.saturationRange.value = 100;
  if (DOMElements.hueRotateRange) DOMElements.hueRotateRange.value = 0;
  if (DOMElements.exposureRange) DOMElements.exposureRange.value = 0;
  if (DOMElements.gammaRange) DOMElements.gammaRange.value = 100;
  if (DOMElements.blurIntensityRange) DOMElements.blurIntensityRange.value = 0;
  if (DOMElements.sharpenIntensityRange)
    DOMElements.sharpenIntensityRange.value = 0;

  // Actualiza los valores mostrados en la UI
  if (DOMElements.brightnessValue)
    DOMElements.brightnessValue.textContent = "0";
  if (DOMElements.contrastValue) DOMElements.contrastValue.textContent = "0";
  if (DOMElements.saturationValue)
    DOMElements.saturationValue.textContent = "100%";
  if (DOMElements.hueRotateValue) DOMElements.hueRotateValue.textContent = "0°";
  if (DOMElements.exposureValue) DOMElements.exposureValue.textContent = "0";
  if (DOMElements.gammaValue) DOMElements.gammaValue.textContent = "1.0";
  if (DOMElements.blurIntensityValue)
    DOMElements.blurIntensityValue.textContent = "0";
  if (DOMElements.sharpenIntensityValue)
    DOMElements.sharpenIntensityValue.textContent = "0";
}
