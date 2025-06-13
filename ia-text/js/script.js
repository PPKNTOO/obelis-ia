// ia-text/js/script.js

// --- Constantes de la Aplicación (específicas de este módulo) ---
const MAX_GENERATIONS_FREE = 5;
const AD_BONUS_GENERATIONS = 3;
const MAX_ADS_PER_DAY = 2;
const AD_VIEW_DURATION_SECONDS = 5;
const MAX_HISTORY_ITEMS = 10;

// --- Variables de Estado Globales (específicas de este módulo) ---
let utterance = null;
let availableVoices = [];
let isPlayingAudio = false;

let generationsToday = 0;
let adsWatchedToday = 0;
let lastActivityDate = "";

const placeholders = {
  story:
    "Ejemplo: Una historia de ciencia ficción sobre un robot que descubre emociones profundas y decide cambiar el mundo.",
  script:
    "Ejemplo: Una escena de un detective interrogando a un sospechoso en un callejón oscuro.",
  poem: "Ejemplo: Un poema lírico sobre la belleza de las estrellas y el universo.",
  song: "Ejemplo: La letra de una canción pop sobre un amor de verano que termina.",
  article:
    "Ejemplo: Un artículo sobre el impacto de la inteligencia artificial en el futuro del trabajo.",
  email:
    "Ejemplo: Un correo electrónico de solicitud de empleo para un puesto de desarrollador web.",
  product_description:
    "Ejemplo: Una descripción para un nuevo smartphone con pantalla plegable y cámara de 100MP.",
  summary: "Ejemplo: Un resumen del libro 'Cien años de soledad'.",
  argumentative_paragraph:
    "Ejemplo: Un párrafo que argumenta a favor de la educación en línea para todos los niveles.",
  recipe: "Ejemplo: Una receta para preparar lasaña vegetariana casera.",
  ai_prompt:
    "Ejemplo: Quiero un prompt para generar imágenes de 'un bosque encantado al atardecer' en estilo 'realismo mágico'.",
};

const contentTypeIcons = {
  story: "fas fa-book",
  script: "fas fa-film",
  poem: "fas fa-feather-alt",
  song: "fas fa-music",
  article: "fas fa-newspaper",
  email: "fas fa-envelope",
  product_description: "fas fa-box-open",
  summary: "fas fa-file-alt",
  argumentative_paragraph: "fas fa-lightbulb",
  recipe: "fas fa-utensils",
  ai_prompt: "fas fa-brain",
};

// --- Almacenamiento y Carga de Preferencias y Estado ---
const savePreferences = () => {
  const preferences = {
    contentType:
      document.querySelector('input[name="contentType"]:checked')?.value ||
      "story",
    tone: DOMElements.toneSelect.value,
    voiceLanguage: DOMElements.voiceLanguageSelect.value,
    voiceName: DOMElements.voiceSelect.value,
  };
  localStorage.setItem("userPreferences", JSON.stringify(preferences));
  localStorage.setItem("generationsToday", generationsToday);
  localStorage.setItem("adsWatchedToday", adsWatchedToday);
  localStorage.setItem("lastActivityDate", new Date().toDateString());
};

const loadPreferences = () => {
  const preferences = JSON.parse(localStorage.getItem("userPreferences"));
  if (preferences) {
    const contentTypeRadio = document.querySelector(
      `input[name="contentType"][value="${preferences.contentType}"]`
    );
    if (contentTypeRadio) {
      contentTypeRadio.checked = true;
      DOMElements.promptInput.placeholder =
        placeholders[preferences.contentType] || placeholders.story;
    }
    if (preferences.tone) {
      DOMElements.toneSelect.value = preferences.tone;
    }
    setTimeout(() => {
      if (preferences.voiceLanguage && DOMElements.voiceLanguageSelect) {
        DOMElements.voiceLanguageSelect.value = preferences.voiceLanguage;
        updateSpecificVoices();
      }
      if (preferences.voiceName && DOMElements.voiceSelect) {
        DOMElements.voiceSelect.value = preferences.voiceName;
      }
    }, 500);
  }

  const storedGenerationsToday = localStorage.getItem("generationsToday");
  const storedAdsWatchedToday = localStorage.getItem("adsWatchedToday");
  const storedLastActivityDate = localStorage.getItem("lastActivityDate");
  const today = new Date().toDateString();

  if (storedLastActivityDate !== today) {
    generationsToday = 0;
    adsWatchedToday = 0;
    localStorage.setItem("lastActivityDate", today);
    localStorage.setItem("generationsToday", "0");
    localStorage.setItem("adsWatchedToday", "0");
  } else {
    generationsToday = parseInt(storedGenerationsToday || "0", 10);
    adsWatchedToday = parseInt(storedAdsWatchedToday || "0", 10);
  }
  updateGenerationCounterDisplay();
  checkGenerationLimit();
};

