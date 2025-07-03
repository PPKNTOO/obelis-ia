// ia-text/js/aiService.js

import { generationsToday, setGenerationsToday } from "./state.js";
import { CONFIG } from "./config.js";
import {
  DOMElements,
  showCustomMessage,
  showLoadingOverlay,
  hideLoadingOverlay,
} from "../../js/global.js";
import {
  checkGenerationLimit,
  updateGenerationCounterDisplay,
} from "./limitManager.js";
import { formatGeneratedText } from "./textFormatter.js";
import { playAudio, stopAudio } from "./audioPlayer.js";
import { saveGeneratedContentToHistory } from "./historyManager.js";
import { savePreferences } from "./storage.js"; // Importar savePreferences

export const handleGenerateContent = async (event) => {
  event.preventDefault();

  // Es crucial obtener adsWatchedToday del localStorage para el cálculo correcto
  // ya que generationsToday y adsWatchedToday en state.js se inicializan al cargar.
  const currentAdsWatchedToday = parseInt(
    localStorage.getItem("adsWatchedToday") || "0",
    10
  );

  const totalAllowed =
    CONFIG.MAX_GENERATIONS_FREE +
    currentAdsWatchedToday * CONFIG.AD_BONUS_GENERATIONS;
  if (generationsToday >= totalAllowed) {
    checkGenerationLimit();
    return;
  }

  showLoadingOverlay("Generando tu contenido, por favor espera...");
  if (DOMElements.generatedTextDiv) {
    DOMElements.generatedTextDiv.innerHTML = "";
  }
  if (DOMElements.contentModal) {
    DOMElements.contentModal.classList.remove("show"); // Asegurarse de que el modal de contenido esté oculto
  }
  stopAudio(); // Detener cualquier audio en reproducción

  const prompt = DOMElements.promptInput.value.trim();
  const selectedContentType = DOMElements.contentTypeOptions
    ? document.querySelector('input[name="contentType"]:checked').value
    : "story";
  const selectedTone = DOMElements.toneSelect
    ? DOMElements.toneSelect.value
    : "";

  if (!prompt) {
    hideLoadingOverlay(); // Ocultar modal de carga si hay un error
    showCustomMessage(
      "Por favor, introduce una descripción para generar el contenido.",
      "error",
      3000
    );
    return;
  }

  try {
    let aiPrompt;
    let tonePhrase = selectedTone ? ` en un tono ${selectedTone}` : "";

    switch (selectedContentType) {
      case "story":
        aiPrompt = `Genera una historia con la siguiente trama${tonePhrase}: "${prompt}".`;
        break;
      case "script":
        aiPrompt = `Escribe un guion para una escena basada en${tonePhrase}: "${prompt}".`;
        break;
      case "poem":
        aiPrompt = `Compón un poema sobre${tonePhrase}: "${prompt}".`;
        break;
      case "song":
        aiPrompt = `Escribe la letra de una canción sobre${tonePhrase}: "${prompt}".`;
        break;
      case "article":
        aiPrompt = `Redacta un artículo informativo sobre el tema${tonePhrase}: "${prompt}".`;
        break;
      case "email":
        aiPrompt = `Escribe un correo electrónico para el siguiente propósito${tonePhrase}: "${prompt}".`;
        break;
      case "product_description":
        aiPrompt = `Crea una descripción de producto para${tonePhrase}: "${prompt}".`;
        break;
      case "summary":
        aiPrompt = `Resume el siguiente texto/tema${tonePhrase}: "${prompt}".`;
        break;
      case "argumentative_paragraph":
        aiPrompt = `Escribe un párrafo argumentativo defendiendo o refutando la idea${tonePhrase}: "${prompt}".`;
        break;
      case "recipe":
        aiPrompt = `Genera una receta para${tonePhrase}: "${prompt}".`;
        break;
      case "ai_prompt":
        aiPrompt = `Genera un prompt detallado para una IA de generación de texto o imagen basado en la siguiente descripción: "${prompt}". Incluye detalles como estilo, tema, elementos clave y atmósfera.`;
        break;
      default:
        aiPrompt = `Genera un/una ${selectedContentType} basado en la siguiente descripción${tonePhrase}: "${prompt}".`;
        break;
    }

    // CAMBIO CLAVE AQUÍ: Construir el payload con 'contents'
    const chatHistory = [{ role: "user", parts: [{ text: aiPrompt }] }];
    const payload = { contents: chatHistory }; // Ahora es { contents: [...] }

    const apiUrl = "/api/gemini"; // Usa la ruta del proxy de Vercel

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload), // Envía el payload con 'contents'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error de la API del proxy: ${response.status} ${
          response.statusText
        }. Respuesta: ${errorText.substring(
          0,
          Math.min(errorText.length, 100)
        )}`
      );
    }

    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      const rawResponseText = await response.text();
      throw new Error(
        `Error al procesar la respuesta de la IA (JSON inválido del proxy). Respuesta: ${rawResponseText.substring(
          0,
          Math.min(rawResponseText.length, 100)
        )}`
      );
    }

    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content &&
      result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0
    ) {
      const rawText = result.candidates[0].content.parts[0].text;
      if (DOMElements.generatedTextDiv) {
        DOMElements.generatedTextDiv.innerHTML = formatGeneratedText(rawText);
      }
      if (DOMElements.contentModal) {
        DOMElements.contentModal.classList.add("show"); // Mostrar el modal de contenido
      }
      playAudio(); // Iniciar reproducción de audio
      saveGeneratedContentToHistory(
        prompt,
        selectedContentType,
        rawText,
        selectedTone
      );
      setGenerationsToday(generationsToday + 1); // Aumentar el contador
      savePreferences(); // Guardar en localStorage inmediatamente
      updateGenerationCounterDisplay();
      checkGenerationLimit();
      showCustomMessage(
        "¡Contenido generado y guardado en historial!",
        "success",
        3000
      );
    } else {
      throw new Error(
        "No se pudo generar el contenido. La IA no proporcionó una respuesta válida a través del proxy. Por favor, inténtalo de nuevo con una descripción diferente."
      );
    }
  } catch (err) {
    showLoadingOverlay(`Error al generar: ${err.message}`, true);
    console.error("Error en la llamada a la API o procesamiento:", err);
  } finally {
    hideLoadingOverlay();
  }
};
