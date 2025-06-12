document.addEventListener("DOMContentLoaded", () => {
  // --- Elementos del DOM ---
  const contentForm = document.getElementById("contentForm");
  const promptInput = document.getElementById("prompt");
  const generateButton = document.getElementById("generateButton");
  const buttonText = document.getElementById("buttonText");
  const spinner = document.getElementById("spinner");
  const generatedTextDiv = document.getElementById("generatedText");
  const togglePlayPauseButton = document.getElementById(
    "togglePlayPauseButton"
  );
  const playIcon = document.getElementById("playIcon");
  const pauseIcon = document.getElementById("pauseIcon");
  const voiceLanguageSelect = document.getElementById("voiceLanguage");
  const voiceSelect = document.getElementById("voiceSelect");
  const downloadPdfButton = document.getElementById("downloadPdfButton");
  // const downloadCsvButton = document.getElementById("downloadCsvButton"); // Eliminado
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

  // De index.html (modales genéricos)
  const cookieConsent = document.getElementById("cookieConsent");
  const acceptCookiesButton = document.getElementById("acceptCookiesButton");
  const subscriptionModal = document.getElementById("subscriptionModal");
  const emailInput = document.getElementById("emailInput");
  const subscribeButton = document.getElementById("subscribeButton");
  const noThanksButton = document.getElementById("noThanksButton");
  const messageModal = document.getElementById("messageModal");
  const messageModalCloseButton = document.getElementById(
    "messageModalCloseButton"
  );
  const messageModalText = document.getElementById("messageModalText");
  const messageModalIcon = document.getElementById("messageModalIcon");

  // --- Constantes de la Aplicación ---
  const MAX_GENERATIONS_FREE = 5;
  const AD_BONUS_GENERATIONS = 3;
  const MAX_ADS_PER_DAY = 2;
  const AD_VIEW_DURATION_SECONDS = 5;
  const MAX_HISTORY_ITEMS = 10;
  // ELIMINADA: const API_KEY = "AIzaSyDB5snbSNgSo-RmCIoKR4JDp-gG3Xm5x7Y"; // Esta clave ahora se maneja en el backend de Vercel

  // --- Variables de Estado Globales ---
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

  // --- Funciones del Modal de Mensajes Genérico ---
  const showCustomMessage = (message, type = "info", duration = 3000) => {
    messageModalText.textContent = message;
    messageModalIcon.className = `mt-4 text-4xl`;
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
  };

  const hideCustomMessage = () => {
    messageModal.classList.remove("show");
    messageModalText.textContent = "";
    messageModalIcon.className = "mt-4 text-4xl";
  };

  // --- Almacenamiento y Carga de Preferencias y Estado ---
  const savePreferences = () => {
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
  };

  const loadPreferences = () => {
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
      // Delay voice loading as voices might not be immediately available
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
  };

  // --- Carga y Gestión de Voces ---
  const loadVoices = () => {
    availableVoices = speechSynthesis.getVoices();
    updateVoiceOptions();
    loadPreferences(); // Load preferences after voices are available
  };

  const updateVoiceOptions = () => {
    const languages = new Set();
    voiceLanguageSelect.innerHTML = "";
    voiceSelect.innerHTML = "";

    availableVoices.forEach((voice) => {
      const langCode = voice.lang.split("-")[0];
      languages.add(langCode);
    });

    const sortedLanguages = Array.from(languages).sort();

    // Prioritize Spanish
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
        // Avoid duplicating Spanish
        const option = document.createElement("option");
        option.value = lang;
        option.textContent = lang;
        voiceLanguageSelect.appendChild(option);
      }
    });
    updateSpecificVoices();
  };

  const updateSpecificVoices = () => {
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
  };

  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  } else {
    loadVoices();
  }

  // --- Gestión de Estado de Carga ---
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

  // --- Lógica del Límite de Generaciones ---
  const updateGenerationCounterDisplay = () => {
    const totalAllowed =
      MAX_GENERATIONS_FREE + adsWatchedToday * AD_BONUS_GENERATIONS;
    generationCounterDisplay.textContent = `Generaciones disponibles hoy: ${Math.max(
      0,
      totalAllowed - generationsToday
    )}/${totalAllowed}`;
  };

  const checkGenerationLimit = () => {
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
  };

  const simulateAdViewing = () => {
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
        generationsToday = Math.max(0, generationsToday - AD_BONUS_GENERATIONS); // Give N more generations
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

    // Negritas y Cursivas (primero los más específicos)
    formattedText = formattedText.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    ); // **negrita**
    formattedText = formattedText.replace(/\*(.*?)\*/g, "<em>$1</em>"); // *cursiva*
    formattedText = formattedText.replace(/__(.*?)__/g, "<strong>$1</strong>"); // __negrita__
    formattedText = formattedText.replace(/_(.*?)_/g, "<em>$1</em>"); // _cursiva_

    // Encabezados (h2 y h3)
    formattedText = formattedText.replace(/^### (.*$)/gm, "<h3>$1</h3>");
    formattedText = formattedText.replace(/^## (.*$)/gm, "<h2>$1</h2>");
    formattedText = formattedText.replace(/^# (.*$)/gm, "<h2>$1</h2>"); // Tratar # como h2 también si es el único

    // Listas (antes de párrafos para evitar que cada elemento sea un párrafo)
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

    // Párrafos: Envolver el texto restante que no fue marcado como encabezado o lista en <p>
    formattedText = formattedText
      .split("\n")
      .map((line) => {
        if (
          line.trim() === "" ||
          line.startsWith("<h") ||
          line.startsWith("<ul") ||
          line.startsWith("<ol")
        ) {
          return line; // No procesar líneas vacías o ya procesadas como HTML
        }
        return "<p>" + line.trim() + "</p>";
      })
      .join("");

    // Eliminar saltos de línea dobles que puedan generar párrafos vacíos
    formattedText = formattedText.replace(/<p>\s*<\/p>/g, "");

    // Asegurar que no queden # o * sueltos si no fueron parte de markdown reconocido
    // ESTO ES UN PARCHE. Idealmente, un parser robusto lo manejaría mejor.
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
    generatedTextDiv.innerHTML = "";
    contentModal.classList.remove("show");
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
      // El Serverless Function espera un objeto con 'prompt' y 'chatHistory'
      const payload = { prompt: prompt, chatHistory: chatHistory };

      // ¡MODIFICADO: Apunta a tu Serverless Function proxy!
      const apiUrl = "/api/gemini"; // Esta es la ruta a tu Serverless Function en Vercel

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
        generatedTextDiv.innerHTML = formatGeneratedText(rawText);
        contentModal.classList.add("show");
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

    const chosenVoice = availableVoices.find(
      (voice) => voice.name === selectedVoiceName
    );
    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang;
    } else if (selectedLangCode) {
      // Fallback to default voice for selected language
      const defaultVoiceForLang = availableVoices.find((voice) =>
        voice.lang.startsWith(selectedLangCode)
      );
      if (defaultVoiceForLang) {
        utterance.voice = defaultVoiceForLang;
        utterance.lang = defaultVoiceForLang.lang;
      } else {
        utterance.lang = selectedLangCode; // Use language code if no voice found
        console.warn(
          `No se encontró una voz predeterminada para el idioma "${selectedLangCode}".`
        );
      }
    } else {
      utterance.lang = "es-ES"; // Default to Spanish if nothing selected
      console.warn(
        "No se seleccionó un idioma o voz, usando el predeterminado es-ES."
      );
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

  // --- Funciones de Portapapeles y Descarga ---
  const copyTextToClipboard = () => {
    const textToCopy = generatedTextDiv.textContent;
    if (!textToCopy) {
      copyConfirmationMessage.textContent = "No hay contenido para copiar.";
      copyConfirmationMessage.classList.add("show");
      setTimeout(() => copyConfirmationMessage.classList.remove("show"), 2000);
      return;
    }
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        copyConfirmationMessage.textContent = "¡Copiado al portapapeles!";
        copyConfirmationMessage.classList.add("show");
        setTimeout(
          () => copyConfirmationMessage.classList.remove("show"),
          2000
        );
      })
      .catch((err) => {
        console.error("Error al intentar copiar al portapapeles:", err);
        copyConfirmationMessage.textContent =
          "Error al copiar. Tu navegador podría no soportar esta función o hay restricciones de seguridad.";
        copyConfirmationMessage.classList.add("show");
        setTimeout(
          () => copyConfirmationMessage.classList.remove("show"),
          3000
        );
      });
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

    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const lineHeight = 7; // Ajusta según el tamaño de fuente y espacio entre líneas
    let y = margin;

    // Split text into lines that fit the PDF page width
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);

    for (let i = 0; i < lines.length; i++) {
      // Check if current line would exceed page height
      if (y + lineHeight > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin; // Reset y-coordinate for new page
      }
      doc.text(lines[i], margin, y);
      y += lineHeight;
    }

    doc.save("contenido_generado.pdf");
  };

  // Función downloadCsv eliminada

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
        "shadow-sm",
        "ml-2" // Add some margin to separate from text
      );
      regenerateButton.innerHTML = '<i class="fas fa-sync-alt text-sm"></i>';
      regenerateButton.title = "Cargar y Regenerar";
      regenerateButton.addEventListener("click", (e) => {
        e.stopPropagation();
        promptInput.value = item.prompt;
        const radio = document.querySelector(
          `input[name="contentType"][value="${item.type}"]`
        );
        if (radio) {
          radio.checked = true;
          promptInput.placeholder =
            placeholders[item.type] || placeholders.story;
        }
        toneSelect.value = item.tone || "";
        showCustomMessage(
          "Prompt e historial cargados para regenerar.",
          "info",
          2000
        );
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
  };

  const clearContentHistory = () => {
    localStorage.removeItem("generatedContentHistory");
    renderContentHistory();
    showCustomMessage("Historial de contenido limpiado.", "success", 2000);
  };

  // --- Lógica de Consentimiento de Cookies ---
  const showCookieConsent = () => {
    if (!localStorage.getItem("cookieAccepted")) {
      cookieConsent.classList.add("show");
    }
  };

  const acceptCookies = () => {
    localStorage.setItem("cookieAccepted", "true");
    cookieConsent.classList.remove("show");
    // Solo mostrar modal de suscripción si no se ha suscrito o dicho "no, gracias" antes
    if (
      !localStorage.getItem("subscribedObelisIA") &&
      !localStorage.getItem("noThanksSubscriptionObelisIA")
    ) {
      showSubscriptionModal();
    }
  };

  // --- Lógica del Modal de Suscripción ---
  const showSubscriptionModal = () => {
    subscriptionModal.classList.add("show");
  };

  const handleSubscription = () => {
    const email = emailInput.value.trim();
    if (email && email.includes("@")) {
      // Basic email validation
      console.log("Correo suscrito (simulado):", email);
      // Simula una suscripción exitosa persistente
      localStorage.setItem("subscribedObelisIA", "true");
      subscriptionModal.classList.remove("show");
      showCustomMessage("¡Gracias por suscribirte!", "success", 3000);
    } else {
      showCustomMessage(
        "Por favor, introduce un correo electrónico válido.",
        "error",
        3000
      );
    }
  };

  const dismissSubscription = () => {
    // Registra que el usuario dijo "no, gracias" para no volver a preguntar
    localStorage.setItem("noThanksSubscriptionObelisIA", "true");
    subscriptionModal.classList.remove("show");
  };

  // --- Listeners de Eventos ---
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
  // downloadCsvButton.addEventListener("click", downloadCsv); // Eliminado

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

  // Listeners para los modales genéricos
  acceptCookiesButton.addEventListener("click", acceptCookies);
  subscribeButton.addEventListener("click", handleSubscription);
  noThanksButton.addEventListener("click", dismissSubscription);
  messageModalCloseButton.addEventListener("click", hideCustomMessage);
  messageModal.addEventListener("click", (event) => {
    if (event.target === messageModal) {
      hideCustomMessage();
    }
  });
  subscriptionModal.addEventListener("click", (event) => {
    if (event.target === subscriptionModal && event.target !== emailInput) {
      // Don't dismiss if clicking input
      dismissSubscription();
    }
  });

  // --- Inicialización ---
  loadPreferences();
  renderContentHistory();
  showCookieConsent();
});