// --- Carga y Gestión de Voces ---
const loadVoices = () => {
  availableVoices = speechSynthesis.getVoices();
  updateVoiceOptions();
  loadPreferences();
};

const updateVoiceOptions = () => {
  const languages = new Set();
  if (!DOMElements.voiceLanguageSelect || !DOMElements.voiceSelect) return;

  DOMElements.voiceLanguageSelect.innerHTML = "";
  DOMElements.voiceSelect.innerHTML = "";

  availableVoices.forEach((voice) => {
    const langCode = voice.lang.split("-")[0];
    languages.add(langCode);
  });

  const sortedLanguages = Array.from(languages).sort();

  if (sortedLanguages.includes("es")) {
    const esOption = document.createElement("option");
    esOption.value = "es";
    esOption.textContent = "Español (es)";
    DOMElements.voiceLanguageSelect.appendChild(esOption);
    DOMElements.voiceLanguageSelect.value = "es";
  } else {
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Seleccionar idioma";
    DOMElements.voiceLanguageSelect.appendChild(defaultOption);
  }

  sortedLanguages.forEach((lang) => {
    if (lang !== "es") {
      const option = document.createElement("option");
      option.value = lang;
      option.textContent = lang;
      DOMElements.voiceLanguageSelect.appendChild(option);
    }
  });
  updateSpecificVoices();
};

const updateSpecificVoices = () => {
  if (!DOMElements.voiceSelect || !DOMElements.voiceLanguageSelect) return;

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
};

if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = loadVoices;
} else {
  loadVoices();
}

// --- Gestión de Estado de Carga ---
const setLoadingState = (isLoading) => {
  DOMElements.generateButton.disabled = isLoading;
  if (isLoading) {
    DOMElements.spinner.classList.remove("hidden");
    DOMElements.buttonText.textContent = "Generando...";
  } else {
    DOMElements.spinner.classList.add("hidden");
    DOMElements.buttonText.textContent = "Generar Contenido";
  }
  checkGenerationLimit();
};

// --- Lógica del Límite de Generaciones ---
const updateGenerationCounterDisplay = () => {
  if (!DOMElements.generationCounterDisplay) return;
  const totalAllowed =
    MAX_GENERATIONS_FREE + adsWatchedToday * AD_BONUS_GENERATIONS;
  DOMElements.generationCounterDisplay.textContent = `Generaciones disponibles hoy: ${Math.max(
    0,
    totalAllowed - generationsToday
  )}/${totalAllowed}`;
};

const checkGenerationLimit = () => {
  const totalAllowed =
    MAX_GENERATIONS_FREE + adsWatchedToday * AD_BONUS_GENERATIONS;
  if (generationsToday >= totalAllowed) {
    DOMElements.generateButton.disabled = true;
    DOMElements.generateButton.classList.add(
      "opacity-50",
      "cursor-not-allowed"
    );
    if (adsWatchedToday < MAX_ADS_PER_DAY) {
      DOMElements.watchAdButton.classList.remove("hidden");
      DOMElements.watchAdButton.disabled = false;
      DOMElements.watchAdButton.classList.remove(
        "opacity-50",
        "cursor-not-allowed"
      );
    } else {
      DOMElements.watchAdButton.classList.add("hidden");
      showCustomMessage(
        "Has alcanzado el límite de generaciones gratuitas y de anuncios por hoy. Vuelve mañana para más o considera una suscripción premium.",
        "info",
        7000
      );
    }
  } else {
    DOMElements.generateButton.disabled = false;
    DOMElements.generateButton.classList.remove(
      "opacity-50",
      "cursor-not-allowed"
    );
    DOMElements.watchAdButton.classList.add("hidden");
  }
};

