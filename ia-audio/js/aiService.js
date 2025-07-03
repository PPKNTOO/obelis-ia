// ia-audio/js/aiService.js

import {
  DOMElements,
  showCustomMessage,
  showLoadingOverlay,
  hideLoadingOverlay,
} from "../../js/global.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function handleGenerateAudio() {
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
  const genre = genreSelect.value;
  const mood = moodSelect.value;
  const duration = durationSlider.value;

  if (!promptText) {
    showCustomMessage(
      "Por favor, describe la música que quieres crear.",
      "error"
    );
    return;
  }

  // Combinamos todo en un prompt más detallado para el modelo
  const finalPrompt = `${promptText}, ${genre} style, ${mood} mood`;

  showLoadingOverlay("Enviando petición a la IA... Por favor, espera.");

  try {
    // --- Inicia la generación de música ---
    const initialResponse = await fetch("/api/music-generator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: finalPrompt,
        duration_seconds: parseInt(duration),
      }),
    });

    let prediction = await initialResponse.json();
    if (initialResponse.status !== 202) {
      throw new Error(`Error al iniciar la generación: ${prediction.detail}`);
    }

    // --- Espera a que la generación termine ---
    showLoadingOverlay(
      "La IA está componiendo tu música... Esto puede tardar uno o dos minutos."
    );

    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed"
    ) {
      await sleep(3000); // Espera 3 segundos entre cada verificación
      const statusResponse = await fetch(`/api/predictions/${prediction.id}`);
      prediction = await statusResponse.json();
    }

    if (prediction.status === "failed") {
      throw new Error(`La generación de la música falló: ${prediction.error}`);
    }

    const audioUrl = prediction.output;

    // --- Muestra el resultado ---
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
    showCustomMessage(`Error: ${error.message}`, "error", 6000);
  } finally {
    hideLoadingOverlay();
  }
}
