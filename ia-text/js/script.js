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
    tone: DOMElements.toneSelect ? DOMElements.toneSelect.value : "",
    voiceLanguage: DOMElements.voiceLanguageSelect
      ? DOMElements.voiceLanguageSelect.value
      : "",
    voiceName: DOMElements.voiceSelect ? DOMElements.voiceSelect.value : "",
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
      if (DOMElements.promptInput) {
        DOMElements.promptInput.placeholder =
          placeholders[preferences.contentType] || placeholders.story;
      }
    }
    if (preferences.tone && DOMElements.toneSelect) {
      DOMElements.toneSelect.value = preferences.tone;
    }
    // No cargar las preferencias de voz aquí directamente,
    // se manejan después de que las voces están disponibles.
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

const updateVoiceOptions = () => {
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
      // Evitar duplicar español
      const option = document.createElement("option");
      option.value = lang;
      option.textContent = lang;
      DOMElements.voiceLanguageSelect.appendChild(option);
    }
  });
  updateSpecificVoices();
};

const updateSpecificVoices = () => {
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
};

// Asegurarse de que las voces se carguen cuando estén disponibles
// Esto es crucial para que el lector de voz funcione.
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = loadVoices;
} else {
  // Fallback si onvoiceschanged no se dispara (raro pero posible)
  // Intentar cargar después de un breve retraso, si el navegador ya cargó las voces.
  setTimeout(loadVoices, 100);
}

// --- Gestión de Estado de Carga (ahora usando el nuevo modal de carga) ---
const showLoadingOverlay = (
  message = "Generando contenido, por favor espera...",
  isError = false
) => {
  // Asegurarse de que los elementos existan antes de manipularlos
  if (
    !DOMElements.loadingOverlayModal ||
    !DOMElements.loadingMessageTextModal ||
    !DOMElements.loadingErrorTextModal ||
    !DOMElements.pocoyoGifModal ||
    !DOMElements.loadingSpinnerModal ||
    !DOMElements.loadingModalCloseButton
  ) {
    console.error(
      "Loading overlay modal elements not found in DOMElements. Falling back to alert."
    );
    // Fallback simple si no se encuentran los elementos del modal
    alert(message);
    return;
  }

  DOMElements.loadingMessageTextModal.textContent = message;
  DOMElements.loadingErrorTextModal.classList.add("hidden"); // Ocultar errores previos

  if (isError) {
    DOMElements.loadingErrorTextModal.textContent = message;
    DOMElements.loadingErrorTextModal.classList.remove("hidden");
    DOMElements.loadingMessageTextModal.textContent = "¡Ha ocurrido un error!"; // Mensaje principal para error
    DOMElements.pocoyoGifModal.classList.add("hidden");
    DOMElements.loadingSpinnerModal.classList.add("hidden"); // Ocultar spinner si es un error
    DOMElements.loadingModalCloseButton.classList.remove("hidden"); // Mostrar botón de cerrar en error
  } else {
    DOMElements.loadingModalCloseButton.classList.add("hidden"); // Ocultar botón si no hay error
    // Decidir si mostrar Pocoyo o spinner
    if (DOMElements.pocoyoGifModal) {
      DOMElements.pocoyoGifModal.classList.remove("hidden");
      DOMElements.loadingSpinnerModal.classList.add("hidden");
      // Asegurarse de que el onError del GIF lo cambie a spinner si falla
      DOMElements.pocoyoGifModal.onerror = () => {
        DOMElements.pocoyoGifModal.classList.add("hidden");
        DOMElements.loadingSpinnerModal.classList.remove("hidden");
        console.warn("Pocoyo GIF failed to load, switching to spinner.");
      };
    } else if (DOMElements.loadingSpinnerModal) {
      // Si no hay Pocoyo, usar spinner
      DOMElements.loadingSpinnerModal.classList.remove("hidden");
    }
  }
  DOMElements.loadingOverlayModal.classList.add("show");
};

