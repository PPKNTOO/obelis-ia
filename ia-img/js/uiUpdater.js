// ia-img/js/uiUpdater.js

import { DOMElements } from "../../js/global.js";
import { freeGenerationsLeft } from "./state.js";
import { CONFIG } from "./config.js";

/**
 * Actualiza la interfaz del contador de generaciones y habilita/deshabilita
 * el botón de generar según las generaciones restantes.
 */
export function updateGenerationCounterUI() {
  if (
    !DOMElements.generationCounter ||
    !DOMElements.generateButton ||
    !DOMElements.watchAdButton
  ) {
    return;
  }

  DOMElements.generationCounter.textContent = `Generaciones gratuitas restantes: ${freeGenerationsLeft}`;
  const isDisabled = freeGenerationsLeft <= 0;

  DOMElements.generateButton.disabled = isDisabled;
  DOMElements.generateButton.classList.toggle("opacity-50", isDisabled);
  DOMElements.generateButton.classList.toggle("cursor-not-allowed", isDisabled);
  DOMElements.watchAdButton.classList.toggle("hidden", !isDisabled);

  if (isDisabled) {
    DOMElements.generationCounter.textContent += " (Ver anuncio para más)";
  }
}

/**
 * Muestra el cuadro de sugerencia de prompts.
 */
export function showPromptSuggestionBox() {
  if (!DOMElements.promptSuggestionBox) return;
  DOMElements.promptSuggestionBox.classList.add("show");
}