const simulateAdViewing = () => {
  if (!DOMElements.adModal || !DOMElements.adTimerDisplay) return;

  DOMElements.adModal.classList.add("show");
  let timer = AD_VIEW_DURATION_SECONDS;
  DOMElements.adTimerDisplay.textContent = `Tiempo restante: ${timer} segundos`;
  const adInterval = setInterval(() => {
    timer--;
    DOMElements.adTimerDisplay.textContent = `Tiempo restante: ${timer} segundos`;
    if (timer <= 0) {
      clearInterval(adInterval);
      DOMElements.adModal.classList.remove("show");
      adsWatchedToday++;
      generationsToday = Math.max(0, generationsToday - AD_BONUS_GENERATIONS);
      savePreferences();
      updateGenerationCounterDisplay();
      checkGenerationLimit();
      showCustomMessage(
        "¡Gracias por ver el anuncio! Has recibido +3 generaciones.",
        "success",
        3000
      );
    }
  }, 1000);
};

// --- Formateo Markdown a HTML ---
const formatGeneratedText = (rawText) => {
  let formattedText = rawText;

  formattedText = formattedText.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );
  formattedText = formattedText.replace(/\*(.*?)\*/g, "<em>$1</em>");
  formattedText = formattedText.replace(/__(.*?)__/g, "<strong>$1</strong>");
  formattedText = formattedText.replace(/_(.*?)_/g, "<em>$1</em>");

  formattedText = formattedText.replace(/^### (.*$)/gm, "<h3>$1</h3>");
  formattedText = formattedText.replace(/^## (.*$)/gm, "<h2>$1</h2>");
  formattedText = formattedText.replace(/^# (.*$)/gm, "<h2>$1</h2>");

  formattedText = formattedText.replace(/^(- .*(\n- .*)*)/gm, (match) => {
    let listHtml = "<ul>";
    match.split("\n").forEach((line) => {
      if (line.startsWith("- ")) {
        listHtml += "<li>" + line.substring(2).trim() + "</li>";
      }
    });
    listHtml += "</ul>";
    return listHtml;
  });

  formattedText = formattedText.replace(
    /^(\d+\. .*(\n\d+\. .*)*)/gm,
    (match) => {
      let listHtml = "<ol>";
      match.split("\n").forEach((line) => {
        if (line.match(/^\d+\. /)) {
          listHtml +=
            "<li>" + line.substring(line.indexOf(".") + 1).trim() + "</li>";
        }
      });
      listHtml += "</ol>";
      return listHtml;
    }
  );

  formattedText = formattedText
    .split("\n")
    .map((line) => {
      if (
        line.trim() === "" ||
        line.startsWith("<h") ||
        line.startsWith("<ul") ||
        line.startsWith("<ol")
      ) {
        return line;
      }
      return "<p>" + line.trim() + "</p>";
    })
    .join("");

  formattedText = formattedText.replace(/<p>\s*<\/p>/g, "");

  formattedText = formattedText.replace(/#/g, "");
  formattedText = formattedText.replace(/\*/g, "");
  formattedText = formattedText.replace(/_/g, "");

  return formattedText;
};

// --- Lógica Principal de Generación de Contenido ---
const handleGenerateContent = async (event) => {
  event.preventDefault();

  const totalAllowed =
    MAX_GENERATIONS_FREE + adsWatchedToday * AD_BONUS_GENERATIONS;
  if (generationsToday >= totalAllowed) {
    checkGenerationLimit();
    return;
  }

  setLoadingState(true);
  DOMElements.generatedTextDiv.innerHTML = "";
  DOMElements.contentModal.classList.remove("show");
  stopAudio();

  const prompt = DOMElements.promptInput.value.trim();
  const selectedContentType = document.querySelector(
    'input[name="contentType"]:checked'
  ).value;
  const selectedTone = DOMElements.toneSelect.value;

  if (!prompt) {
    showCustomMessage(
      "Por favor, introduce una descripción para generar el contenido.",
      "error",
      3000
    );
    setLoadingState(false);
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

    const chatHistory = [{ role: "user", parts: [{ text: aiPrompt }] }];
    const payload = { prompt: prompt, chatHistory: chatHistory };

    const apiUrl = "/api/gemini";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      showCustomMessage(
        `Error de la API del proxy: ${response.status} ${
          response.statusText
        }. Respuesta: ${errorText.substring(
          0,
          Math.min(errorText.length, 100)
        )}...`,
        "error",
        5000
      );
      console.error(
        "API proxy response not OK:",
        response.status,
        response.statusText,
        errorText
      );
      setLoadingState(false);
      return;
    }

    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      const rawResponseText = await response.text();
      showCustomMessage(
        "Error al procesar la respuesta de la IA (JSON inválido del proxy). Por favor, inténtalo de nuevo.",
        "error",
        5000
      );
      console.error("JSON parsing error:", jsonError);
      console.error("Raw API proxy response:", rawResponseText);
      setLoadingState(false);
      return;
    }

    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content &&
      result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0
    ) {
      const rawText = result.candidates[0].content.parts[0].text;
      DOMElements.generatedTextDiv.innerHTML = formatGeneratedText(rawText);
      DOMElements.contentModal.classList.add("show");
      playAudio();
      saveGeneratedContentToHistory(
        prompt,
        selectedContentType,
        rawText,
        selectedTone
      );
      generationsToday++;
      savePreferences();
      updateGenerationCounterDisplay();
      checkGenerationLimit();
    } else {
      showCustomMessage(
        "No se pudo generar el contenido. La IA no proporcionó una respuesta válida a través del proxy. Por favor, inténtalo de nuevo con una descripción diferente.",
        "error",
        5000
      );
      console.error("Unexpected API proxy response structure:", result);
    }
  } catch (err) {
    showCustomMessage(
      "Error al conectar con la API del proxy. Por favor, comprueba tu conexión a internet.",
      "error",
      5000
    );
    console.error("API proxy call error:", err);
  } finally {
    setLoadingState(false);
  }
};

