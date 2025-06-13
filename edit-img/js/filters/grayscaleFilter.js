// edit-img/js/filters/grayscaleFilter.js

/**
 * Aplica el filtro de escala de grises a los píxeles.
 * @param {Uint8ClampedArray} pixels - Array de datos de píxeles (RGBA).
 */
export function applyGrayscaleFilter(pixels) {
  for (let i = 0; i < pixels.length; i += 4) {
    // Fórmula de luma para un mejor resultado perceptivo
    const luma =
      pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
    pixels[i] = pixels[i + 1] = pixels[i + 2] = luma;
  }
}
