// js/utils/helpers.js

// Importamos la función de mensajes para poder usarla aquí
import { showCustomMessage } from "../components/modals.js";

/**
 * Descarga una imagen dada su URL o Data URL.
 * @param {string} imageUrl - La URL o Data URL de la imagen.
 * @param {string} filename - El nombre del archivo para la descarga.
 */
export async function downloadImage(
  imageUrl,
  filename = "imagen_obelisia.png"
) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Error de red al obtener la imagen.`);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Libera memoria
  } catch (error) {
    console.error("Error al descargar la imagen:", error);
    showCustomMessage(`Error al descargar: ${error.message}.`, "error");
  }
}

/**
 * Calcula y muestra el uso del almacenamiento local en el elemento del DOM correspondiente.
 */
export function updateLocalStorageUsage() {
  const usageElement = document.querySelector("#localStorageUsage");
  if (!usageElement) return;

  let totalBytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && localStorage.getItem(key)) {
      // Multiplicamos por 2 porque JavaScript usa codificación UTF-16
      totalBytes += localStorage.getItem(key).length * 2;
    }
  }
  const totalMB = totalBytes / 1024 / 1024;

  usageElement.textContent = `Uso del Almacenamiento: ${totalMB.toFixed(2)} MB`;

  // Opcional: Mostrar una advertencia si el uso es alto
  const QUOTA_WARNING_MB = 4.5;
  if (totalMB >= QUOTA_WARNING_MB) {
    showCustomMessage(
      `Advertencia: Almacenamiento local casi lleno (${totalMB.toFixed(
        2
      )} MB).`,
      "info",
      7000
    );
  }
}

/**
 * Una función de ayuda para obtener elementos del DOM de forma segura.
 * @param {string} selector - El selector CSS del elemento.
 * @param {boolean} isQuerySelectorAll - Poner en true para obtener una lista de nodos.
 * @returns {HTMLElement|NodeList|null}
 */
export function getElement(selector, isQuerySelectorAll = false) {
  if (isQuerySelectorAll) {
    return document.querySelectorAll(selector);
  }
  return document.querySelector(selector);
}
