// edit-img/js/tools/toolManager.js
import { showMessage } from "../ui.js";
import { initCropTool } from "./cropTool.js"; // Importa la función de inicialización del recorte

// Define un objeto para mantener el estado de la herramienta activa
export const activeToolState = {
  current: "brush", // Pincel por defecto
};

/**
 * Activa una herramienta específica, actualizando la UI y el estado.
 * @param {string} toolName - Nombre de la herramienta a activar ('brush', 'eraser', 'text', 'eyedropper', 'crop').
 * @param {Object} DOMElements - Referencias a los elementos DOM.
 */
export function activateTool(toolName, DOMElements) {
  // Quitar la clase 'active-tool' de todos los botones de herramienta
  const toolButtons = document.querySelectorAll(
    ".sidebar-tool-group button.tool-btn"
  );
  toolButtons.forEach((btn) => btn.classList.remove("active-tool"));

  // Ocultar todas las opciones de herramientas específicas
  if (DOMElements.textOptions) DOMElements.textOptions.classList.add("hidden");
  if (DOMElements.cropOptions) DOMElements.cropOptions.classList.add("hidden");
  if (DOMElements.imageCanvas)
    DOMElements.imageCanvas.style.cursor = "crosshair"; // Cursor por defecto para dibujo

  // Reiniciar estados específicos de herramientas
  // (activeToolState.isTextPlacing y .isEyedropperActive se manejan en main.js)
  if (DOMElements.cropOverlay && toolName !== "crop")
    DOMElements.cropOverlay.classList.add("hidden"); // Ocultar overlay de recorte si no es la herramienta de recorte

  // Actualizar la herramienta activa
  activeToolState.current = toolName;

  // Actualizar el texto de la herramienta activa en la UI
  if (DOMElements.activeToolDisplay) {
    let displayToolName = toolName.charAt(0).toUpperCase() + toolName.slice(1);
    if (toolName === "brush") displayToolName = "Pincel";
    else if (toolName === "eraser") displayToolName = "Borrador";
    else if (toolName === "text") displayToolName = "Texto";
    else if (toolName === "eyedropper") displayToolName = "Cuentagotas";
    else if (toolName === "crop") displayToolName = "Recorte";
    DOMElements.activeToolDisplay.textContent = displayToolName;
  }

  // Añadir clase 'active-tool' al botón de la herramienta seleccionada
  let currentToolButton = null;
  if (toolName === "brush") currentToolButton = DOMElements.brushTool;
  else if (toolName === "eraser") currentToolButton = DOMElements.eraserTool;
  else if (toolName === "text") currentToolButton = DOMElements.textTool;
  else if (toolName === "eyedropper")
    currentToolButton = DOMElements.eyedropperTool;
  else if (toolName === "crop") currentToolButton = DOMElements.menuCropTool; // Usar el botón del menú para Recorte

  if (currentToolButton) {
    currentToolButton.classList.add("active-tool");
  }

  // Mostrar opciones específicas de la herramienta
  switch (toolName) {
    case "brush":
    case "eraser":
      // No hay opciones adicionales de UI
      break;
    case "text":
      if (DOMElements.textOptions)
        DOMElements.textOptions.classList.remove("hidden");
      showMessage(
        "Haz clic en el canvas para añadir texto.",
        "info",
        DOMElements.messageArea
      );
      break;
    case "eyedropper":
      if (DOMElements.imageCanvas)
        DOMElements.imageCanvas.style.cursor = "copy"; // Cursor para el cuentagotas
      showMessage(
        "Haz clic en el canvas para seleccionar un color.",
        "info",
        DOMElements.messageArea
      );
      break;
    case "crop":
      // Llama a la función de inicialización de la herramienta de recorte
      initCropTool(
        DOMElements.imageCanvas,
        DOMElements.imageCanvas.getContext("2d"),
        DOMElements.cropOverlay,
        DOMElements.cropOptions
      );
      showMessage(
        "Arrastra en el canvas para seleccionar el área de recorte.",
        "info",
        DOMElements.messageArea
      );
      break;
    default:
      break;
  }
}
