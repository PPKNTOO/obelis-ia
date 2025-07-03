// ia-img/js/aiService.js

import {
  DOMElements,
  showCustomMessage,
  showLoadingOverlay,
  hideLoadingOverlay,
} from "../../js/global.js";
import { CONFIG } from "./config.js";
import {
  freeGenerationsLeft,
  setFreeGenerationsLeft,
  fallbackImageIndex,
  setFallbackImageIndex,
  setLastGeneratedImageUrl,
} from "./state.js";
import {
  processImageWithLogo,
  processImageForGallery,
} from "./imageProcessor.js";
import {
  saveImageToGallery,
  renderGallery,
  renderRecentGenerations,
} from "./galleryManager.js";
import { updateGenerationCounterUI } from "./uiUpdater.js";

export async function generatePromptSuggestion() {
  if (!DOMElements.promptInput || !DOMElements.generatePromptSuggestionButton)
    return;

  showLoadingOverlay("Generando una sugerencia...", false);
  DOMElements.generatePromptSuggestionButton.disabled = true;

  try {
    const promptForLLM =
      "Genera una idea de prompt detallada y creativa para una imagen de IA. Asegúrate de que sea concisa pero inspiradora.";
    const chatHistory = [{ role: "user", parts: [{ text: promptForLLM }] }];

    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: chatHistory }),
    });

    if (!response.ok)
      throw new Error(`Error del proxy Gemini: ${response.statusText}`);

    const result = await response.json();
    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (generatedText) {
      DOMElements.promptInput.value = generatedText.replace(/["*]/g, ""); // Limpia comillas o asteriscos
      if (DOMElements.promptSuggestionBox)
        DOMElements.promptSuggestionBox.classList.remove("show");
      showCustomMessage("Sugerencia generada.", "success");
    } else {
      throw new Error("Respuesta inesperada de la IA.");
    }
  } catch (error) {
    console.error("Error al generar prompt sugerido:", error);
    showCustomMessage(
      `No se pudo generar un prompt: ${error.message}`,
      "error"
    );
  } finally {
    hideLoadingOverlay();
    if (DOMElements.generatePromptSuggestionButton)
      DOMElements.generatePromptSuggestionButton.disabled = false;
  }
}

export async function improvePrompt() {
  const { promptInput, improvePromptButton, generateButton, toneSelect } =
    DOMElements;
  if (!promptInput || !improvePromptButton || !generateButton || !toneSelect)
    return;

  const currentPrompt = promptInput.value.trim();
  if (!currentPrompt) {
    showCustomMessage("Escribe algo para mejorarlo.", "error");
    return;
  }

  showLoadingOverlay("Mejorando prompt...", false);
  improvePromptButton.disabled = true;
  generateButton.disabled = true;
  promptInput.disabled = true;

  try {
    const selectedTone = toneSelect.value;
    const promptForLLM = `Reescribe y expande el siguiente prompt para una imagen de IA. Hazlo mucho más detallado, con al menos 150 caracteres, y aplica un tono '${selectedTone}'. Devuelve solo el prompt puro, sin comentarios ni texto adicional. Prompt original: '${currentPrompt}'`;
    const chatHistory = [{ role: "user", parts: [{ text: promptForLLM }] }];

    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: chatHistory }),
    });

    if (!response.ok)
      throw new Error(`Error del proxy Gemini: ${response.statusText}`);

    const result = await response.json();
    const generatedText =
      result.candidates?.[0]?.content?.parts?.[0]?.text.trim();

    if (generatedText) {
      promptInput.value = generatedText.replace(/["*]/g, ""); // Limpia comillas o asteriscos
      showCustomMessage("¡Prompt mejorado!", "success");
    } else {
      throw new Error("Respuesta inesperada de la IA.");
    }
  } catch (error) {
    console.error("Error al mejorar prompt:", error);
    showCustomMessage(`No se pudo mejorar: ${error.message}`, "error");
  } finally {
    hideLoadingOverlay();
    improvePromptButton.disabled = false;
    generateButton.disabled = false;
    promptInput.disabled = false;
  }
}

