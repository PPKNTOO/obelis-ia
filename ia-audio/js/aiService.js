// ia-audio/js/aiService.js

import {
  DOMElements,
  showCustomMessage,
  showLoadingOverlay,
  hideLoadingOverlay,
  updateProgress,
} from "../../js/global.js";
import { checkAdRequirement, useGenerationCredit } from "./limitManager.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Llama a la IA de Gemini para mejorar el prompt del usuario.
 */
export async function handleImprovePrompt() {
  const prompt = DOMElements.promptAudio.value.trim();
  if (!prompt) {
    showCustomMessage("Escribe algo en el prompt para mejorarlo.", "error");
    return;
  }

  showLoadingOverlay("Mejorando prompt con IA...");
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Reescribe y expande el siguiente prompt para una canción de IA, hazlo más detallado y evocador, manteniendo la idea central: "${prompt}"`,
              },
            ],
          },
        ],
      }),
    });
    if (!response.ok) {
      throw new Error("La IA no pudo mejorar el prompt en este momento.");
    }
    const result = await response.json();
    const newPrompt = result.candidates[0]?.content?.parts[0]?.text;
    if (newPrompt) {
      DOMElements.promptAudio.value = newPrompt.replace(/["*]/g, "");
      showCustomMessage("¡Prompt mejorado!", "success");
    } else {
      throw new Error("Respuesta inesperada de la IA.");
    }
  } catch (error) {
    showCustomMessage(error.message, "error");
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * Maneja la lógica completa de generación de audio, incluyendo anuncios y barra de progreso.
 */
export async function handleGenerateAudio() {
  // 1. Comprueba si el usuario necesita ver un anuncio.
  const canGenerate = await checkAdRequirement();
  if (!canGenerate) {
    // Si no puede generar (ej. cerró el modal del anuncio), la función se detiene.
    return;
  }

  const {
    promptAudio,
    genreSelect,
    moodSelect,
    durationSlider,
    audioPlayerContainer,
    audioPlayer,
    downloadAudioLink,
  } = DOMElements;
  const promptText = promptAudio.value.trim();

  if (!promptText) {
    showCustomMessage(
      "Por favor, describe la música que quieres crear.",
      "error"
    );
    return;
  }

  const finalPrompt = `${promptText}, ${genreSelect.value} style, ${moodSelect.value} mood`;
  showLoadingOverlay("Iniciando generación...", false);

  try {
    const initialResponse = await fetch("/api/music-generator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: finalPrompt,
        duration_seconds: parseInt(durationSlider.value),
      }),
    });

    let prediction = await initialResponse.json();
    if (initialResponse.status !== 202) {
      throw new Error(prediction.detail || "Error al iniciar la generación.");
    }

    // 2. Muestra el overlay con la barra de progreso.
    showLoadingOverlay("La IA está componiendo...", true);

    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed"
    ) {
      await sleep(2500);
      const statusResponse = await fetch(
        `/api/get-prediction?id=${prediction.id}`
      );
      prediction = await statusResponse.json();

      // 3. Lógica para actualizar la barra de progreso
      // Replicate a menudo muestra el progreso en sus logs
      const log = prediction.logs || "";
      const progressMatch = log.match(/(\d+)%/); // Busca un porcentaje en los logs
      if (progressMatch) {
        const progress = parseInt(progressMatch[1]);
        updateProgress(progress);
        DOMElements.loadingMessageTextModal.textContent = `Componiendo... ${progress}%`;
      }
    }

    if (prediction.status === "failed") {
      throw new Error(`La generación de la música falló: ${prediction.error}`);
    }

    const audioUrl = prediction.output;
    if (audioUrl) {
      audioPlayer.src = audioUrl;
      downloadAudioLink.href = audioUrl;
      downloadAudioLink.download = `obelisia-audio-${Date.now()}.mp3`;
      audioPlayerContainer.classList.remove("hidden");
      downloadAudioLink.classList.remove("hidden");
      showCustomMessage("¡Tu música está lista!", "success");

      // 4. Usa un crédito de generación.
      useGenerationCredit();
    } else {
      throw new Error("La API no devolvió una URL de audio válida.");
    }
  } catch (error) {
    console.error("Error en el proceso de generación de audio:", error);
    showCustomMessage(`Error: ${error.message}`, "error", 8000);
  } finally {
    hideLoadingOverlay();
  }
}
