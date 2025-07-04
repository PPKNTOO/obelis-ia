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
 * Llama a la IA de Gemini para mejorar el prompt del usuario de forma estricta.
 */
export async function handleImprovePrompt() {
  const prompt = DOMElements.promptAudio.value.trim();
  if (!prompt) {
    showCustomMessage("Escribe algo en el prompt para mejorarlo.", "error");
    return;
  }

  showLoadingOverlay("Mejorando prompt con IA...");
  try {
    const strictPrompt = `Reescribe y expande el siguiente prompt para una canción de IA para que sea detallado, evocador y con un mínimo de 100 caracteres. Devuelve ÚNICAMENTE el texto del prompt mejorado, sin saludos, explicaciones, comillas ni ningún otro texto introductorio. Prompt original: "${prompt}"`;

    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: strictPrompt }] }],
      }),
    });

    if (!response.ok) {
      throw new Error("La IA no pudo mejorar el prompt en este momento.");
    }

    const result = await response.json();
    const newPrompt = result.candidates[0]?.content?.parts[0]?.text;

    if (newPrompt) {
      DOMElements.promptAudio.value = newPrompt.trim();
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
 * Maneja la lógica completa de generación de audio.
 */
export async function handleGenerateAudio() {
  const canGenerate = await checkAdRequirement();
  if (!canGenerate) {
    return; // Si el usuario no vio el anuncio, la función se detiene.
  }

  // ✅ Usa el "permiso" de generación INMEDIATAMENTE al iniciar el proceso.
  useGenerationCredit();

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
    // El crédito ya se gastó, no se devuelve por errores de usuario.
    return;
  }

  const finalPrompt = `${promptText}, ${genreSelect.value} style, ${moodSelect.value} mood`;
  showLoadingOverlay("Iniciando generación...", true);
  updateProgress(5);

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

    showLoadingOverlay("La IA está componiendo...", true);
    updateProgress(15);

    let progress = 15;
    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed"
    ) {
      await sleep(3000); // Espera 3 segundos entre verificaciones
      const statusResponse = await fetch(
        `/api/get-prediction?id=${prediction.id}`
      );
      prediction = await statusResponse.json();

      if (progress < 95) {
        progress += Math.random() * 5 + 2;
        updateProgress(Math.min(95, progress));
      }
    }

    if (prediction.status === "failed") {
      throw new Error(`La generación de la música falló: ${prediction.error}`);
    }

    updateProgress(100);

    const audioUrl = prediction.output;
    if (audioUrl) {
      audioPlayer.src = audioUrl;
      downloadAudioLink.href = audioUrl;
      downloadAudioLink.download = `obelisia-audio-${Date.now()}.mp3`;
      audioPlayerContainer.classList.remove("hidden");
      downloadAudioLink.classList.remove("hidden");
      showCustomMessage("¡Tu música está lista!", "success");
    } else {
      throw new Error("La API no devolvió una URL de audio válida.");
    }
  } catch (error) {
    console.error("Error en el proceso de generación de audio:", error);
    showCustomMessage(`Error: ${error.message}`, "error", 8000);
    // El crédito ya fue utilizado, por lo que para reintentar se necesita otro anuncio.
  } finally {
    setTimeout(hideLoadingOverlay, 500);
  }
}
