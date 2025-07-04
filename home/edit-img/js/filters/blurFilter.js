// edit-img/js/filters/blurFilter.js

/**
 * Aplica un filtro de desenfoque simple (box blur) a los píxeles.
 * @param {Uint8ClampedArray} pixels - Array de datos de píxeles (RGBA).
 * @param {number} width - Ancho de la imagen.
 * @param {number} height - Alto de la imagen.
 * @param {number} radius - Radio del desenfoque.
 */
export function applyBlurFilter(pixels, width, height, radius) {
  const newPixels = new Uint8ClampedArray(pixels.length);
  const kernelSize = Math.floor(radius * 2 + 1); // Asegura un tamaño de kernel impar
  const halfKernel = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rSum = 0,
        gSum = 0,
        bSum = 0,
        count = 0;

      for (let ky = -halfKernel; ky <= halfKernel; ky++) {
        for (let kx = -halfKernel; kx <= halfKernel; kx++) {
          const nx = x + kx;
          const ny = y + ky;

          // Comprobar límites para evitar errores
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const index = (ny * width + nx) * 4;
            rSum += pixels[index];
            gSum += pixels[index + 1];
            bSum += pixels[index + 2];
            count++;
          }
        }
      }
      const pixelIndex = (y * width + x) * 4;
      newPixels[pixelIndex] = rSum / count;
      newPixels[pixelIndex + 1] = gSum / count;
      newPixels[pixelIndex + 2] = bSum / count;
      newPixels[pixelIndex + 3] = pixels[pixelIndex + 3]; // Mantener el alfa original
    }
  }
  pixels.set(newPixels); // Copia los nuevos píxeles de vuelta al imageData original
}