export async function generateImage() {
  if (freeGenerationsLeft <= 0) {
    showCustomMessage("Has agotado tus generaciones gratuitas.", "error");
    return;
  }

  const {
    promptInput,
    generatedImage,
    imagePlaceholderText,
    downloadMainImageButton,
    styleSelect,
    aspectRatioSelect,
  } = DOMElements;
  const prompt = promptInput.value.trim();
  if (!prompt) {
    showCustomMessage("Ingresa una descripción para la imagen.", "error");
    return;
  }

  showLoadingOverlay(`Generando tu imagen...`);
  generatedImage.classList.add("hidden");
  imagePlaceholderText.classList.add("hidden");
  downloadMainImageButton.classList.add("hidden");

  const finalPrompt =
    styleSelect.value !== "none"
      ? `${prompt}, ${styleSelect.value} style`
      : prompt;

  let width, height;
  switch (aspectRatioSelect.value) {
    case "16:9":
      width = 1024;
      height = 576;
      break;
    case "9:16":
      width = 576;
      height = 1024;
      break;
    case "4:3":
      width = 800;
      height = 600;
      break;
    default:
      width = 768;
      height = 768;
      break;
  }

  const encodedPrompt = encodeURIComponent(finalPrompt);
  let success = false;
  let finalImageUrl = "";

  for (let attempt = 0; attempt < CONFIG.MAX_RETRIES && !success; attempt++) {
    try {
      const url = `${
        CONFIG.API_BASE_URL
      }${encodedPrompt}?width=${width}&height=${height}&seed=${Date.now()}&attempt=${attempt}`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(CONFIG.TIMEOUT_MS),
      });

      if (!response.ok)
        throw new Error(`API de imagen falló con status ${response.status}`);

      // La URL final después de redirecciones es la que importa
      const originalImageUrl = response.url;
      const processedImageUrl = await processImageWithLogo(originalImageUrl);
      const optimizedImageUrlForGallery = await processImageForGallery(
        processedImageUrl
      );

      saveImageToGallery(optimizedImageUrlForGallery);
      setLastGeneratedImageUrl(processedImageUrl);
      setFreeGenerationsLeft(freeGenerationsLeft - 1);
      updateGenerationCounterUI();

      finalImageUrl = processedImageUrl;
      success = true;
    } catch (error) {
      console.warn(`Intento ${attempt + 1} fallido:`, error);
      if (attempt === CONFIG.MAX_RETRIES - 1) {
        showCustomMessage(
          `No se pudo generar la imagen: ${error.message}`,
          "error",
          5000
        );
      }
    }
  }

  if (success) {
    generatedImage.src = finalImageUrl;
    showCustomMessage("¡Imagen generada!", "success");
  } else {
    generatedImage.src = CONFIG.FALLBACK_IMAGES[fallbackImageIndex];
    setFallbackImageIndex(
      (fallbackImageIndex + 1) % CONFIG.FALLBACK_IMAGES.length
    );
  }

  generatedImage.classList.remove("hidden");
  if (success) downloadMainImageButton.classList.remove("hidden");
  renderGallery();
  renderRecentGenerations();
  hideLoadingOverlay();
}

export function watchAdForGenerations() {
  if (!DOMElements.watchAdButton) return;

  showCustomMessage("Simulando anuncio...", "info", 3000);
  DOMElements.watchAdButton.disabled = true;

  setTimeout(() => {
    setFreeGenerationsLeft(
      freeGenerationsLeft + CONFIG.GENERATIONS_PER_AD_WATCH
    );
    updateGenerationCounterUI();
    showCustomMessage(
      `¡Has obtenido +${CONFIG.GENERATIONS_PER_AD_WATCH} generaciones!`,
      "success"
    );
    DOMElements.watchAdButton.disabled = false;
  }, 3000);
}
