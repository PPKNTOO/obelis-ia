// ia-img/js/imageProcessor.js

import { CONFIG } from "./config.js";

/**
 * Procesa una imagen: recorta la parte inferior (para eliminar marcas de agua de terceros)
 * y luego añade tu marca de agua personalizada.
 * @param {string} imageUrl - La URL de la imagen a procesar.
 * @returns {Promise<string>} - Una promesa que resuelve con la data URL de la imagen procesada.
 */
export function processImageWithLogo(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const sourceWidth = img.naturalWidth;
      const sourceHeight = img.naturalHeight - CONFIG.IMAGE_CROP_BOTTOM_PX;

      if (sourceHeight <= 0) {
        console.warn(
          "La altura de la imagen es demasiado pequeña para recortar. Se omitirá la marca de agua."
        );
        resolve(imageUrl); // Devuelve la URL original si no se puede procesar
        return;
      }

      canvas.width = sourceWidth;
      canvas.height = sourceHeight;
      ctx.drawImage(
        img,
        0,
        0,
        sourceWidth,
        sourceHeight,
        0,
        0,
        sourceWidth,
        sourceHeight
      );

      const watermark = new Image();
      watermark.crossOrigin = "Anonymous";
      watermark.src = CONFIG.OBELISAI_LOGO_URL;

      watermark.onload = () => {
        const watermarkWidth = Math.min(
          Math.max(100, canvas.width * 0.15),
          250
        );
        const watermarkHeight =
          (watermark.naturalHeight / watermark.naturalWidth) * watermarkWidth;
        const padding = Math.max(10, canvas.width * 0.02);
        const x = canvas.width - watermarkWidth - padding;
        const y = canvas.height - watermarkHeight - padding;

        ctx.drawImage(watermark, x, y, watermarkWidth, watermarkHeight);
        resolve(canvas.toDataURL("image/png"));
      };

      watermark.onerror = (e) => {
        console.warn(
          "No se pudo cargar la marca de agua. La imagen se guardará sin ella.",
          e
        );
        resolve(canvas.toDataURL("image/png")); // Resuelve sin la marca de agua si falla
      };
    };

    img.onerror = (e) => {
      console.error(
        "No se pudo cargar la imagen principal para procesarla:",
        e
      );
      reject(new Error("No se pudo cargar la imagen para procesamiento."));
    };

    img.src = imageUrl;
  });
}

/**
 * Procesa una imagen para la galería (redimensiona y comprime).
 * @param {string} imageUrl - La URL de la imagen a procesar.
 * @returns {Promise<string>} - Una promesa que resuelve con la data URL de la imagen optimizada.
 */
export function processImageForGallery(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      let width = img.naturalWidth;
      let height = img.naturalHeight;

      if (width > CONFIG.GALLERY_MAX_WIDTH) {
        height = Math.round((height * CONFIG.GALLERY_MAX_WIDTH) / width);
        width = CONFIG.GALLERY_MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", CONFIG.GALLERY_JPEG_QUALITY));
    };
    img.onerror = (e) => {
      console.error(
        "Error al cargar imagen para optimizar para la galería:",
        e
      );
      reject(new Error("No se pudo cargar la imagen para optimización."));
    };
    img.src = imageUrl;
  });
}
