// ia-text/js/audioPlayer.js

import {
  utterance,
  setUtterance,
  availableVoices,
  isPlayingAudio,
  setIsPlayingAudio,
} from "./state.js";
import { DOMElements, showCustomMessage } from "../../js/global.js";

export const playAudio = () => {
  if (
    !DOMElements.generatedTextDiv ||
    !DOMElements.togglePlayPauseButton ||
    !DOMElements.playIcon ||
    !DOMElements.pauseIcon ||
    !DOMElements.voiceSelect ||
    !DOMElements.voiceLanguageSelect
  ) {
    showCustomMessage(
      "Error: Elementos de audio no disponibles.",
      "error",
      3000
    );
    return;
  }

  const textToSpeak = DOMElements.generatedTextDiv.textContent;
  if (!textToSpeak) {
    showCustomMessage("No hay contenido para leer.", "info", 3000);
    return;
  }
  if (!("speechSynthesis" in window)) {
    showCustomMessage(
      "Tu navegador no soporta la función de texto a voz.",
      "error",
      5000
    );
    return;
  }

  stopAudio(); // Detener cualquier reproducción anterior

  const newUtterance = new SpeechSynthesisUtterance(textToSpeak);
  setUtterance(newUtterance); // Actualizar el estado global

  const selectedVoiceName = DOMElements.voiceSelect.value;
  const selectedLangCode = DOMElements.voiceLanguageSelect.value;

  const chosenVoice = availableVoices.find(
    (voice) =>
      voice.name === selectedVoiceName &&
      voice.lang.startsWith(selectedLangCode)
  );

  if (chosenVoice) {
    utterance.voice = chosenVoice;
    utterance.lang = chosenVoice.lang;
  } else if (selectedLangCode) {
    // Fallback: Si no se encuentra la voz específica, intenta con cualquier voz del idioma
    const defaultVoiceForLang = availableVoices.find((voice) =>
      voice.lang.startsWith(selectedLangCode)
    );
    if (defaultVoiceForLang) {
      utterance.voice = defaultVoiceForLang;
      utterance.lang = defaultVoiceForLang.lang;
      console.warn(
        `Voz "${selectedVoiceName}" no encontrada. Usando voz predeterminada para "${selectedLangCode}".`
      );
    } else {
      utterance.lang = selectedLangCode; // Si no hay voces para el idioma, solo establece el idioma
      console.warn(
        `No se encontró una voz para el idioma "${selectedLangCode}". La reproducción puede no funcionar.`
      );
    }
  } else {
    utterance.lang = "es-ES"; // Predeterminado si no hay selección de idioma
    console.warn(
      "No se seleccionó un idioma o voz, usando el predeterminado es-ES."
    );
  }

  utterance.onend = () => {
    setIsPlayingAudio(false);
    DOMElements.playIcon.classList.remove("hidden");
    DOMElements.pauseIcon.classList.add("hidden");
    DOMElements.togglePlayPauseButton.classList.remove("animate-pulse");
  };
  utterance.onerror = (event) => {
    console.error("Error en la reproducción de audio:", event.error);
    if (event.error !== "interrupted") {
      // 'interrupted' es normal cuando se cancela
      showCustomMessage(
        "Error al reproducir el audio. Intenta con otra voz o idioma.",
        "error",
        5000
      );
    }
    setIsPlayingAudio(false);
    DOMElements.playIcon.classList.remove("hidden");
    DOMElements.pauseIcon.classList.add("hidden");
    DOMElements.togglePlayPauseButton.classList.remove("animate-pulse");
  };

  utterance.onstart = () => {
    DOMElements.togglePlayPauseButton.classList.add("animate-pulse");
  };

  try {
    speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
    DOMElements.playIcon.classList.add("hidden");
    DOMElements.pauseIcon.classList.remove("hidden");
  } catch (e) {
    console.error("Error al intentar iniciar la reproducción de audio:", e);
    showCustomMessage(
      "No se pudo iniciar la reproducción de audio. Posiblemente por políticas del navegador.",
      "error",
      5000
    );
    setIsPlayingAudio(false);
    DOMElements.playIcon.classList.remove("hidden");
    DOMElements.pauseIcon.classList.add("hidden");
    DOMElements.togglePlayPauseButton.classList.remove("animate-pulse");
  }
};

export const stopAudio = () => {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
  setIsPlayingAudio(false);
  if (DOMElements.playIcon) DOMElements.playIcon.classList.remove("hidden");
  if (DOMElements.pauseIcon) DOMElements.pauseIcon.classList.add("hidden");
  if (DOMElements.togglePlayPauseButton)
    DOMElements.togglePlayPauseButton.classList.remove("animate-pulse");
};
