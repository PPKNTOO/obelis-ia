// edit-img/js/filters/sepiaFilter.js

/**
 * Aplica el filtro sepia a los píxeles.
 * @param {Uint8ClampedArray} pixels - Array de datos de píxeles (RGBA).
 */
export function applySepiaFilter(pixels) {
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    pixels[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189); // Nuevo rojo
    pixels[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168); // Nuevo verde
    pixels[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131); // Nuevo azul
  }
}