const hideLoadingOverlay = () => {
  if (!DOMElements.loadingOverlayModal) return; // Exit if modal not found
  DOMElements.loadingOverlayModal.classList.remove("show");
  // Restablecer mensajes y visibilidad de elementos internos
  if (DOMElements.loadingMessageTextModal)
    DOMElements.loadingMessageTextModal.textContent = "";
  if (DOMElements.loadingErrorTextModal) {
    DOMElements.loadingErrorTextModal.textContent = "";
    DOMElements.loadingErrorTextModal.classList.add("hidden");
  }
  // Resetear estados visuales del spinner/pocoyo para la próxima vez
  if (DOMElements.pocoyoGifModal)
    DOMElements.pocoyoGifModal.classList.remove("hidden");
  if (DOMElements.loadingSpinnerModal)
    DOMElements.loadingSpinnerModal.classList.add("hidden");
  if (DOMElements.loadingModalCloseButton)
    DOMElements.loadingModalCloseButton.classList.add("hidden");
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
    if (DOMElements.generateButton) {
      DOMElements.generateButton.disabled = true;
      DOMElements.generateButton.classList.add(
        "opacity-50",
        "cursor-not-allowed"
      );
    }
    if (adsWatchedToday < MAX_ADS_PER_DAY) {
      if (DOMElements.watchAdButton) {
        DOMElements.watchAdButton.classList.remove("hidden");
        DOMElements.watchAdButton.disabled = false;
        DOMElements.watchAdButton.classList.remove(
          "opacity-50",
          "cursor-not-allowed"
        );
      }
    } else {
      if (DOMElements.watchAdButton) {
        DOMElements.watchAdButton.classList.add("hidden");
      }
      showCustomMessage(
        "Has alcanzado el límite de generaciones gratuitas y de anuncios por hoy. Vuelve mañana para más o considera una suscripción premium.",
        "info",
        7000
      );
    }
  } else {
    if (DOMElements.generateButton) {
      DOMElements.generateButton.disabled = false;
      DOMElements.generateButton.classList.remove(
        "opacity-50",
        "cursor-not-allowed"
      );
    }
    if (DOMElements.watchAdButton) {
      DOMElements.watchAdButton.classList.add("hidden");
    }
  }
};

