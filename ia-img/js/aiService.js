// ia-img/js/aiService.js

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
import {
  DOMElements,
  showCustomMessage,
  showLoadingOverlay,
  hideLoadingOverlay,
} from "../../js/global.js";
import { updateGenerationCounterUI } from "./uiUpdater.js";

export async function generatePromptSuggestion() {
  if (!DOMElements.promptInput || !DOMElements.generatePromptSuggestionButton)
    return;
  showLoadingOverlay("Generando una sugerencia de prompt...", false);
  DOMElements.generatePromptSuggestionButton.disabled = true;

  try {
    const promptForLLM = // <-- Definición aquí
      "Genera una idea de prompt detallada y creativa para una imagen de IA. Asegúrate de que sea concisa pero inspiradora. Por ejemplo: 'Un bosque místico con árboles bioluminiscentes y criaturas de fantasía, estilo arte digital, iluminación etérea.'";

    let chatHistory = [{ role: "user", parts: [{ text: promptForLLM }] }];

    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: chatHistory }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Error al generar prompt desde el proxy: ${
          errorData.error?.message || response.statusText || "Error desconocido"
        }`
      );
    }

    const result = await response.json();
    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content &&
      result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0
    ) {
      const generatedText = result.candidates[0].content.parts[0].text;
      DOMElements.promptInput.value = generatedText;
      if (DOMElements.promptSuggestionBox)
        DOMElements.promptSuggestionBox.classList.remove("show");
      showCustomMessage("Sugerencia de prompt generada.", "success");
    } else {
      throw new Error(
        "Respuesta inesperada de la IA para el prompt a través del proxy: no se encontró contenido válido."
      );
    }
  } catch (error) {
    console.error("Error al generar prompt sugerido (frontend):", error);
    showLoadingOverlay(`No se pudo generar un prompt: ${error.message}`, true);
  } finally {
    hideLoadingOverlay();
    if (DOMElements.generatePromptSuggestionButton)
      DOMElements.generatePromptSuggestionButton.disabled = false;
  }
}

export async function improvePrompt() {
  if (
    !DOMElements.promptInput ||
    !DOMElements.improvePromptButton ||
    !DOMElements.generateButton ||
    !DOMElements.toneSelect
  )
    return;
  const currentPrompt = DOMElements.promptInput.value.trim();
  if (!currentPrompt) {
    showCustomMessage(
      "Por favor, escribe algo en el prompt para mejorarlo.",
      "error"
    );
    return;
  }

  showLoadingOverlay("Mejorando el prompt... Por favor, espera.", false);

  DOMElements.improvePromptButton.disabled = true;
  DOMElements.generateButton.disabled = true;
  DOMElements.promptInput.disabled = true;

  try {
    const selectedTone = DOMElements.toneSelect.value;
    const promptForLLM =
      // <-- Definición aquí
      `Reescribe y expande el siguiente prompt para una imagen de IA. Hazlo mucho más detallado, con al menos ${CONFIG.MIN_IMPROVED_PROMPT_LENGTH} caracteres, y aplica un tono '${selectedTone}'. Solo devuelve el prompt puro, sin comentarios ni texto adicional. Prompt original: '${currentPrompt}'`;

    let chatHistory = [{ role: "user", parts: [{ text: promptForLLM }] }];

    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: chatHistory }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Error al mejorar prompt desde el proxy: ${
          errorData.error?.message || response.statusText || "Error desconocido"
        }`
      );
    }

    const result = await response.json();
    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content &&
      result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0
    ) {
      let generatedText = result.candidates[0].content.parts[0].text.trim();

      if (generatedText.length < CONFIG.MIN_IMPROVED_PROMPT_LENGTH) {
        showCustomMessage(
          `El prompt generado fue demasiado corto (${generatedText.length} caracteres). Intenta de nuevo o ajusta el tono.`,
          "info"
        );
      } else {
        showCustomMessage("¡Prompt mejorado con éxito!", "success");
      }
      DOMElements.promptInput.value = generatedText;
    } else {
      throw new Error(
        "Respuesta inesperada de la IA al mejorar el prompt a través del proxy: no se encontró contenido válido."
      );
    }
  } catch (error) {
    console.error("Error al mejorar prompt (frontend):", error);
    showLoadingOverlay(`No se pudo mejorar el prompt: ${error.message}`, true);
  } finally {
    hideLoadingOverlay();
    DOMElements.improvePromptButton.disabled = false;
    DOMElements.generateButton.disabled = false;
    DOMElements.promptInput.disabled = false;
  }
}