// --- Funciones de Reproducción de Audio ---
const playAudio = () => {
  if (!DOMElements.generatedTextDiv) return;
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
  stopAudio();

  utterance = new SpeechSynthesisUtterance(textToSpeak);
  const selectedVoiceName = DOMElements.voiceSelect.value;
  const selectedLangCode = DOMElements.voiceLanguageSelect.value;

  const chosenVoice = availableVoices.find(
    (voice) => voice.name === selectedVoiceName
  );
  if (chosenVoice) {
    utterance.voice = chosenVoice;
    utterance.lang = chosenVoice.lang;
  } else if (selectedLangCode) {
    const defaultVoiceForLang = availableVoices.find((voice) =>
      voice.lang.startsWith(selectedLangCode)
    );
    if (defaultVoiceForLang) {
      utterance.voice = defaultVoiceForLang;
      utterance.lang = defaultVoiceForLang.lang;
    } else {
      utterance.lang = selectedLangCode;
      console.warn(
        `No se encontró una voz predeterminada para el idioma "${selectedLangCode}".`
      );
    }
  } else {
    utterance.lang = "es-ES";
    console.warn(
      "No se seleccionó un idioma o voz, usando el predeterminado es-ES."
    );
  }

  utterance.onend = () => {
    isPlayingAudio = false;
    if (DOMElements.playIcon) DOMElements.playIcon.classList.remove("hidden");
    if (DOMElements.pauseIcon) DOMElements.pauseIcon.classList.add("hidden");
    if (DOMElements.togglePlayPauseButton)
      DOMElements.togglePlayPauseButton.classList.remove("animate-pulse");
  };
  utterance.onerror = (event) => {
    console.error("Error en la reproducción de audio:", event.error);
    if (event.error !== "interrupted") {
      showCustomMessage(
        "Error al reproducir el audio. Intenta con otra voz o idioma.",
        "error",
        5000
      );
    }
    isPlayingAudio = false;
    if (DOMElements.playIcon) DOMElements.playIcon.classList.remove("hidden");
    if (DOMElements.pauseIcon) DOMElements.pauseIcon.classList.add("hidden");
    if (DOMElements.togglePlayPauseButton)
      DOMElements.togglePlayPauseButton.classList.remove("animate-pulse");
  };

  utterance.onstart = () => {
    if (DOMElements.togglePlayPauseButton)
      DOMElements.togglePlayPauseButton.classList.add("animate-pulse");
  };

  speechSynthesis.speak(utterance);
  isPlayingAudio = true;
  if (DOMElements.playIcon) DOMElements.playIcon.classList.add("hidden");
  if (DOMElements.pauseIcon) DOMElements.pauseIcon.classList.remove("hidden");
};