const simulateAdViewing = () => {
  if (!DOMElements.adModal || !DOMElements.adTimerDisplay) {
    showCustomMessage(
      "Error: Elementos del modal de anuncio no encontrados.",
      "error"
    );
    return;
  }

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

  // Encabezados (h2, h3, etc.) - Asegurarse de que no haya # sobrantes si ya se procesaron
  formattedText = formattedText.replace(/^### (.*$)/gm, "<h3>$1</h3>");
  formattedText = formattedText.replace(/^## (.*$)/gm, "<h2>$1</h2>");
  formattedText = formattedText.replace(/^# (.*$)/gm, "<h2>$1</h2>"); // Tratar # como h2

  // Negritas y cursivas
  formattedText = formattedText.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );
  formattedText = formattedText.replace(/\*(.*?)\*/g, "<em>$1</em>");
  formattedText = formattedText.replace(/__(.*?)__/g, "<strong>$1</strong>");
  formattedText = formattedText.replace(/_(.*?)_/g, "<em>$1</em>");

  // Listas (antes de los párrafos para evitar que <li> se conviertan en <p> dentro)
  // Listas desordenadas
  formattedText = formattedText.replace(/^[*-] (.*)/gm, "<li>$1</li>");
  formattedText = formattedText.replace(
    /(<li>.*<\/li>(\n<li>.*<\/li>)*)/g,
    "<ul>\n$1\n</ul>"
  );

  // Listas ordenadas
  formattedText = formattedText.replace(/^(\d+)\. (.*)/gm, "<li>$2</li>");
  formattedText = formattedText.replace(
    /(<li>.*<\/li>(\n<li>.*<\/li>)*)/g,
    "<ol>\n$1\n</ol>"
  );

  // Párrafos (solo si la línea no es ya un bloque HTML)
  formattedText = formattedText
    .split("\n")
    .map((line) => {
      // Si la línea ya empieza con una etiqueta de bloque (h, ul, ol, li, p, table, div, pre, blockquote, etc.)
      // o está vacía, la devolvemos tal cual.
      if (
        line.trim() === "" ||
        /^<(h[1-6]|ul|ol|li|p|table|div|pre|blockquote|hr|img|form|button)/.test(
          line.trim()
        )
      ) {
        return line;
      }
      return `<p>${line.trim()}</p>`;
    })
    .join("");

  // Eliminar párrafos vacíos
  formattedText = formattedText.replace(/<p>\s*<\/p>/g, "");

  // Eliminar cualquier marcador Markdown que pueda haber quedado
  formattedText = formattedText.replace(/[#*_~`]/g, "");

  // Convertir saltos de línea dobles a párrafos si no están ya en una estructura
  formattedText = formattedText.replace(/\n\n/g, "</p><p>");
  formattedText = formattedText.replace(/\n/g, "<br>"); // Reemplazar saltos de línea simples por <br>

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

  showLoadingOverlay("Generando tu contenido, por favor espera...");
  if (DOMElements.generatedTextDiv) {
    DOMElements.generatedTextDiv.innerHTML = "";
  }
  if (DOMElements.contentModal) {
    DOMElements.contentModal.classList.remove("show"); // Asegurarse de que el modal de contenido esté oculto
  }
  stopAudio(); // Detener cualquier audio en reproducción

  const prompt = DOMElements.promptInput.value.trim();
  const selectedContentType = document.querySelector(
    'input[name="contentType"]:checked'
  ).value;
  const selectedTone = DOMElements.toneSelect.value;

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

    const chatHistory = [{ role: "user", parts: [{ text: aiPrompt }] }];
    const payload = { prompt: aiPrompt, chatHistory: chatHistory };

    const apiUrl = "/api/gemini";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error de la API del proxy: ${response.status} ${
          response.statusText
        }. Respuesta: ${errorText.substring(
          0,
          Math.min(errorText.length, 100)
        )}...`
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
        )}...`
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

// --- Funciones de Reproducción de Audio ---
const playAudio = () => {
  if (
    !DOMElements.generatedTextDiv ||
    !DOMElements.togglePlayPauseButton ||
    !DOMElements.playIcon ||
    !DOMElements.pauseIcon ||
    !DOMElements.voiceSelect ||
    !DOMElements.voiceLanguageSelect
  ) {
    console.warn("Elementos DOM para reproducción de audio no encontrados.");
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

  utterance = new SpeechSynthesisUtterance(textToSpeak);
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
    isPlayingAudio = false;
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
    isPlayingAudio = false;
    DOMElements.playIcon.classList.remove("hidden");
    DOMElements.pauseIcon.classList.add("hidden");
    DOMElements.togglePlayPauseButton.classList.remove("animate-pulse");
  };

  utterance.onstart = () => {
    DOMElements.togglePlayPauseButton.classList.add("animate-pulse");
  };

  try {
    speechSynthesis.speak(utterance);
    isPlayingAudio = true;
    DOMElements.playIcon.classList.add("hidden");
    DOMElements.pauseIcon.classList.remove("hidden");
  } catch (e) {
    console.error("Error al intentar iniciar la reproducción de audio:", e);
    showCustomMessage(
      "No se pudo iniciar la reproducción de audio. Posiblemente por políticas del navegador.",
      "error",
      5000
    );
    isPlayingAudio = false;
    DOMElements.playIcon.classList.remove("hidden");
    DOMElements.pauseIcon.classList.add("hidden");
    DOMElements.togglePlayPauseButton.classList.remove("animate-pulse");
  }
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
    showCustomMessage("No hay contenido para copiar.", "info", 2000);
    return;
  }
  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      showCustomMessage("¡Copiado al portapapeles!", "success", 2000);
    })
    .catch((err) => {
      console.error("Error al intentar copiar al portapapeles:", err);
      showCustomMessage(
        "Error al copiar. Tu navegador podría no soportar esta función o hay restricciones de seguridad.",
        "error",
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
      "La librería de PDF (jspdf) no está cargada. Intenta recargar la página.",
      "error",
      5000
    );
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

// --- Listeners de Eventos y Inicialización ---
document.addEventListener("DOMContentLoaded", () => {
  // Asegúrate de que DOMElements ya está declarado globalmente en global.js
  if (typeof DOMElements === "undefined") {
    console.error(
      "DOMElements no está declarado. Asegúrate de que global.js se cargue primero y declare 'let DOMElements = {};'"
    );
    window.DOMElements = {}; // Declara globalmente para evitar un error fatal en este script
  }

  // Asignar elementos del DOM a DOMElements
  // Es crucial que estos IDs existan en el HTML
  Object.assign(DOMElements, {
    contentForm: document.getElementById("contentForm"),
    promptInput: document.getElementById("prompt"),
    generateButton: document.getElementById("generateButton"),
    buttonText: document.getElementById("buttonText"),
    spinner: document.getElementById("spinner"), // Spinner dentro del botón
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

    contentModal: document.getElementById("contentModal"), // Modal de contenido generado
    modalCloseButton: document.getElementById("modalCloseButton"),
    contentHistoryContainer: document.getElementById("contentHistoryContainer"), // Contenedor del historial
    clearHistoryButton: document.getElementById("clearHistoryButton"), // Botón de limpiar historial
    generationCounterDisplay: document.getElementById(
      "generationCounterDisplay"
    ), // Contador de generaciones
    watchAdButton: document.getElementById("watchAdButton"), // Botón de ver anuncio

    // Elementos del loadingOverlayModal
    loadingOverlayModal: document.getElementById("loadingOverlayModal"),
    pocoyoGifModal: document.getElementById("pocoyoGifModal"),
    loadingSpinnerModal: document.getElementById("loadingSpinnerModal"),
    loadingMessageTextModal: document.getElementById("loadingMessageTextModal"),
    loadingErrorTextModal: document.getElementById("loadingErrorTextModal"),
    loadingModalCloseButton: document.getElementById("loadingModalCloseButton"), // Botón de cerrar del modal de carga

    // adModal específico de ia-text (el que simula el anuncio)
    adModal: document.getElementById("adModal"),
    adTimerDisplay: document.getElementById("adTimer"),

    // copyConfirmationMessage se crea dinámicamente si no existe, o se obtiene
    copyConfirmationMessage:
      document.getElementById("copyConfirmationMessage") ||
      (() => {
        const msg = document.createElement("div");
        msg.id = "copyConfirmationMessage";
        msg.className = "copy-confirmation-message"; // Añadir una clase para estilos si se crea dinámicamente
        msg.textContent = "¡Copiado al portapapeles!";
        document.body.appendChild(msg);
        return msg;
      })(),
  });

  // --- LISTENERS DE EVENTOS ESPECÍFICOS DEL MÓDULO ---
  if (DOMElements.contentTypeOptions) {
    DOMElements.contentTypeOptions.addEventListener("change", (event) => {
      if (event.target.name === "contentType") {
        const selectedType = event.target.value;
        if (DOMElements.promptInput) {
          DOMElements.promptInput.placeholder =
            placeholders[selectedType] || placeholders.story;
        }
        savePreferences();
      }
    });
  }

  if (DOMElements.toneSelect) {
    DOMElements.toneSelect.addEventListener("change", savePreferences);
  }
  if (DOMElements.voiceLanguageSelect) {
    DOMElements.voiceLanguageSelect.addEventListener("change", () => {
      updateSpecificVoices();
      savePreferences();
    });
  }
  if (DOMElements.voiceSelect) {
    DOMElements.voiceSelect.addEventListener("change", savePreferences);
  }

  if (DOMElements.contentForm) {
    DOMElements.contentForm.addEventListener("submit", handleGenerateContent);
  }
  if (DOMElements.togglePlayPauseButton) {
    DOMElements.togglePlayPauseButton.addEventListener("click", () => {
      if (isPlayingAudio) {
        stopAudio();
      } else {
        playAudio();
      }
    });
  }
  if (DOMElements.copyTextButton) {
    DOMElements.copyTextButton.addEventListener("click", copyTextToClipboard);
  }
  if (DOMElements.downloadPdfButton) {
    DOMElements.downloadPdfButton.addEventListener("click", downloadPdf);
  }

  if (DOMElements.modalCloseButton) {
    DOMElements.modalCloseButton.addEventListener("click", () => {
      if (DOMElements.contentModal)
        DOMElements.contentModal.classList.remove("show");
      stopAudio();
    });
  }
  if (DOMElements.contentModal) {
    DOMElements.contentModal.addEventListener("click", (event) => {
      if (event.target === DOMElements.contentModal) {
        DOMElements.contentModal.classList.remove("show");
        stopAudio();
      }
    });
  }

  if (DOMElements.clearHistoryButton) {
    DOMElements.clearHistoryButton.addEventListener(
      "click",
      clearContentHistory
    );
  }
  if (DOMElements.watchAdButton) {
    DOMElements.watchAdButton.addEventListener("click", simulateAdViewing);
  }

  if (DOMElements.loadingModalCloseButton) {
    DOMElements.loadingModalCloseButton.addEventListener(
      "click",
      hideLoadingOverlay
    );
  }
  if (DOMElements.subscriptionModal && DOMElements.noThanksButton) {
    DOMElements.noThanksButton.addEventListener("click", () => {
      DOMElements.subscriptionModal.classList.remove("show");
    });
  }
  if (DOMElements.subscriptionModal) {
    DOMElements.subscriptionModal.addEventListener("click", (event) => {
      if (event.target === DOMElements.subscriptionModal) {
        DOMElements.subscriptionModal.classList.remove("show");
      }
    });
  }

  if (DOMElements.messageModalCloseButton && DOMElements.messageModal) {
    DOMElements.messageModalCloseButton.addEventListener("click", () => {
      DOMElements.messageModal.classList.remove("show");
    });
    DOMElements.messageModal.addEventListener("click", (event) => {
      if (event.target === DOMElements.messageModal) {
        DOMElements.messageModal.classList.remove("show");
      }
    });
  }

  // --- Inicialización Específica del Módulo ---
  loadPreferences();
  renderContentHistory();

  // La carga de voces se gestiona por speechSynthesis.onvoiceschanged
  // o un pequeño retraso si el evento no se dispara.
});
