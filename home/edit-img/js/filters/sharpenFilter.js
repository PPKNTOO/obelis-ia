// edit-img/js/filters/sharpenFilter.js

/**
 * Aplica un filtro de enfoque (kernel de convolución) a los píxeles.
 * @param {Uint8ClampedArray} pixels - Array de datos de píxeles (RGBA).
 * @param {number} width - Ancho de la imagen.
 * @param {number} height - Alto de la imagen.
 * @param {number} amount - Intensidad del enfoque.
 */
export function applySharpenFilter(pixels, width, height, amount) {
  // Un kernel de enfoque básico
  const kernel = [
    0,
    -amount,
    0,
    -amount,
    1 + 4 * amount,
    -amount,
    0,
    -amount,
    0,
  ];
  const kernelSize = Math.sqrt(kernel.length);
  const halfKernel = Math.floor(kernelSize / 2);
  const newPixels = new Uint8ClampedArray(pixels.length);

  for (let y = halfKernel; y < height - halfKernel; y++) {
    for (let x = halfKernel; x < width - halfKernel; x++) {
      let rSum = 0,
        gSum = 0,
        bSum = 0;

      for (let ky = 0; ky < kernelSize; ky++) {
        for (let kx = 0; kx < kernelSize; kx++) {
          const pixelX = x + kx - halfKernel;
          const pixelY = y + ky - halfKernel;
          const index = (pixelY * width + pixelX) * 4;
          const kernelValue = kernel[ky * kernelSize + kx];

          rSum += pixels[index] * kernelValue;
          gSum += pixels[index + 1] * kernelValue;
          bSum += pixels[index + 2] * kernelValue;
        }
      }
      const pixelIndex = (y * width + x) * 4;
      newPixels[pixelIndex] = Math.max(0, Math.min(255, rSum));
      newPixels[pixelIndex + 1] = Math.max(0, Math.min(255, gSum));
      newPixels[pixelIndex + 2] = Math.max(0, Math.min(255, bSum));
      newPixels[pixelIndex + 3] = pixels[pixelIndex + 3]; // Mantener el alfa original
    }
  }
  pixels.set(newPixels); // Copia los nuevos píxeles de vuelta al imageData original
}