const stopAudio = () => {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
  isPlayingAudio = false;
  if (DOMElements.playIcon) DOMElements.playIcon.classList.remove("hidden");
  if (DOMElements.pauseIcon) DOMElements.pauseIcon.classList.add("hidden");
  if (DOMElements.togglePlayPauseButton)
    DOMElements.togglePlayPauseButton.classList.remove("animate-pulse");
};

// --- Funciones de Portapapeles y Descarga ---
const copyTextToClipboard = () => {
  if (!DOMElements.generatedTextDiv || !DOMElements.copyConfirmationMessage)
    return;
  const textToCopy = DOMElements.generatedTextDiv.textContent;
  if (!textToCopy) {
    DOMElements.copyConfirmationMessage.textContent =
      "No hay contenido para copiar.";
    DOMElements.copyConfirmationMessage.classList.add("show");
    setTimeout(
      () => DOMElements.copyConfirmationMessage.classList.remove("show"),
      2000
    );
    return;
  }
  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      DOMElements.copyConfirmationMessage.textContent =
        "¡Copiado al portapapeles!";
      DOMElements.copyConfirmationMessage.classList.add("show");
      setTimeout(
        () => DOMElements.copyConfirmationMessage.classList.remove("show"),
        2000
      );
    })
    .catch((err) => {
      console.error("Error al intentar copiar al portapapeles:", err);
      DOMElements.copyConfirmationMessage.textContent =
        "Error al copiar. Tu navegador podría no soportar esta función o hay restricciones de seguridad.";
      DOMElements.copyConfirmationMessage.classList.add("show");
      setTimeout(
        () => DOMElements.copyConfirmationMessage.classList.remove("show"),
        3000
      );
    });
};

