document.addEventListener("DOMContentLoaded", () => {
  const contentForm = document.getElementById("contentForm");
  const promptInput = document.getElementById("prompt");
  const generateButton = document.getElementById("generateButton");
  const buttonText = document.getElementById("buttonText");
  const spinner = document.getElementById("spinner");
  const errorMessageDiv = document.getElementById("errorMessage"); // Keep this for now for specific API errors only
  const generatedTextDiv = document.getElementById("generatedText");
  const togglePlayPauseButton = document.getElementById(
    "togglePlayPauseButton"
  );
  const playIcon = document.getElementById("playIcon");
  const pauseIcon = document.getElementById("pauseIcon");
  const voiceLanguageSelect = document.getElementById("voiceLanguage");
  const voiceSelect = document.getElementById("voiceSelect");
  const downloadPdfButton = document.getElementById("downloadPdfButton");
  const downloadCsvButton = document.getElementById("downloadCsvButton");
  const contentTypeOptions = document.getElementById("contentTypeOptions");
  const copyTextButton = document.getElementById("copyTextButton");
  const toneSelect = document.getElementById("toneSelect");

  const contentModal = document.getElementById("contentModal");
  const modalCloseButton = document.getElementById("modalCloseButton");
  const contentHistoryContainer = document.getElementById(
    "contentHistoryContainer"
  );
  const clearHistoryButton = document.getElementById("clearHistoryButton");
  const copyConfirmationMessage = document.createElement("div");
  copyConfirmationMessage.id = "copyConfirmationMessage";
  copyConfirmationMessage.textContent = "¡Copiado al portapapeles!";
  document.body.appendChild(copyConfirmationMessage);

  const generationCounterDisplay = document.getElementById(
    "generationCounterDisplay"
  );
  const watchAdButton = document.getElementById("watchAdButton");
  const adModal = document.getElementById("adModal");
  const adTimerDisplay = document.getElementById("adTimer");

  // From index.html
  const cookieConsent = document.getElementById("cookieConsent");
  const acceptCookiesButton = document.getElementById("acceptCookiesButton");
  const subscriptionModal = document.getElementById("subscriptionModal");
  const emailInput = document.getElementById("emailInput");
  const subscribeButton = document.getElementById("subscribeButton");
  const noThanksButton = document.getElementById("noThanksButton");
  const messageModal = document.getElementById("messageModal"); // Generic message modal
  const messageModalCloseButton = document.getElementById(
    "messageModalCloseButton"
  );
  const messageModalText = document.getElementById("messageModalText");
  const messageModalIcon = document.getElementById("messageModalIcon");

  const MAX_GENERATIONS_FREE = 5;
  const AD_BONUS_GENERATIONS = 3;
  const MAX_ADS_PER_DAY = 2;
  const AD_VIEW_DURATION_SECONDS = 5;

  const MAX_HISTORY_ITEMS = 10;

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

  // --- General Message Modal Functions (from index.html) ---
  function showCustomMessage(message, type = "info", duration = 3000) {
    messageModalText.textContent = message;
    messageModalIcon.className = `mt-4 text-4xl`; // Reset icon class
    if (type === "success") {
      messageModalIcon.classList.add("success");
    } else if (type === "error") {
      messageModalIcon.classList.add("error");
    } else {
      messageModalIcon.classList.add("info");
    }
    messageModal.classList.add("show");

    setTimeout(() => {
      hideCustomMessage();
    }, duration);
  }

  function hideCustomMessage() {
    messageModal.classList.remove("show");
    messageModalText.textContent = "";
    messageModalIcon.className = "mt-4 text-4xl"; // Reset icon class
  }

  // --- Preference Saving and Loading ---
  function savePreferences() {
    const preferences = {
      contentType:
        document.querySelector('input[name="contentType"]:checked')?.value ||
        "story",
      tone: toneSelect.value,
      voiceLanguage: voiceLanguageSelect.value,
      voiceName: voiceSelect.value,
    };
    localStorage.setItem("userPreferences", JSON.stringify(preferences));

    localStorage.setItem("generationsToday", generationsToday);
    localStorage.setItem("adsWatchedToday", adsWatchedToday);
    localStorage.setItem("lastActivityDate", new Date().toDateString());
  }

  function loadPreferences() {
    const preferences = JSON.parse(localStorage.getItem("userPreferences"));
    if (preferences) {
      const contentTypeRadio = document.querySelector(
        `input[name="contentType"][value="${preferences.contentType}"]`
      );
      if (contentTypeRadio) {
        contentTypeRadio.checked = true;
        promptInput.placeholder =
          placeholders[preferences.contentType] || placeholders.story;
      }
      if (preferences.tone) {
        toneSelect.value = preferences.tone;
      }
      setTimeout(() => {
        if (preferences.voiceLanguage) {
          voiceLanguageSelect.value = preferences.voiceLanguage;
          updateSpecificVoices();
        }
        if (preferences.voiceName) {
          voiceSelect.value = preferences.voiceName;
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
      localStorage.setItem("generationsToday", 0);
      localStorage.setItem("adsWatchedToday", 0);
    } else {
      generationsToday = parseInt(storedGenerationsToday || "0");
      adsWatchedToday = parseInt(storedAdsWatchedToday || "0");
    }
    updateGenerationCounterDisplay();
    checkGenerationLimit();
  }

  // --- Voice Loading and Management ---
  function loadVoices() {
    availableVoices = speechSynthesis.getVoices();
    updateVoiceOptions();
    loadPreferences();
  }

  function updateVoiceOptions() {
    const languages = new Set();
    voiceLanguageSelect.innerHTML = "";
    voiceSelect.innerHTML = "";

    availableVoices.forEach((voice) => {
      const langCode = voice.lang.split("-")[0];
      languages.add(langCode);
    });

    const sortedLanguages = Array.from(languages).sort();

    if (sortedLanguages.includes("es")) {
      const esOption = document.createElement("option");
      esOption.value = "es";
      esOption.textContent = "Español (es)";
      voiceLanguageSelect.appendChild(esOption);
      voiceLanguageSelect.value = "es";
    } else {
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Seleccionar idioma";
      voiceLanguageSelect.appendChild(defaultOption);
    }

    sortedLanguages.forEach((lang) => {
      if (lang !== "es") {
        const option = document.createElement("option");
        option.value = lang;
        option.textContent = lang;
        voiceLanguageSelect.appendChild(option);
      }
    });
    updateSpecificVoices();
  }

  function updateSpecificVoices() {
    voiceSelect.innerHTML = "";
    const selectedLangCode = voiceLanguageSelect.value;

    if (!selectedLangCode) {
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Seleccionar voz";
      voiceSelect.appendChild(defaultOption);
      return;
    }

    const filteredVoices = availableVoices
      .filter((voice) => voice.lang.startsWith(selectedLangCode))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (filteredVoices.length === 0) {
      const noVoiceOption = document.createElement("option");
      noVoiceOption.value = "";
      noVoiceOption.textContent = "No hay voces disponibles para este idioma";
      voiceSelect.appendChild(noVoiceOption);
    } else {
      filteredVoices.forEach((voice) => {
        const option = document.createElement("option");
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
      });
    }
  }

  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  } else {
    loadVoices();
  }

  // --- Error Display Functions (Modified to use showCustomMessage for critical errors) ---
  const displayError = (message) => {
    showCustomMessage(message, "error", 5000); // Use generic modal for errors
  };

  const clearError = () => {
    // messageModal is cleared by hideCustomMessage, so no action needed here.
  };

  // --- Loading State Management ---
  const setLoadingState = (isLoading) => {
    generateButton.disabled = isLoading;
    if (isLoading) {
      spinner.classList.remove("hidden");
      buttonText.textContent = "Generando...";
    } else {
      spinner.classList.add("hidden");
      buttonText.textContent = "Generar Contenido";
    }
    checkGenerationLimit();
  };

  // --- Generation Limit Functions ---
  function updateGenerationCounterDisplay() {
    const totalAllowed =
      MAX_GENERATIONS_FREE + adsWatchedToday * AD_BONUS_GENERATIONS;
    generationCounterDisplay.textContent = `Generaciones disponibles hoy: ${Math.max(
      0,
      totalAllowed - generationsToday
    )}/${totalAllowed}`;
  }

  function checkGenerationLimit() {
    const totalAllowed =
      MAX_GENERATIONS_FREE + adsWatchedToday * AD_BONUS_GENERATIONS;
    if (generationsToday >= totalAllowed) {
      generateButton.disabled = true;
      generateButton.classList.add("opacity-50", "cursor-not-allowed");
      if (adsWatchedToday < MAX_ADS_PER_DAY) {
        watchAdButton.classList.remove("hidden");
        watchAdButton.disabled = false;
        watchAdButton.classList.remove("opacity-50", "cursor-not-allowed");
      } else {
        watchAdButton.classList.add("hidden");
        showCustomMessage(
          "Has alcanzado el límite de generaciones gratuitas y de anuncios por hoy. Vuelve mañana para más o considera una suscripción premium.",
          "info",
          7000
        );
      }
    } else {
      generateButton.disabled = false;
      generateButton.classList.remove("opacity-50", "cursor-not-allowed");
      watchAdButton.classList.add("hidden");
    }
  }

  function simulateAdViewing() {
    adModal.classList.add("show");
    let timer = AD_VIEW_DURATION_SECONDS;
    adTimerDisplay.textContent = `Tiempo restante: ${timer} segundos`;
    const adInterval = setInterval(() => {
      timer--;
      adTimerDisplay.textContent = `Tiempo restante: ${timer} segundos`;
      if (timer <= 0) {
        clearInterval(adInterval);
        adModal.classList.remove("show");
        adsWatchedToday++;
        // Reset generationsToday to just MAX_GENERATIONS_FREE for a fresh start,
        // effectively adding AD_BONUS_GENERATIONS
        generationsToday = MAX_GENERATIONS_FREE; // Reset to base free
        // Add bonus, but don't exceed what would be the sum of free + all bonuses
        generationsToday -= adsWatchedToday * AD_BONUS_GENERATIONS; // Adjust for past watched ads, then add total bonus
        generationsToday = Math.min(
          generationsToday,
          MAX_GENERATIONS_FREE + adsWatchedToday * AD_BONUS_GENERATIONS
        );

        // A simpler logic: Just reduce generationsToday by the bonus amount (or reset to 0 if negative)
        // This makes it seem like "you just earned N more generations"
        generationsToday -= AD_BONUS_GENERATIONS;
        if (generationsToday < 0) generationsToday = 0;

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
  }

  // --- Markdown to HTML Formatting Function ---
  function formatGeneratedText(rawText) {
    let formattedText = rawText;

    formattedText = formattedText
      .split(/\n\s*\n/)
      .map((paragraph) => {
        if (paragraph.startsWith("### ")) {
          return "<h3>" + paragraph.substring(4).trim() + "</h3>";
        } else if (paragraph.startsWith("## ")) {
          return "<h2>" + paragraph.substring(3).trim() + "</h2>";
        } else if (paragraph.match(/^- |^\d+\. /m)) {
          let listHtml = "";
          if (paragraph.startsWith("- ")) {
            listHtml = "<ul>";
            paragraph.split("\n").forEach((line) => {
              if (line.startsWith("- ")) {
                listHtml += "<li>" + line.substring(2).trim() + "</li>";
              } else if (line.trim() !== "") {
                listHtml += "<li>" + line.trim() + "</li>";
              }
            });
            listHtml += "</ul>";
          } else if (paragraph.match(/^\d+\. /m)) {
            listHtml = "<ol>";
            paragraph.split("\n").forEach((line) => {
              if (line.match(/^\d+\. /)) {
                listHtml +=
                  "<li>" +
                  line.substring(line.indexOf(".") + 1).trim() +
                  "</li>";
              } else if (line.trim() !== "") {
                listHtml += "<li>" + line.trim() + "</li>";
              }
            });
            listHtml += "</ol>";
          }
          return listHtml;
        }
        return "<p>" + paragraph.trim() + "</p>";
      })
      .join("");

    formattedText = formattedText.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    );
    formattedText = formattedText.replace(/\*(.*?)\*/g, "<em>$1</em>");

    formattedText = formattedText.replace(/#/g, "");
    formattedText = formattedText.replace(/\*/g, "");

    return formattedText;
  }

  // --- Core Content Generation Logic ---
  const handleGenerateContent = async (event) => {
    event.preventDefault();

    const totalAllowed =
      MAX_GENERATIONS_FREE + adsWatchedToday * AD_BONUS_GENERATIONS;
    if (generationsToday >= totalAllowed) {
      checkGenerationLimit();
      return;
    }

    setLoadingState(true);
    generatedTextDiv.innerHTML = "";
    contentModal.classList.remove("show");
    // Removed clearError() here because showCustomMessage will display the error, and we don't want to clear it immediately.
    stopAudio();

    const prompt = promptInput.value.trim();
    const selectedContentType = document.querySelector(
      'input[name="contentType"]:checked'
    ).value;
    const selectedTone = toneSelect.value;

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
      const payload = { contents: chatHistory };

      const apiKey = "AIzaSyDB5snbSNgSo-RmCIoKR4JDp-gG3Xm5x7Y";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        showCustomMessage(
          `Error de la API: ${response.status} ${
            response.statusText
          }. Respuesta: ${errorText.substring(
            0,
            Math.min(errorText.length, 100)
          )}...`,
          "error",
          5000
        );
        console.error(
          "API response not OK:",
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
          "Error al procesar la respuesta de la IA (JSON inválido). Por favor, inténtalo de nuevo.",
          "error",
          5000
        );
        console.error("JSON parsing error:", jsonError);
        console.error("Raw API response:", rawResponseText);
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
        generatedTextDiv.innerHTML = formatGeneratedText(rawText);
        contentModal.classList.add("show");
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
          "No se pudo generar el contenido. La IA no proporcionó una respuesta válida. Por favor, inténtalo de nuevo con una descripción diferente.",
          "error",
          5000
        );
        console.error("Unexpected API response structure:", result);
      }
    } catch (err) {
      showCustomMessage(
        "Error al conectar con la API. Por favor, comprueba tu conexión a internet.",
        "error",
        5000
      );
      console.error("API call error:", err);
    } finally {
      setLoadingState(false);
    }
  };

  // --- Audio Playback Functions ---
  const playAudio = () => {
    const textToSpeak = generatedTextDiv.textContent;
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
    const selectedVoiceName = voiceSelect.value;
    const selectedLangCode = voiceLanguageSelect.value;

    if (selectedVoiceName) {
      const chosenVoice = availableVoices.find(
        (voice) => voice.name === selectedVoiceName
      );
      if (chosenVoice) {
        utterance.voice = chosenVoice;
        utterance.lang = chosenVoice.lang;
      } else {
        if (selectedLangCode) {
          utterance.lang = selectedLangCode;
        } else {
          utterance.lang = "es-ES";
        }
        console.warn(
          `Voz seleccionada "${selectedVoiceName}" no encontrada. Usando voz predeterminada para el idioma o es-ES.`
        );
      }
    } else {
      if (selectedLangCode) {
        utterance.lang = selectedLangCode;
        const defaultVoiceForLang = availableVoices.find((voice) =>
          voice.lang.startsWith(selectedLangCode)
        );
        if (defaultVoiceForLang) {
          utterance.voice = defaultVoiceForLang;
        }
      } else {
        utterance.lang = "es-ES";
        console.warn(
          "No se seleccionó un idioma o voz, usando el predeterminado es-ES."
        );
      }
    }

    utterance.onend = () => {
      isPlayingAudio = false;
      playIcon.classList.remove("hidden");
      pauseIcon.classList.add("hidden");
      togglePlayPauseButton.classList.remove("animate-pulse");
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
      playIcon.classList.remove("hidden");
      pauseIcon.classList.add("hidden");
      togglePlayPauseButton.classList.remove("animate-pulse");
    };

    utterance.onstart = () => {
      togglePlayPauseButton.classList.add("animate-pulse");
    };

    speechSynthesis.speak(utterance);
    isPlayingAudio = true;
    playIcon.classList.add("hidden");
    pauseIcon.classList.remove("hidden");
  };

  const stopAudio = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    isPlayingAudio = false;
    playIcon.classList.remove("hidden");
    pauseIcon.classList.add("hidden");
    togglePlayPauseButton.classList.remove("animate-pulse");
  };

  // --- Clipboard and Download Functions ---
  const copyTextToClipboard = () => {
    const textToCopy = generatedTextDiv.textContent;
    if (!textToCopy) {
      copyConfirmationMessage.textContent = "No hay contenido para copiar.";
      copyConfirmationMessage.classList.add("show");
      setTimeout(() => copyConfirmationMessage.classList.remove("show"), 2000);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = textToCopy;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      const successful = document.execCommand("copy");
      const msg = successful
        ? "¡Copiado al portapapeles!"
        : "No se pudo copiar el texto.";
      copyConfirmationMessage.textContent = msg;
      copyConfirmationMessage.classList.add("show");
      setTimeout(() => copyConfirmationMessage.classList.remove("show"), 2000);
    } catch (err) {
      console.error("Error al intentar copiar al portapapeles:", err);
      copyConfirmationMessage.textContent =
        "Error al copiar. Tu navegador podría no soportar esta función o hay restricciones de seguridad.";
      copyConfirmationMessage.classList.add("show");
      setTimeout(() => copyConfirmationMessage.classList.remove("show"), 3000);
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const downloadPdf = () => {
    const text = generatedTextDiv.textContent;
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

    const lines = doc.splitTextToSize(text, 180);
    doc.text(lines, 10, 10);
    doc.save("contenido_generado.pdf");
  };

  const downloadCsv = () => {
    const text = generatedTextDiv.textContent;
    if (!text) {
      showCustomMessage(
        "No hay contenido para descargar como CSV.",
        "info",
        3000
      );
      return;
    }
    const csvContent = text;
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "contenido_generado.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      showCustomMessage(
        "Tu navegador no soporta la descarga directa de archivos.",
        "info",
        3000
      );
    }
  };

  // --- Content History Functions ---
  function saveGeneratedContentToHistory(prompt, type, text, tone) {
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
  }

  function loadContentHistory() {
    return JSON.parse(localStorage.getItem("generatedContentHistory")) || [];
  }

  function renderContentHistory() {
    const history = loadContentHistory();
    contentHistoryContainer.innerHTML = "";

    if (history.length === 0) {
      contentHistoryContainer.innerHTML =
        '<p class="text-gray-500 text-center">No hay contenido en el historial.</p>';
      clearHistoryButton.classList.add("opacity-50", "cursor-not-allowed");
      clearHistoryButton.disabled = true;
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
        "shadow-sm"
      );
      regenerateButton.innerHTML = '<i class="fas fa-sync-alt text-sm"></i>';
      regenerateButton.title = "Cargar y Regenerar";
      regenerateButton.addEventListener("click", (e) => {
        e.stopPropagation();
        promptInput.value = item.prompt;
        const radio = document.querySelector(
          `input[name="contentType"][value="${item.type}"]`
        );
        if (radio) radio.checked = true;
        promptInput.placeholder = placeholders[item.type] || placeholders.story;

        toneSelect.value = item.tone || "";

        clearError();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      historyItemDiv.appendChild(itemText);
      historyItemDiv.appendChild(regenerateButton);

      contentHistoryContainer.appendChild(historyItemDiv);

      itemText.addEventListener("click", () => {
        generatedTextDiv.innerHTML = formatGeneratedText(item.text);
        contentModal.classList.add("show");
        stopAudio();
      });
    });
    clearHistoryButton.classList.remove("opacity-50", "cursor-not-allowed");
    clearHistoryButton.disabled = false;
  }

  function clearContentHistory() {
    localStorage.removeItem("generatedContentHistory");
    renderContentHistory();
  }

  // --- Cookie Consent Logic (from index.html) ---
  function showCookieConsent() {
    if (!localStorage.getItem("cookieAccepted")) {
      cookieConsent.classList.add("show");
    }
  }

  function acceptCookies() {
    localStorage.setItem("cookieAccepted", "true");
    cookieConsent.classList.remove("show");
    if (
      !localStorage.getItem("subscribed") &&
      !localStorage.getItem("noThanksSubscription")
    ) {
      showSubscriptionModal();
    }
  }

  // --- Subscription Modal Logic (from index.html) ---
  function showSubscriptionModal() {
    subscriptionModal.classList.add("show");
  }

  function handleSubscription() {
    const email = emailInput.value.trim();
    if (email) {
      console.log("Correo suscrito:", email);
      localStorage.setItem("subscribed", "true");
      subscriptionModal.classList.remove("show");
      showCustomMessage("¡Gracias por suscribirte!", "success", 3000);
    } else {
      showCustomMessage(
        "Por favor, introduce un correo electrónico válido.",
        "error",
        3000
      );
    }
  }

  function dismissSubscription() {
    localStorage.setItem("noThanksSubscription", "true");
    subscriptionModal.classList.remove("show");
  }

  // --- Event Listeners ---
  contentTypeOptions.addEventListener("change", (event) => {
    if (event.target.name === "contentType") {
      const selectedType = event.target.value;
      promptInput.placeholder =
        placeholders[selectedType] || placeholders.story;
      savePreferences();
    }
  });

  toneSelect.addEventListener("change", savePreferences);
  voiceLanguageSelect.addEventListener("change", () => {
    updateSpecificVoices();
    savePreferences();
  });
  voiceSelect.addEventListener("change", savePreferences);

  contentForm.addEventListener("submit", handleGenerateContent);
  togglePlayPauseButton.addEventListener("click", () => {
    if (isPlayingAudio) {
      stopAudio();
    } else {
      playAudio();
    }
  });
  copyTextButton.addEventListener("click", copyTextToClipboard);
  downloadPdfButton.addEventListener("click", downloadPdf);
  downloadCsvButton.addEventListener("click", downloadCsv);
  modalCloseButton.addEventListener("click", () => {
    contentModal.classList.remove("show");
    stopAudio();
  });
  contentModal.addEventListener("click", (event) => {
    if (event.target === contentModal) {
      contentModal.classList.remove("show");
      stopAudio();
    }
  });

  clearHistoryButton.addEventListener("click", clearContentHistory);
  watchAdButton.addEventListener("click", simulateAdViewing);

  // Event Listeners for new modals from index.html
  acceptCookiesButton.addEventListener("click", acceptCookies);
  subscribeButton.addEventListener("click", handleSubscription);
  noThanksButton.addEventListener("click", dismissSubscription);
  messageModalCloseButton.addEventListener("click", hideCustomMessage);
  messageModal.addEventListener("click", (event) => {
    // Close generic message modal if click on overlay
    if (event.target === messageModal) {
      hideCustomMessage();
    }
  });
  subscriptionModal.addEventListener("click", (event) => {
    // Close subscription modal if click on overlay
    if (event.target === subscriptionModal) {
      dismissSubscription();
    }
  });

  // Initial load and display
  loadPreferences();
  renderContentHistory();
  showCookieConsent(); // Show cookie consent on initial load
});