export async function generateImage() {
  if (freeGenerationsLeft <= 0) {
    showCustomMessage(
      "Has agotado tus generaciones gratuitas. Mira un anuncio para obtener más.",
      "error"
    );
    return;
  }

  if (
    !DOMElements.promptInput ||
    !DOMElements.generatedImage ||
    !DOMElements.imagePlaceholderText ||
    !DOMElements.downloadMainImageButton ||
    !DOMElements.styleSelect ||
    !DOMElements.aspectRatioSelect
  )
    return;

  const prompt = DOMElements.promptInput.value.trim();
  if (!prompt) {
    showCustomMessage(
      "Por favor, ingresa una descripción para la imagen.",
      "error"
    );
    return;
  }

  showLoadingOverlay(
    `Generando tu imagen de "${prompt}"... Esto puede tardar unos 2-3 minutos, por favor espera.`,
    false
  );
  DOMElements.generatedImage.classList.add("hidden");
  DOMElements.imagePlaceholderText.classList.add("hidden");
  DOMElements.downloadMainImageButton.classList.add("hidden");
  if (DOMElements.promptSuggestionBox)
    DOMElements.promptSuggestionBox.classList.remove("show");

  const selectedStyle = DOMElements.styleSelect.value;
  const selectedAspectRatio = DOMElements.aspectRatioSelect.value;

  // Definir finalPrompt aquí, antes de su uso
  let finalPrompt = prompt; // <-- Asegurarse que finalPrompt se define aquí
  if (selectedStyle !== "none") {
    finalPrompt += `, ${selectedStyle} style`;
  }

  let width = CONFIG.DEFAULT_IMAGE_WIDTH;
  let height = CONFIG.DEFAULT_IMAGE_HEIGHT;

  switch (selectedAspectRatio) {
    case "1:1":
      width = 768;
      height = 768;
      break;
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
  }

  const encodedPrompt = encodeURIComponent(finalPrompt);
  let originalImageUrl = "";
  let processedImageUrl = "";
  let success = false;

  for (
    let attemptCount = 0;
    attemptCount <= CONFIG.MAX_RETRIES && !success;
    attemptCount++
  ) {
    try {
      const currentPollinationUrl = `${
        CONFIG.API_BASE_URL
      }${encodedPrompt}?width=${width}&height=${height}&_=${new Date().getTime()}&attempt=${attemptCount}`;

      const loadImagePromise = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(currentPollinationUrl);
        img.onerror = (e) => {
          console.error(
            `Error loading image from Pollinations.ai (attempt ${
              attemptCount + 1
            }):`,
            e
          );
          reject(new Error("Error al cargar la imagen de IA."));
        };
        img.src = currentPollinationUrl;
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(new Error("Tiempo de espera excedido para la API de IA.")),
          CONFIG.TIMEOUT_MS
        )
      );

      originalImageUrl = await Promise.race([loadImagePromise, timeoutPromise]);
      processedImageUrl = await processImageWithLogo(originalImageUrl);

      const optimizedImageUrlForGallery = await processImageForGallery(
        processedImageUrl
      );

      saveImageToGallery(optimizedImageUrlForGallery);
      setLastGeneratedImageUrl(processedImageUrl);
      localStorage.setItem("lastGeneratedImageUrlDisplayed", processedImageUrl);

      success = true;

      setFreeGenerationsLeft(freeGenerationsLeft - 1);
      localStorage.setItem("freeGenerationsLeft", freeGenerationsLeft);
      updateGenerationCounterUI();
    } catch (error) {
      console.warn(`Intento ${attemptCount + 1} fallido: ${error.message}`);
      if (attemptCount === CONFIG.MAX_RETRIES) {
        showLoadingOverlay(
          `Todos los intentos para generar la imagen con IA fallaron: ${error.message}.`,
          true
        );
      } else {
        await new Promise((resolve) =>
          setTimeout(resolve, CONFIG.RETRY_DELAY_MS)
        );
      }
    }
  }

  if (success && processedImageUrl) {
    DOMElements.generatedImage.src = processedImageUrl;
    DOMElements.generatedImage.alt = `Imagen generada: ${prompt}`;
    DOMElements.generatedImage.classList.remove("hidden");
    DOMElements.imagePlaceholderText.classList.add("hidden");
    DOMElements.downloadMainImageButton.classList.remove("hidden");

    renderGallery();
    renderRecentGenerations();

    showCustomMessage(
      "¡Imagen generada y guardada en tu galería!",
      "success",
      3000
    );
  } else {
    const fallbackUrl = CONFIG.FALLBACK_IMAGES[fallbackImageIndex];
    setFallbackImageIndex(
      (fallbackImageIndex + 1) % CONFIG.FALLBACK_IMAGES.length
    );
    DOMElements.generatedImage.src = fallbackUrl;
    DOMElements.generatedImage.alt = "Imagen de ejemplo";
    DOMElements.downloadMainImageButton.classList.add("hidden");
    showCustomMessage(
      "No se pudo generar la imagen con IA. Se mostró una imagen de ejemplo.",
      "info"
    );
    renderGallery();
    renderRecentGenerations();
  }

  hideLoadingOverlay();
}

export function watchAdForGenerations() {
  if (!DOMElements.watchAdButton) return;
  showCustomMessage("Simulando anuncio... por favor espera.", "info", 3000);
  DOMElements.watchAdButton.disabled = true;

  setTimeout(() => {
    setFreeGenerationsLeft(
      freeGenerationsLeft + CONFIG.GENERATIONS_PER_AD_WATCH
    );
    localStorage.setItem("freeGenerationsLeft", freeGenerationsLeft);
    updateGenerationCounterUI();
    DOMElements.watchAdButton.disabled = false;
    showCustomMessage(
      `¡Has obtenido +${CONFIG.GENERATIONS_PER_AD_WATCH} generaciones!`,
      "success",
      3000
    );
  }, 3000);
}
