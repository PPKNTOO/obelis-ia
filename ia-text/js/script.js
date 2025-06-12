// js/script.js

(function () {
  // IIFE para encapsular todo el código y asegurar el ámbito
  // --- Constantes de Configuración ---
  const CONFIG = {
    MAX_GENERATIONS_FREE: 5,
    AD_BONUS_GENERATIONS: 3,
    MAX_ADS_PER_DAY: 2,
    AD_VIEW_DURATION_SECONDS: 5,
    MAX_HISTORY_ITEMS: 10,
  };

  // --- Variables de Estado Globales ---
  let generationsToday = 0;
  let adsWatchedToday = 0;
  let lastActivityDate = "";

  let utterance = null;
  let availableVoices = [];
  let isPlayingAudio = false;

  // --- DOMElements (se inicializarán en DOMContentLoaded) ---
  let DOMElements;

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

  // --- FUNCIONES DE UTILIDAD Y MENSAJES (Ahora usan DOMElements) ---

  function showCustomMessage(message, type = "info", duration = 3000) {
    if (!DOMElements || !DOMElements.messageModalText) {
      console.warn(
        "Message modal elements not found, cannot display custom message:",
        message
      );
      return;
    }
    DOMElements.messageModalText.textContent = message;
    DOMElements.messageModalIcon.className = `mt-4 text-4xl`;
    if (type === "success") {
      DOMElements.messageModalIcon.classList.add("success");
    } else if (type === "error") {
      DOMElements.messageModalIcon.classList.add("error");
    } else {
      DOMElements.messageModalIcon.classList.add("info");
    }
    DOMElements.messageModal.classList.add("show");

    setTimeout(() => {
      hideCustomMessage();
    }, duration);
  }

  function hideCustomMessage() {
    if (!DOMElements || !DOMElements.messageModal) return;
    DOMElements.messageModal.classList.remove("show");
    DOMElements.messageModalText.textContent = "";
    DOMElements.messageModalIcon.className = "mt-4 text-4xl";
  }

  // --- PREFERENCIAS Y ALMACENAMIENTO LOCAL ---
  function savePreferences() {
    const preferences = {
      contentType:
        DOMElements.contentTypeOptions.querySelector(
          'input[name="contentType"]:checked'
        )?.value || "story",
      tone: DOMElements.toneSelect.value,
      voiceLanguage: DOMElements.voiceLanguageSelect.value,
      voiceName: DOMElements.voiceSelect.value,
    };
    localStorage.setItem("userPreferences", JSON.stringify(preferences));

    localStorage.setItem("generationsToday", generationsToday);
    localStorage.setItem("adsWatchedToday", adsWatchedToday);
    localStorage.setItem("lastActivityDate", new Date().toDateString());
  }

  function loadPreferences() {
    const preferences = JSON.parse(localStorage.getItem("userPreferences"));
    if (preferences) {
      const contentTypeRadio = DOMElements.contentTypeOptions.querySelector(
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
      // Esperar un poco para que las voces se carguen antes de intentar seleccionarlas
      setTimeout(() => {
        if (preferences.voiceLanguage) {
          DOMElements.voiceLanguageSelect.value = preferences.voiceLanguage;
          updateSpecificVoices(); // Vuelve a llamar para poblar las voces específicas
        }
        if (preferences.voiceName) {
          DOMElements.voiceSelect.value = preferences.voiceName;
        }
      }, 500); // Pequeño retraso
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

  // --- GESTIÓN DE VOCES (TEXT-TO-SPEECH) ---
  function loadVoices() {
    availableVoices = speechSynthesis.getVoices();
    updateVoiceOptions();
    loadPreferences(); // Cargar preferencias después de que las voces estén disponibles
  }

  function updateVoiceOptions() {
    const languages = new Set();
    DOMElements.voiceLanguageSelect.innerHTML = "";
    DOMElements.voiceSelect.innerHTML = "";

    availableVoices.forEach((voice) => {
      const langCode = voice.lang.split("-")[0];
      languages.add(langCode);
    });

    const sortedLanguages = Array.from(languages).sort();

    // Priorizar español si existe
    if (sortedLanguages.includes("es")) {
      const esOption = document.createElement("option");
      esOption.value = "es";
      esOption.textContent = "Español (es)";
      DOMElements.voiceLanguageSelect.appendChild(esOption);
      DOMElements.voiceLanguageSelect.value = "es"; // Establecer español por defecto
    } else {
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Seleccionar idioma";
      DOMElements.voiceLanguageSelect.appendChild(defaultOption);
    }

    sortedLanguages.forEach((lang) => {
      if (lang !== "es") {
        // Evitar duplicar español
        const option = document.createElement("option");
        option.value = lang;
        option.textContent = lang;
        DOMElements.voiceLanguageSelect.appendChild(option);
      }
    });
    updateSpecificVoices(); // Llama para poblar las voces del idioma seleccionado
  }

  function updateSpecificVoices() {
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
  }

  // --- GESTIÓN DE ESTADO DE CARGA Y LÍMITES ---
  const setLoadingState = (isLoading) => {
    if (DOMElements.generateButton)
      DOMElements.generateButton.disabled = isLoading;
    if (isLoading) {
      if (DOMElements.spinner) DOMElements.spinner.classList.remove("hidden");
      if (DOMElements.buttonText)
        DOMElements.buttonText.textContent = "Generando...";
    } else {
      if (DOMElements.spinner) DOMElements.spinner.classList.add("hidden");
      if (DOMElements.buttonText)
        DOMElements.buttonText.textContent = "Generar Contenido";
    }
    checkGenerationLimit();
  };

  function updateGenerationCounterDisplay() {
    const totalAllowed =
      CONFIG.MAX_GENERATIONS_FREE +
      adsWatchedToday * CONFIG.AD_BONUS_GENERATIONS;
    if (DOMElements.generationCounterDisplay) {
      DOMElements.generationCounterDisplay.textContent = `Generaciones disponibles hoy: ${Math.max(
        0,
        totalAllowed - generationsToday
      )}/${totalAllowed}`;
    }
  }

  function checkGenerationLimit() {
    const totalAllowed =
      CONFIG.MAX_GENERATIONS_FREE +
      adsWatchedToday * CONFIG.AD_BONUS_GENERATIONS;
    if (generationsToday >= totalAllowed) {
      if (DOMElements.generateButton) {
        DOMElements.generateButton.disabled = true;
        DOMElements.generateButton.classList.add(
          "opacity-50",
          "cursor-not-allowed"
        );
      }
      if (adsWatchedToday < CONFIG.MAX_ADS_PER_DAY) {
        if (DOMElements.watchAdButton) {
          DOMElements.watchAdButton.classList.remove("hidden");
          DOMElements.watchAdButton.disabled = false;
          DOMElements.watchAdButton.classList.remove(
            "opacity-50",
            "cursor-not-allowed"
          );
        }
      } else {
        if (DOMElements.watchAdButton)
          DOMElements.watchAdButton.classList.add("hidden");
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
      if (DOMElements.watchAdButton)
        DOMElements.watchAdButton.classList.add("hidden");
    }
  }

  function simulateAdViewing() {
    if (!DOMElements.adModal || !DOMElements.adTimerDisplay) return;

    DOMElements.adModal.classList.add("show");
    let timer = CONFIG.AD_VIEW_DURATION_SECONDS;
    DOMElements.adTimerDisplay.textContent = `Tiempo restante: ${timer} segundos`;

    if (DOMElements.watchAdButton) {
      DOMElements.watchAdButton.disabled = true;
      DOMElements.watchAdButton.classList.add(
        "opacity-50",
        "cursor-not-allowed"
      );
    }

    const adInterval = setInterval(() => {
      timer--;
      DOMElements.adTimerDisplay.textContent = `Tiempo restante: ${timer} segundos`;
      if (timer <= 0) {
        clearInterval(adInterval);
        DOMElements.adModal.classList.remove("show");
        adsWatchedToday++;
        generationsToday = Math.max(
          0,
          generationsToday - CONFIG.AD_BONUS_GENERATIONS
        );

        savePreferences();
        updateGenerationCounterDisplay();
        checkGenerationLimit();
        showCustomMessage(
          `¡Gracias por ver el anuncio! Has recibido +${CONFIG.AD_BONUS_GENERATIONS} generaciones.`,
          "success",
          3000
        );
      }
    }, 1000);
  }

  // --- FORMATO Y CONTENIDO ---
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

  // --- LÓGICA PRINCIPAL DE GENERACIÓN DE CONTENIDO ---
  const handleGenerateContent = async (event) => {
    event.preventDefault();

    const totalAllowed =
      CONFIG.MAX_GENERATIONS_FREE +
      adsWatchedToday * CONFIG.AD_BONUS_GENERATIONS;
    if (generationsToday >= totalAllowed) {
      checkGenerationLimit();
      return;
    }

    setLoadingState(true);
    if (DOMElements.generatedTextDiv)
      DOMElements.generatedTextDiv.innerHTML = "";
    if (DOMElements.contentModal)
      DOMElements.contentModal.classList.remove("show");
    stopAudio();

    const prompt = DOMElements.promptInput.value.trim();
    const selectedContentType = DOMElements.contentTypeOptions.querySelector(
      'input[name="contentType"]:checked'
    )?.value;
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
      const payload = { contents: chatHistory };

      // Llama a tu Serverless Function de Vercel para la API de Gemini (TEXTO)
      const apiUrl = `/api/gemini`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiType: "gemini",
          prompt: aiPrompt,
          chatHistory: chatHistory,
        }), // apiType: 'gemini'
      });

      if (!response.ok) {
        const errorData = await response.json();
        showCustomMessage(
          `Error de la API: ${response.status} ${
            response.statusText
          }. Mensaje: ${errorData.error?.message || "Error desconocido"}`,
          "error",
          5000
        );
        console.error(
          "API response not OK:",
          response.status,
          response.statusText,
          errorData
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
        if (DOMElements.generatedTextDiv)
          DOMElements.generatedTextDiv.innerHTML = formatGeneratedText(rawText);
        if (DOMElements.contentModal)
          DOMElements.contentModal.classList.add("show");
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
        "Error al conectar con la API o error de red. Por favor, comprueba tu conexión a internet.",
        "error",
        5000
      );
      console.error("API call error:", err);
    } finally {
      setLoadingState(false);
    }
  };

  // --- REPRODUCCIÓN DE AUDIO (TEXT-TO-SPEECH) ---
  const playAudio = () => {
    if (!DOMElements.generatedTextDiv) {
      showCustomMessage("No hay contenido para leer.", "info", 3000);
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
    stopAudio();

    utterance = new SpeechSynthesisUtterance(textToSpeak);
    const selectedVoiceName = DOMElements.voiceSelect.value;
    const selectedLangCode = DOMElements.voiceLanguageSelect.value;

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

  // --- FUNCIONES DE PORTAPAPELES Y DESCARGA ---
  const copyTextToClipboard = () => {
    if (!DOMElements.generatedTextDiv) {
      showCustomMessage("No hay contenido para copiar.", "info", 3000);
      return;
    }
    const textToCopy = DOMElements.generatedTextDiv.textContent;
    if (!textToCopy) {
      if (DOMElements.copyConfirmationMessage) {
        DOMElements.copyConfirmationMessage.textContent =
          "No hay contenido para copiar.";
        DOMElements.copyConfirmationMessage.classList.add("show");
        setTimeout(
          () => DOMElements.copyConfirmationMessage.classList.remove("show"),
          2000
        );
      }
      return;
    }
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        if (DOMElements.copyConfirmationMessage) {
          DOMElements.copyConfirmationMessage.textContent =
            "¡Copiado al portapapeles!";
          DOMElements.copyConfirmationMessage.classList.add("show");
          setTimeout(
            () => DOMElements.copyConfirmationMessage.classList.remove("show"),
            2000
          );
        }
      })
      .catch((err) => {
        console.error("Error al intentar copiar al portapapeles:", err);
        const textarea = document.createElement("textarea");
        textarea.value = textToCopy;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        try {
          const successful = document.execCommand("copy");
          const msg = successful
            ? "¡Copiado al portapapeles! (Fallback)"
            : "No se pudo copiar el texto.";
          if (DOMElements.copyConfirmationMessage) {
            DOMElements.copyConfirmationMessage.textContent = msg;
            DOMElements.copyConfirmationMessage.classList.add("show");
            setTimeout(
              () =>
                DOMElements.copyConfirmationMessage.classList.remove("show"),
              2000
            );
          }
        } catch (errFallback) {
          console.error(
            "Error en el fallback de copiar al portapapeles:",
            errFallback
          );
          if (DOMElements.copyConfirmationMessage) {
            DOMElements.copyConfirmationMessage.textContent =
              "Error al copiar. Tu navegador podría no soportar esta función o hay restricciones de seguridad.";
            DOMElements.copyConfirmationMessage.classList.add("show");
            setTimeout(
              () =>
                DOMElements.copyConfirmationMessage.classList.remove("show"),
              3000
            );
          }
        } finally {
          document.body.removeChild(textarea);
        }
      });
  };

  const downloadPdf = () => {
    if (!DOMElements.generatedTextDiv) {
      showCustomMessage(
        "No hay contenido para descargar como PDF.",
        "info",
        3000
      );
      return;
    }
    const text = DOMElements.generatedTextDiv.textContent;
    if (!text) {
      showCustomMessage(
        "No hay contenido para descargar como PDF.",
        "info",
        3000
      );
      return;
    }
    if (typeof window.jspdf === "undefined" || !window.jspdf.jsPDF) {
      showCustomMessage(
        "La librería de PDF (jsPDF) no está cargada. Intenta recargar la página.",
        "error",
        5000
      );
      console.error("jsPDF library not loaded.");
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text(doc.splitTextToSize(text, 180), 10, 10);
    doc.save("contenido_generado.pdf");
    showCustomMessage("Contenido descargado como PDF.", "success", 3000);
  };

  // --- FUNCIONES DE HISTORIAL DE CONTENIDO ---
  function saveGeneratedContentToHistory(prompt, type, text, tone) {
    let history =
      JSON.parse(localStorage.getItem("generatedContentHistory")) || [];
    const timestamp = new Date().toLocaleString();
    const newItem = { prompt, type, text, tone, timestamp };

    history.unshift(newItem);
    if (history.length > CONFIG.MAX_HISTORY_ITEMS) {
      history = history.slice(0, CONFIG.MAX_HISTORY_ITEMS);
    }
    localStorage.setItem("generatedContentHistory", JSON.stringify(history));
    renderContentHistory();
  }

  function loadContentHistory() {
    return JSON.parse(localStorage.getItem("generatedContentHistory")) || [];
  }

  function renderContentHistory() {
    if (!DOMElements.contentHistoryContainer) return;

    const history = loadContentHistory();
    DOMElements.contentHistoryContainer.innerHTML = "";

    if (history.length === 0) {
      DOMElements.contentHistoryContainer.innerHTML =
        '<p class="text-gray-500 text-center">No hay contenido en el historial.</p>';
      if (DOMElements.clearHistoryButton) {
        DOMElements.clearHistoryButton.classList.add(
          "opacity-50",
          "cursor-not-allowed"
        );
        DOMElements.clearHistoryButton.disabled = true;
      }
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
        if (DOMElements.promptInput)
          DOMElements.promptInput.value = item.prompt;
        const radio = DOMElements.contentTypeOptions.querySelector(
          `input[name="contentType"][value="${item.type}"]`
        );
        if (radio) radio.checked = true;
        if (DOMElements.promptInput)
          DOMElements.promptInput.placeholder =
            placeholders[item.type] || placeholders.story;

        if (DOMElements.toneSelect)
          DOMElements.toneSelect.value = item.tone || "";

        hideCustomMessage();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      historyItemDiv.appendChild(itemText);
      historyItemDiv.appendChild(regenerateButton);

      DOMElements.contentHistoryContainer.appendChild(historyItemDiv);

      itemText.addEventListener("click", () => {
        if (DOMElements.generatedTextDiv)
          DOMElements.generatedTextDiv.innerHTML = formatGeneratedText(
            item.text
          );
        if (DOMElements.contentModal)
          DOMElements.contentModal.classList.add("show");
        stopAudio();
      });
    });
    if (DOMElements.clearHistoryButton) {
      DOMElements.clearHistoryButton.classList.remove(
        "opacity-50",
        "cursor-not-allowed"
      );
      DOMElements.clearHistoryButton.disabled = false;
    }
  }

  function clearContentHistory() {
    localStorage.removeItem("generatedContentHistory");
    renderContentHistory();
    showCustomMessage("Historial de contenido limpiado.", "success", 3000);
  }

  // --- LÓGICA DE COOKIES Y SUSCRIPCIÓN (GENERAL) ---
  function showCookieConsent() {
    if (DOMElements.cookieConsent && !localStorage.getItem("cookieAccepted")) {
      DOMElements.cookieConsent.classList.add("show");
    }
  }

  function acceptCookies() {
    localStorage.setItem("cookieAccepted", "true");
    if (DOMElements.cookieConsent)
      DOMElements.cookieConsent.classList.remove("show");
    showSubscriptionModal();
  }

  function showSubscriptionModal() {
    if (DOMElements.subscriptionModal) {
      DOMElements.subscriptionModal.classList.add("show");
    }
  }

  function handleSubscription() {
    if (!DOMElements.emailInput) {
      console.error("emailInput no encontrado.");
      showCustomMessage(
        "Error interno: no se pudo procesar la suscripción.",
        "error"
      );
      return;
    }
    const email = DOMElements.emailInput.value.trim();
    if (email) {
      console.log("Correo suscrito:", email);
      localStorage.setItem("subscribed", "true");
      if (DOMElements.subscriptionModal)
        DOMElements.subscriptionModal.classList.remove("show");
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
    if (DOMElements.subscriptionModal)
      DOMElements.subscriptionModal.classList.remove("show");
  }

  // --- Lógica del Menú Desplegable (para la navbar responsive) ---
  function setupDropdown(button, dropdown) {
    if (!button || !dropdown) return;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      document.querySelectorAll(".submenu.show").forEach((openDropdown) => {
        if (openDropdown && openDropdown !== dropdown) {
          openDropdown.classList.remove("show");
        }
      });
      dropdown.classList.toggle("show");
    });
  }

  function updateActiveClass() {
    if (!DOMElements.mainNavbar) {
      console.warn(
        "Navbar principal no encontrada para actualizar la clase activa. Asegúrate de que tenga id='main-navbar'."
      );
      return;
    }

    const navLinks = DOMElements.mainNavbar.querySelectorAll(".nav-item a");
    const submenuItems =
      DOMElements.mainNavbar.querySelectorAll(".submenu-item");
    const navItemGroups =
      DOMElements.mainNavbar.querySelectorAll(".nav-item.group");

    const currentPath = window.location.pathname;

    navLinks.forEach((link) => {
      link.classList.remove("active-link");
      link.removeAttribute("aria-current");
    });
    submenuItems.forEach((item) => {
      item.classList.remove("active-link");
    });
    navItemGroups.forEach((group) => {
      const span = group.querySelector("span.cursor-pointer");
      if (span) {
        span.classList.add("active-link");
      }
    });

    const normalizePath = (path) => {
      let normalized = path;
      if (normalized.endsWith("/index.html")) {
        normalized = normalized.slice(0, -11);
      }
      if (!normalized.endsWith("/")) {
        normalized += "/";
      }
      return normalized;
    };

    const normalizedCurrentPath = normalizePath(currentPath);
    const origin = window.location.origin;

    DOMElements.mainNavbar.querySelectorAll("a").forEach((item) => {
      const href = item.getAttribute("href");
      if (href) {
        const itemPath = normalizePath(new URL(href, origin).pathname);

        if (normalizedCurrentPath === itemPath) {
          item.classList.add("active-link");
          item.setAttribute("aria-current", "page");

          const parentSubmenu = item.closest(".submenu");
          if (parentSubmenu) {
            const parentNavItem = parentSubmenu.closest(".nav-item.group");
            if (parentNavItem) {
              const span = parentNavItem.querySelector("span.cursor-pointer");
              if (span) {
                span.classList.add("active-link");
              }
            }
          }
        }
      }
    });
  }

  // --- INICIALIZACIÓN PRINCIPAL (DOMContentLoaded) ---
  document.addEventListener("DOMContentLoaded", function () {
    // Asignar todos los elementos DOM a DOMElements
    DOMElements = {
      // Elementos del formulario y contenido
      contentForm: document.getElementById("contentForm"),
      promptInput: document.getElementById("prompt"),
      generateButton: document.getElementById("generateButton"),
      buttonText: document.getElementById("buttonText"),
      spinner: document.getElementById("spinner"),
      errorMessage: document.getElementById("errorMessage"),
      generatedTextDiv: document.getElementById("generatedText"),
      contentTypeOptions: document.getElementById("contentTypeOptions"),
      toneSelect: document.getElementById("toneSelect"),
      copyTextButton: document.getElementById("copyTextButton"),

      // Historial
      contentHistoryContainer: document.getElementById(
        "contentHistoryContainer"
      ),
      clearHistoryButton: document.getElementById("clearHistoryButton"),

      // Audio/Lector de voz
      togglePlayPauseButton: document.getElementById("togglePlayPauseButton"),
      playIcon: document.getElementById("playIcon"),
      pauseIcon: document.getElementById("pauseIcon"),
      voiceLanguageSelect: document.getElementById("voiceLanguage"),
      voiceSelect: document.getElementById("voiceSelect"),

      // Descargas
      downloadPdfButton: document.getElementById("downloadPdfButton"),

      // Límite de generaciones y anuncios
      generationCounterDisplay: document.getElementById(
        "generationCounterDisplay"
      ),
      watchAdButton: document.getElementById("watchAdButton"),
      adModal: document.getElementById("adModal"),
      adTimerDisplay: document.getElementById("adTimer"),

      // Modales generales y cookies/suscripción
      messageModal: document.getElementById("messageModal"),
      messageModalCloseButton: document.getElementById(
        "messageModalCloseButton"
      ),
      messageModalText: document.getElementById("messageModalText"),
      messageModalIcon: document.getElementById("messageModalIcon"),
      cookieConsent: document.getElementById("cookieConsent"),
      acceptCookiesButton: document.getElementById("acceptCookiesButton"),
      subscriptionModal: document.getElementById("subscriptionModal"),
      subscriptionModalCloseButton: document.getElementById(
        "subscriptionModalCloseButton"
      ),
      emailInput: document.getElementById("emailInput"),
      subscribeButton: document.getElementById("subscribeButton"),
      noThanksButton: document.getElementById("noThanksButton"),

      // Navbar general
      mainNavbar: document.getElementById("main-navbar"),
      menuToggle: document.getElementById("menuToggle"),
      navLinksContainer: document.querySelector(
        ".navbar-inner-content .flex-wrap"
      ),
    };

    // Crear el mensaje de confirmación de copiado (no existe en HTML, se crea dinámicamente)
    const copyConfirmationMessage = document.createElement("div");
    copyConfirmationMessage.id = "copyConfirmationMessage";
    copyConfirmationMessage.textContent = "¡Copiado al portapapeles!";
    document.body.appendChild(copyConfirmationMessage);
    DOMElements.copyConfirmationMessage = copyConfirmationMessage; // Añadirlo a DOMElements

    // Cargar preferencias del usuario y contadores
    loadPreferences();
    // Mostrar modal de consentimiento de cookies si es la primera vez
    showCookieConsent();

    // --- Event Listeners ---

    // Formulario de contenido
    if (DOMElements.contentForm)
      DOMElements.contentForm.addEventListener("submit", handleGenerateContent);
    if (DOMElements.contentTypeOptions)
      DOMElements.contentTypeOptions.addEventListener("change", (event) => {
        if (event.target.name === "contentType") {
          const selectedType = event.target.value;
          if (DOMElements.promptInput)
            DOMElements.promptInput.placeholder =
              placeholders[selectedType] || placeholders.story;
          savePreferences();
        }
      });
    if (DOMElements.toneSelect)
      DOMElements.toneSelect.addEventListener("change", savePreferences);
    if (DOMElements.watchAdButton)
      DOMElements.watchAdButton.addEventListener("click", simulateAdViewing);

    // Funcionalidades de audio
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    } else {
      loadVoices();
    }
    if (DOMElements.voiceLanguageSelect)
      DOMElements.voiceLanguageSelect.addEventListener("change", () => {
        updateSpecificVoices();
        savePreferences();
      });
    if (DOMElements.voiceSelect)
      DOMElements.voiceSelect.addEventListener("change", savePreferences);
    if (DOMElements.togglePlayPauseButton)
      DOMElements.togglePlayPauseButton.addEventListener("click", () => {
        if (isPlayingAudio) {
          stopAudio();
        } else {
          playAudio();
        }
      });

    // Copiar y descargar
    if (DOMElements.copyTextButton)
      DOMElements.copyTextButton.addEventListener("click", copyTextToClipboard);
    if (DOMElements.downloadPdfButton)
      DOMElements.downloadPdfButton.addEventListener("click", downloadPdf);

    // Historial
    if (DOMElements.clearHistoryButton)
      DOMElements.clearHistoryButton.addEventListener(
        "click",
        clearContentHistory
      );
    if (DOMElements.contentModal)
      DOMElements.contentModal.addEventListener("click", (event) => {
        if (event.target === DOMElements.contentModal) {
          DOMElements.contentModal.classList.remove("show");
          stopAudio();
        }
      });
    if (DOMElements.modalCloseButton)
      DOMElements.modalCloseButton.addEventListener("click", () => {
        if (DOMElements.contentModal)
          DOMElements.contentModal.classList.remove("show");
        stopAudio();
      });

    // Modales de cookies y suscripción
    if (DOMElements.acceptCookiesButton)
      DOMElements.acceptCookiesButton.addEventListener("click", acceptCookies);
    if (DOMElements.subscribeButton)
      DOMElements.subscribeButton.addEventListener("click", handleSubscription);
    if (DOMElements.noThanksButton)
      DOMElements.noThanksButton.addEventListener("click", dismissSubscription);
    if (DOMElements.subscriptionModalCloseButton)
      DOMElements.subscriptionModalCloseButton.addEventListener(
        "click",
        dismissSubscription
      );
    if (DOMElements.subscriptionModal)
      DOMElements.subscriptionModal.addEventListener("click", (event) => {
        if (event.target === DOMElements.subscriptionModal) {
          dismissSubscription();
        }
      });

    // Modal de mensajes genérico
    if (DOMElements.messageModalCloseButton)
      DOMElements.messageModalCloseButton.addEventListener(
        "click",
        hideCustomMessage
      );
    if (DOMElements.messageModal)
      DOMElements.messageModal.addEventListener("click", (event) => {
        if (event.target === DOMElements.messageModal) {
          hideCustomMessage();
        }
      });

    // Navegación responsive
    if (DOMElements.menuToggle && DOMElements.navLinksContainer) {
      DOMElements.menuToggle.addEventListener("click", () => {
        DOMElements.navLinksContainer.classList.toggle("active");
        DOMElements.menuToggle.querySelector("i").classList.toggle("fa-bars");
        DOMElements.menuToggle.querySelector("i").classList.toggle("fa-times");
      });
      document.addEventListener("click", (event) => {
        const isClickInsideNav = DOMElements.navLinksContainer.contains(
          event.target
        );
        const isClickOnToggle = DOMElements.menuToggle.contains(event.target);
        if (
          !isClickInsideNav &&
          !isClickOnToggle &&
          DOMElements.navLinksContainer.classList.contains("active")
        ) {
          DOMElements.navLinksContainer.classList.remove("active");
          DOMElements.menuToggle
            .querySelector("i")
            .classList.remove("fa-times");
          DOMElements.menuToggle.querySelector("i").classList.add("fa-bars");
        }
      });
      DOMElements.navLinksContainer.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          if (window.innerWidth <= 768) {
            DOMElements.navLinksContainer.classList.remove("active");
            DOMElements.menuToggle
              .querySelector("i")
              .classList.remove("fa-times");
            DOMElements.menuToggle.querySelector("i").classList.add("fa-bars");
          }
        });
      });
    }

    // Actualizar la clase activa de la navegación al cargar la página
    updateActiveClass();
  });

  // Asegurar que la clase activa se actualice si la URL cambia (por ejemplo, con navegación SPA si se implementa)
  window.addEventListener("popstate", updateActiveClass);
  window.addEventListener("hashchange", updateActiveClass);
})(); // Cierre de la IIFE
