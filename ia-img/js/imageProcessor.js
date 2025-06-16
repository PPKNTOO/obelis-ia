// ia-img/js/imageProcessor.js

import { CONFIG } from "./config.js";

/**
 * Procesa una imagen: recorta la parte inferior (para eliminar marcas de agua de terceros)
 * y luego añade tu marca de agua personalizada.
 * @param {string} imageUrl - La URL de la imagen a procesar.
 * @returns {Promise<string>} - Una promesa que resuelve con la data URL de la imagen procesada con tu marca de agua.
 */
export function processImageWithLogo(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Necesario para evitar problemas de CORS al dibujar en canvas

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // 1. Calcular las dimensiones después del recorte inferior (para eliminar marcas de agua de terceros)
      const sourceX = 0;
      const sourceY = 0;
      const sourceWidth = img.naturalWidth;
      const sourceHeight = img.naturalHeight - CONFIG.IMAGE_CROP_BOTTOM_PX;

      // Asegurarse de que la altura no sea negativa después del recorte
      if (sourceHeight <= 0) {
        console.warn(
          "La altura de la imagen después del recorte es cero o negativa. No se aplicará el recorte inferior ni la marca de agua."
        );
        resolve(imageUrl);
        return;
      }

      // Establecer las dimensiones del canvas al tamaño recortado
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;

      // 2. Dibujar la porción recortada de la imagen original en el canvas
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        sourceWidth,
        sourceHeight
      );

      // 3. Cargar y dibujar tu marca de agua personalizada
      const customWatermark = new Image();
      customWatermark.crossOrigin = "Anonymous"; // Necesario para CORS
      customWatermark.src = CONFIG.OBELISAI_LOGO_URL; // Tu marca de agua WEBP

      customWatermark.onload = () => {
        // Calcular tamaño y posición de la marca de agua
        const watermarkWidth = Math.min(
          Math.max(100, canvas.width * 0.15),
          250
        ); // Tamaño adaptable, máx 250px
        const watermarkHeight =
          (customWatermark.naturalHeight / customWatermark.naturalWidth) *
          watermarkWidth;
        const padding = Math.max(10, canvas.width * 0.02); // Padding adaptable

        // Posicionar en la esquina inferior derecha del canvas (ya recortado)
        const x = canvas.width - watermarkWidth - padding;
        const y = canvas.height - watermarkHeight - padding;

        ctx.drawImage(customWatermark, x, y, watermarkWidth, watermarkHeight);
        resolve(canvas.toDataURL("image/png"));
      };

      customWatermark.onerror = (e) => {
        console.warn(
          "Error al cargar la imagen de marca de agua (personalizada), la imagen se mostrará sin ella:",
          e
        );
        resolve(canvas.toDataURL("image/png"));
      };
    };

    img.onerror = (e) => {
      console.error(
        "Error al cargar la imagen principal para procesamiento (recorte/marca de agua):",
        e
      );
      reject(new Error("No se pudo cargar la imagen para procesamiento."));
    };

    img.src = imageUrl;
  });
}

/**
 * Procesa una imagen para la galería (redimensiona y comprime).
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
      console.error("Error al cargar la imagen para la galería:", e);
      reject(new Error("No se pudo cargar la imagen para optimización."));
    };
    img.src = imageUrl;
  });
}
