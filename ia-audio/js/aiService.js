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

  const finalPrompt = `${promptText}, ${genre} style, ${mood} mood`;
  showLoadingOverlay("Enviando petición a la IA...");

  try {
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
      throw new Error(prediction.detail || "Error al iniciar la generación.");
    }

    showLoadingOverlay(
      "La IA está componiendo... Esto puede tardar hasta 2 minutos."
    );

    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed"
    ) {
      await sleep(4000); // Aumentamos la espera a 4 segundos

      // ✅ CORRECCIÓN CLAVE AQUÍ:
      // Llamamos a la nueva ruta y pasamos el ID como un parámetro de búsqueda.
      const statusResponse = await fetch(
        `/api/get-prediction?id=${prediction.id}`
      );
      prediction = await statusResponse.json();
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