const downloadPdf = () => {
  if (!DOMElements.generatedTextDiv) return;
  const text = DOMElements.generatedTextDiv.textContent;
  if (!text) {
    showCustomMessage(
      "No hay contenido para descargar como PDF.",
      "info",
      3000
    );
    return;
  }
  if (typeof window.jspdf === "undefined") {
    showCustomMessage(
      "La librería de PDF no está cargada. Intenta recargar la página.",
      "error",
      5000
    );
    console.error("jsPDF library not loaded.");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const margin = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const lineHeight = 7;
  let y = margin;

  const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);

  for (let i = 0; i < lines.length; i++) {
    if (y + lineHeight > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(lines[i], margin, y);
    y += lineHeight;
  }

  doc.save("contenido_generado.pdf");
};

// --- Funciones del Historial de Contenido ---
const saveGeneratedContentToHistory = (prompt, type, text, tone) => {
  let history =
    JSON.parse(localStorage.getItem("generatedContentHistory")) || [];
  const timestamp = new Date().toLocaleString();
  const newItem = { prompt, type, text, tone, timestamp };

  history.unshift(newItem);
  if (history.length > MAX_HISTORY_ITEMS) {
    history = history.slice(0, MAX_HISTORY_ITEMS);
  }
  localStorage.setItem("generatedContentHistory", JSON.stringify(history));
  renderContentHistory();
};

const loadContentHistory = () => {
  return JSON.parse(localStorage.getItem("generatedContentHistory")) || [];
};

const renderContentHistory = () => {
  const history = loadContentHistory();
  if (!DOMElements.contentHistoryContainer || !DOMElements.clearHistoryButton)
    return;

  DOMElements.contentHistoryContainer.innerHTML = "";

  if (history.length === 0) {
    DOMElements.contentHistoryContainer.innerHTML =
      '<p class="text-gray-500 text-center">No hay contenido en el historial.</p>';
    DOMElements.clearHistoryButton.classList.add(
      "opacity-50",
      "cursor-not-allowed"
    );
    DOMElements.clearHistoryButton.disabled = true;
    return;
  }

  history.forEach((item, index) => {
    const historyItemDiv = document.createElement("div");
    historyItemDiv.classList.add("history-item");

    const iconClass = contentTypeIcons[item.type] || "fas fa-file-alt";
    const iconSpan = `<i class="${iconClass} text-cyan-400 mr-2"></i>`;

    const truncatedPrompt =
      item.prompt.substring(0, 50) + (item.prompt.length > 50 ? "..." : "");
    const itemText = document.createElement("span");
    itemText.classList.add("history-item-text");
    itemText.innerHTML = `${iconSpan} ${
      item.type.charAt(0).toUpperCase() + item.type.slice(1)
    }: "${truncatedPrompt}"`;
    itemText.title = `Generado el ${item.timestamp}\nTipo: ${
      item.type
    }\nDescripción: ${item.prompt}\nTono: ${
      item.tone || "Neutro"
    }\n\nHaz clic para ver el contenido.`;

    const regenerateButton = document.createElement("button");
    regenerateButton.classList.add(
      "bg-gray-700",
      "hover:bg-gray-600",
      "text-white",
      "p-1",
      "rounded-full",
      "transition-colors",
      "duration-200",
      "shadow-sm",
      "ml-2"
    );
    regenerateButton.innerHTML = '<i class="fas fa-sync-alt text-sm"></i>';
    regenerateButton.title = "Cargar y Regenerar";
    regenerateButton.addEventListener("click", (e) => {
      e.stopPropagation();
      DOMElements.promptInput.value = item.prompt;
      const radio = document.querySelector(
        `input[name="contentType"][value="${item.type}"]`
      );
      if (radio) {
        radio.checked = true;
        DOMElements.promptInput.placeholder =
          placeholders[item.type] || placeholders.story;
      }
      DOMElements.toneSelect.value = item.tone || "";
      showCustomMessage(
        "Prompt e historial cargados para regenerar.",
        "info",
        2000
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    historyItemDiv.appendChild(itemText);
    historyItemDiv.appendChild(regenerateButton);

    DOMElements.contentHistoryContainer.appendChild(historyItemDiv);

    itemText.addEventListener("click", () => {
      DOMElements.generatedTextDiv.innerHTML = formatGeneratedText(item.text);
      DOMElements.contentModal.classList.add("show");
      stopAudio();
    });
  });
  DOMElements.clearHistoryButton.classList.remove(
    "opacity-50",
    "cursor-not-allowed"
  );
  DOMElements.clearHistoryButton.disabled = false;
};

const clearContentHistory = () => {
  localStorage.removeItem("generatedContentHistory");
  renderContentHistory();
  showCustomMessage("Historial de contenido limpiado.", "success", 2000);
};

// --- Lógica de Consentimiento de Cookies (ELIMINADAS - AHORA EN GLOBAL.JS) ---
// showCookieConsent ya no está aquí
// acceptCookies ya no está aquí

// --- Lógica del Modal de Suscripción (ELIMINADAS - AHORA EN GLOBAL.JS) ---
// showSubscriptionModal ya no está aquí
// handleSubscription ya no está aquí
// dismissSubscription ya no está aquí

// --- Listeners de Eventos ---
document.addEventListener("DOMContentLoaded", () => {
  // Fusiona los elementos específicos de este módulo en el objeto DOMElements global existente.
  Object.assign(DOMElements, {
    contentForm: document.getElementById("contentForm"),
    promptInput: document.getElementById("prompt"),
    generateButton: document.getElementById("generateButton"),
    buttonText: document.getElementById("buttonText"),
    spinner: document.getElementById("spinner"),
    generatedTextDiv: document.getElementById("generatedText"),
    togglePlayPauseButton: document.getElementById("togglePlayPauseButton"),
    playIcon: document.getElementById("playIcon"),
    pauseIcon: document.getElementById("pauseIcon"),
    voiceLanguageSelect: document.getElementById("voiceLanguage"),
    voiceSelect: document.getElementById("voiceSelect"),
    downloadPdfButton: document.getElementById("downloadPdfButton"),
    contentTypeOptions: document.getElementById("contentTypeOptions"),
    copyTextButton: document.getElementById("copyTextButton"),
    toneSelect: document.getElementById("toneSelect"),

    contentModal: document.getElementById("contentModal"),
    modalCloseButton: document.getElementById("modalCloseButton"),
    contentHistoryContainer: document.getElementById("contentHistoryContainer"),
    clearHistoryButton: document.getElementById("clearHistoryButton"),
    generationCounterDisplay: document.getElementById(
      "generationCounterDisplay"
    ),
    watchAdButton: document.getElementById("watchAdButton"),
    adModal: document.getElementById("adModal"),
    adTimerDisplay: document.getElementById("adTimer"),
  });

  // Crea y añade copyConfirmationMessage al body dentro de initApp, si no existe
  if (!document.getElementById("copyConfirmationMessage")) {
    const copyConfirmationMessage = document.createElement("div");
    copyConfirmationMessage.id = "copyConfirmationMessage";
    copyConfirmationMessage.textContent = "¡Copiado al portapapeles!";
    document.body.appendChild(copyConfirmationMessage);
    DOMElements.copyConfirmationMessage = copyConfirmationMessage;
  } else {
    DOMElements.copyConfirmationMessage = document.getElementById(
      "copyConfirmationMessage"
    );
  }

  // --- LISTENERS DE EVENTOS ESPECÍFICOS DEL MÓDULO ---
  DOMElements.contentTypeOptions.addEventListener("change", (event) => {
    if (event.target.name === "contentType") {
      const selectedType = event.target.value;
      DOMElements.promptInput.placeholder =
        placeholders[selectedType] || placeholders.story;
      savePreferences();
    }
  });

  DOMElements.toneSelect.addEventListener("change", savePreferences);
  DOMElements.voiceLanguageSelect.addEventListener("change", () => {
    updateSpecificVoices();
    savePreferences();
  });
  DOMElements.voiceSelect.addEventListener("change", savePreferences);

  DOMElements.contentForm.addEventListener("submit", handleGenerateContent);
  DOMElements.togglePlayPauseButton.addEventListener("click", () => {
    if (isPlayingAudio) {
      stopAudio();
    } else {
      playAudio();
    }
  });
  DOMElements.copyTextButton.addEventListener("click", copyTextToClipboard);
  DOMElements.downloadPdfButton.addEventListener("click", downloadPdf);

  DOMElements.modalCloseButton.addEventListener("click", () => {
    DOMElements.contentModal.classList.remove("show");
    stopAudio();
  });
  DOMElements.contentModal.addEventListener("click", (event) => {
    if (event.target === DOMElements.contentModal) {
      DOMElements.contentModal.classList.remove("show");
      stopAudio();
    }
  });

  DOMElements.clearHistoryButton.addEventListener("click", clearContentHistory);
  DOMElements.watchAdButton.addEventListener("click", simulateAdViewing);

  // --- Inicialización Específica del Módulo ---
  loadPreferences();
  renderContentHistory();

  if (speechSynthesis.onvoiceschanged === undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  } else {
    loadVoices();
  }
});
