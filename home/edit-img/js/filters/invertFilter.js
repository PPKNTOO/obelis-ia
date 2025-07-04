// edit-img/js/filters/invertFilter.js

/**
 * Invierte los colores de los píxeles.
 * @param {Uint8ClampedArray} pixels - Array de datos de píxeles (RGBA).
 */
export function applyInvertFilter(pixels) {
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = 255 - pixels[i]; // Invertir rojo
    pixels[i + 1] = 255 - pixels[i + 1]; // Invertir verde
    pixels[i + 2] = 255 - pixels[i + 2]; // Invertir azul
  }
}
