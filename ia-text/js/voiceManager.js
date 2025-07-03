// ia-text/js/voiceManager.js

import { availableVoices, setAvailableVoices } from "./state.js";
import { DOMElements } from "../../js/global.js";
import { savePreferences } from "./storage.js";

export const loadVoices = () => {
  const voices = speechSynthesis.getVoices();
  setAvailableVoices(voices);
  updateVoiceOptions();

  // Una vez que las voces están cargadas, aplicar la preferencia de voz guardada.
  const preferences = JSON.parse(localStorage.getItem("userPreferences"));
  if (
    preferences &&
    DOMElements.voiceLanguageSelect &&
    DOMElements.voiceSelect
  ) {
    if (preferences.voiceLanguage) {
      DOMElements.voiceLanguageSelect.value = preferences.voiceLanguage;
      updateSpecificVoices(); // Vuelve a llamar para cargar las voces específicas del idioma
    }
    if (preferences.voiceName) {
      DOMElements.voiceSelect.value = preferences.voiceName;
    }
  }
};

export const updateVoiceOptions = () => {
  const languages = new Set();
  if (!DOMElements.voiceLanguageSelect || !DOMElements.voiceSelect) {
    console.warn(
      "Elementos de selección de voz no encontrados. Omitiendo actualización de opciones de voz."
    );
    return;
  }

  DOMElements.voiceLanguageSelect.innerHTML = "";
  DOMElements.voiceSelect.innerHTML = "";

  availableVoices.forEach((voice) => {
    const langCode = voice.lang.split("-")[0];
    languages.add(langCode);
  });

  const sortedLanguages = Array.from(languages).sort();

  // Priorizar español
  if (sortedLanguages.includes("es")) {
    const esOption = document.createElement("option");
    esOption.value = "es";
    esOption.textContent = "Español (es)";
    DOMElements.voiceLanguageSelect.appendChild(esOption);
    // Establecer español como valor predeterminado si está disponible
    DOMElements.voiceLanguageSelect.value = "es";
  } else {
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Seleccionar idioma";
    DOMElements.voiceLanguageSelect.appendChild(defaultOption);
  }

  // Añadir otros idiomas
  sortedLanguages.forEach((lang) => {
    if (lang !== "es") {
      const option = document.createElement("option");
      option.value = lang;
      option.textContent = lang;
      DOMElements.voiceLanguageSelect.appendChild(option);
    }
  });
  updateSpecificVoices(); // Llama para poblar las voces para el idioma inicialmente seleccionado
};

export const updateSpecificVoices = () => {
  if (!DOMElements.voiceSelect || !DOMElements.voiceLanguageSelect) {
    console.warn(
      "Elementos de selección de voz no encontrados. Omitiendo actualización de voces específicas."
    );
    return;
  }

  DOMElements.voiceSelect.innerHTML = "";
  const selectedLangCode = DOMElements.voiceLanguageSelect.value;

  if (!selectedLangCode) {
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Seleccionar voz";
    DOMElements.voiceSelect.appendChild(defaultOption);
    return;
  }

  const filteredVoices = availableVoices
    .filter((voice) => voice.lang.startsWith(selectedLangCode))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (filteredVoices.length === 0) {
    const noVoiceOption = document.createElement("option");
    noVoiceOption.value = "";
    noVoiceOption.textContent = "No hay voces disponibles para este idioma";
    DOMElements.voiceSelect.appendChild(noVoiceOption);
  } else {
    filteredVoices.forEach((voice) => {
      const option = document.createElement("option");
      option.value = voice.name;
      option.textContent = `${voice.name} (${voice.lang})`;
      DOMElements.voiceSelect.appendChild(option);
    });
  }
  savePreferences(); // Guardar la voz seleccionada al cambiar el idioma o la voz
};

// Asegurarse de que las voces se carguen cuando estén disponibles
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = loadVoices;
} else {
  // Fallback si onvoiceschanged no se dispara (raro pero posible)
  setTimeout(loadVoices, 100);
}
