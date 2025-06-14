// convert-img/js/script.js

// --- Constantes de Configuración (específicas de este módulo) ---
const CONFIG = {
  MAX_FREE_CONVERSIONS: 5,
  CONVERSIONS_PER_AD_WATCH: 3,
  AD_VIEW_DURATION_SECONDS: 5, // Duración del anuncio simulado
  MAX_ADS_PER_DAY: 2, // Límite de anuncios por día
};

// --- Variables de Estado Globales (específicas de este módulo) ---
let originalImage = null; // Para almacenar la imagen original cargada
let convertedBlob = null; // Para almacenar el blob de la imagen convertida

let conversionsToday = 0;
let adsWatchedToday = 0;
let lastActivityDate = ""; // Para reiniciar los contadores diariamente

let ctx; // Contexto del canvas, usado en este script

// --- FUNCIONES DE UTILIDAD Y MENSAJES ---

// showCustomMessage y hideCustomMessage vienen de global.js

// Función para mostrar/ocultar el modal de carga global
// Adaptada para usar el loadingOverlayModal de main.css
function showLoadingOverlay(
  message = "Procesando imagen, por favor espera...",
  isError = false
) {
  // Asegurarse de que los elementos existan antes de manipularlos
  if (
    !DOMElements.loadingOverlayModal ||
    !DOMElements.loadingMessageTextModal ||
    !DOMElements.loadingErrorTextModal ||
    !DOMElements.loadingModalCloseButton
  ) {
    console.error(
      "Loading overlay modal elements (required for basic functionality) not found in DOMElements. Falling back to simple alert.",
      DOMElements
    ); // Más detalles para depurar
    alert(message); // Fallback si los elementos no se encuentran
    return;
  }
  // Optional elements, check before use
  const pocoyoGif = DOMElements.pocoyoGifModal;
  const loadingSpinner = DOMElements.loadingSpinnerModal;

  DOMElements.loadingMessageTextModal.textContent = message;
  DOMElements.loadingErrorTextModal.classList.add("hidden"); // Ocultar errores previos

  if (isError) {
    DOMElements.loadingErrorTextModal.textContent = message;
    DOMElements.loadingErrorTextModal.classList.remove("hidden");
    DOMElements.loadingMessageTextModal.textContent = "¡Ha ocurrido un error!";
    if (pocoyoGif) pocoyoGif.classList.add("hidden");
    if (loadingSpinner) loadingSpinner.classList.add("hidden");
    DOMElements.loadingModalCloseButton.classList.remove("hidden");
  } else {
    DOMElements.loadingModalCloseButton.classList.add("hidden");
    // Decidir si mostrar Pocoyo o spinner
    if (pocoyoGif) {
      pocoyoGif.classList.remove("hidden");
      if (loadingSpinner) loadingSpinner.classList.add("hidden");
      pocoyoGif.onerror = () => {
        if (pocoyoGif) pocoyoGif.classList.add("hidden");
        if (loadingSpinner) loadingSpinner.classList.remove("hidden");
        console.warn("Pocoyo GIF failed to load, switching to spinner.");
      };
    } else if (loadingSpinner) {
      loadingSpinner.classList.remove("hidden");
    }
  }
  DOMElements.loadingOverlayModal.classList.add("show");
}

function hideLoadingOverlay() {
  if (!DOMElements.loadingOverlayModal) return;
  DOMElements.loadingOverlayModal.classList.remove("show");
  // Resetear mensajes y visibilidad de elementos internos
  if (DOMElements.loadingMessageTextModal)
    DOMElements.loadingMessageTextModal.textContent = "";
  if (DOMElements.loadingErrorTextModal) {
    DOMElements.loadingErrorTextModal.textContent = "";
    DOMElements.loadingErrorTextModal.classList.add("hidden");
  }
  if (DOMElements.pocoyoGifModal)
    DOMElements.pocoyoGifModal.classList.remove("hidden");
  if (DOMElements.loadingSpinnerModal)
    DOMElements.loadingSpinnerModal.classList.add("hidden");
  if (DOMElements.loadingModalCloseButton)
    DOMElements.loadingModalCloseButton.classList.add("hidden");
}

// Función toggleLoading ahora usa el modal global de carga
function toggleLoading(show) {
  if (show) {
    showLoadingOverlay("Procesando imagen, por favor espera...");
  } else {
    hideLoadingOverlay();
  }

  // Deshabilitar/Habilitar controles (los botones principales se manejan individualmente)
  const allControls = document.querySelectorAll(
    'button, input[type="file"], select, label[for="imageUpload"]'
  );
  allControls.forEach((control) => {
    // Si el control es el input de archivo o la etiqueta, no se deshabilita
    if (
      control.id === "imageUpload" ||
      control.getAttribute("for") === "imageUpload"
    ) {
      control.disabled = false;
    } else if (control.id === "watchAdButton") {
      // El botón de anuncio se deshabilita durante la carga general,
      // pero su estado final se define en checkConversionLimit
      control.disabled = show;
      control.classList.toggle("disabled-btn", show);
    } else {
      control.disabled = show;
      control.classList.toggle("disabled-btn", show);
    }
  });

  // Habilitar/deshabilitar botones de convertir y descargar según el estado de carga y blob
  // Esto sobrescribe el comportamiento general para estos dos botones específicos
  if (DOMElements.convertBtn) {
    DOMElements.convertBtn.disabled = show || !originalImage;
    DOMElements.convertBtn.classList.toggle(
      "disabled-btn",
      show || !originalImage
    );
  }
  if (DOMElements.downloadBtn) {
    DOMElements.downloadBtn.disabled = show || !convertedBlob;
    DOMElements.downloadBtn.classList.toggle(
      "disabled-btn",
      show || !convertedBlob
    );
  }
}

// --- Lógica de Límite de Conversiones y Anuncios ---

function updateConversionCounterUI() {
  const totalAllowed =
    CONFIG.MAX_FREE_CONVERSIONS +
    adsWatchedToday * CONFIG.CONVERSIONS_PER_AD_WATCH;
  if (DOMElements.conversionCounterDisplay) {
    DOMElements.conversionCounterDisplay.textContent = `Conversiones gratuitas restantes: ${Math.max(
      0,
      totalAllowed - conversionsToday
    )}/${totalAllowed}`;
  }
}

function checkConversionLimit() {
  const totalAllowed =
    CONFIG.MAX_FREE_CONVERSIONS +
    adsWatchedToday * CONFIG.CONVERSIONS_PER_AD_WATCH;
  if (conversionsToday >= totalAllowed) {
    if (DOMElements.convertBtn) {
      DOMElements.convertBtn.disabled = true;
      DOMElements.convertBtn.classList.add("disabled-btn");
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
        "Has alcanzado el límite de conversiones gratuitas y de anuncios por hoy. Vuelve mañana para más o considera una suscripción premium.",
        "error",
        10000
      );
    }
  } else {
    if (DOMElements.convertBtn) {
      DOMElements.convertBtn.disabled = false;
      DOMElements.convertBtn.classList.remove("disabled-btn");
    }
    if (DOMElements.watchAdButton)
      DOMElements.watchAdButton.classList.add("hidden");
  }
}

function simulateAdViewing() {
  if (!DOMElements.adModal || !DOMElements.adTimerDisplay) {
    showCustomMessage(
      "Error: Elementos del modal de anuncio no encontrados.",
      "error"
    );
    return;
  }

  DOMElements.adModal.classList.add("show");
  let timer = CONFIG.AD_VIEW_DURATION_SECONDS;
  DOMElements.adTimerDisplay.textContent = `Tiempo restante: ${timer} segundos`;

  if (DOMElements.watchAdButton) {
    DOMElements.watchAdButton.disabled = true;
    DOMElements.watchAdButton.classList.add("opacity-50", "cursor-not-allowed");
  }

  const adInterval = setInterval(() => {
    timer--;
    DOMElements.adTimerDisplay.textContent = `Tiempo restante: ${timer} segundos`;
    if (timer <= 0) {
      clearInterval(adInterval);
      DOMElements.adModal.classList.remove("show");
      adsWatchedToday++;
      savePreferences();
      updateConversionCounterUI();
      checkConversionLimit();
      showCustomMessage(
        `¡Gracias por ver el anuncio! Has recibido +${CONFIG.CONVERSIONS_PER_AD_WATCH} conversiones.`,
        "success",
        3000
      );
    }
  }, 1000);
}

// --- Funciones de Conversión de Imagen ---

function drawImageOnCanvas(img) {
  if (!DOMElements.placeholderText || !DOMElements.imageCanvas || !ctx) return;

  DOMElements.placeholderText.classList.add("hidden");

  DOMElements.imageCanvas.width = img.width;
  DOMElements.imageCanvas.height = img.height;

  const parentContainer = DOMElements.imageCanvas.parentElement;
  const maxWidth = parentContainer.offsetWidth;
  const maxHeight = parentContainer.offsetHeight;
  let ratio = 1;
  if (img.width > maxWidth) {
    ratio = maxWidth / img.width;
  }
  if (img.height * ratio > maxHeight && img.height * ratio !== 0) {
    ratio = maxHeight / img.height;
  }

  DOMElements.imageCanvas.style.width = `${img.width * ratio}px`;
  DOMElements.imageCanvas.style.height = `${img.height * ratio}px`;

  ctx.clearRect(
    0,
    0,
    DOMElements.imageCanvas.width,
    DOMElements.imageCanvas.height
  );
  ctx.drawImage(img, 0, 0);
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    if (DOMElements.fileNameSpan)
      DOMElements.fileNameSpan.textContent = file.name;
    showCustomMessage("Cargando imagen...", "info", 2000); // Usar la función global
    toggleLoading(true); // Mostrar modal de carga

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        originalImage = img;
        drawImageOnCanvas(originalImage);
        if (DOMElements.convertBtn) {
          DOMElements.convertBtn.disabled = false;
          DOMElements.convertBtn.classList.remove("disabled-btn");
        }
        if (DOMElements.downloadBtn) {
          DOMElements.downloadBtn.disabled = true;
          DOMElements.downloadBtn.classList.add("disabled-btn");
        }
        convertedBlob = null;
        toggleLoading(false); // Ocultar modal de carga
        showCustomMessage("Imagen cargada exitosamente.", "success", 2000);
        checkConversionLimit();
      };
      img.onerror = function () {
        showCustomMessage(
          "No se pudo cargar la imagen. Asegúrate de que es un archivo de imagen válido.",
          "error"
        );
        if (DOMElements.fileNameSpan)
          DOMElements.fileNameSpan.textContent = "Ningún archivo seleccionado";
        originalImage = null;
        convertedBlob = null;
        if (DOMElements.convertBtn) {
          DOMElements.convertBtn.disabled = true;
          DOMElements.convertBtn.classList.add("disabled-btn");
        }
        if (DOMElements.downloadBtn) {
          DOMElements.downloadBtn.disabled = true;
          DOMElements.downloadBtn.classList.add("disabled-btn");
        }
        if (DOMElements.placeholderText)
          DOMElements.placeholderText.classList.remove("hidden");
        if (ctx && DOMElements.imageCanvas)
          ctx.clearRect(
            0,
            0,
            DOMElements.imageCanvas.width,
            DOMElements.imageCanvas.height
          );
        if (DOMElements.imageCanvas) {
          DOMElements.imageCanvas.style.width = "";
          DOMElements.imageCanvas.style.height = "";
        }
        toggleLoading(false); // Ocultar modal de carga
        checkConversionLimit();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    if (DOMElements.fileNameSpan)
      DOMElements.fileNameSpan.textContent = "Ningún archivo seleccionado";
    originalImage = null;
    convertedBlob = null;
    if (DOMElements.convertBtn) {
      DOMElements.convertBtn.disabled = true;
      DOMElements.convertBtn.classList.add("disabled-btn");
    }
    if (DOMElements.downloadBtn) {
      DOMElements.downloadBtn.disabled = true;
      DOMElements.downloadBtn.classList.add("disabled-btn");
    }
    if (DOMElements.placeholderText)
      DOMElements.placeholderText.classList.remove("hidden");
    if (ctx && DOMElements.imageCanvas)
      ctx.clearRect(
        0,
        0,
        DOMElements.imageCanvas.width,
        DOMElements.imageCanvas.height
      );
    if (DOMElements.imageCanvas) {
      DOMElements.imageCanvas.style.width = "";
      DOMElements.imageCanvas.style.height = "";
    }
    hideCustomMessage();
  }
}

function convertImage() {
  if (!originalImage) {
    showCustomMessage("Por favor, selecciona una imagen primero.", "error");
    return;
  }
  const totalAllowed =
    CONFIG.MAX_FREE_CONVERSIONS +
    adsWatchedToday * CONFIG.CONVERSIONS_PER_AD_WATCH;
  if (conversionsToday >= totalAllowed) {
    checkConversionLimit();
    return;
  }

  showCustomMessage("Realizando conversión...", "info", 5000);
  toggleLoading(true);

  const targetFormat = DOMElements.outputFormatSelect.value;
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  tempCanvas.width = originalImage.width;
  tempCanvas.height = originalImage.height;

  if (
    targetFormat === "image/jpeg" ||
    targetFormat === "image/bmp" ||
    targetFormat === "image/tiff"
  ) {
    if (
      originalImage.src.startsWith("data:image/png") ||
      originalImage.src.startsWith("data:image/gif") ||
      originalImage.src.startsWith("data:image/webp")
    ) {
      tempCtx.fillStyle = "#ffffff";
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    }
  }

  tempCtx.drawImage(originalImage, 0, 0);

  const quality = 0.9;

  // Manejo de formatos no soportados directamente por toBlob o que requieren consideración
  if (
    targetFormat === "application/pdf" ||
    targetFormat === "image/vnd.adobe.photoshop" ||
    targetFormat === "image/x-raw" ||
    targetFormat === "image/dng" ||
    targetFormat === "image/svg+xml"
  ) {
    showCustomMessage(
      `La conversión a ${targetFormat
        .split("/")[1]
        .toUpperCase()} no es directamente compatible desde el navegador para todos los tipos de imagen sin librerías avanzadas o procesamiento en el servidor. La imagen será convertida a PNG para descarga.`,
      "warning",
      8000
    );
    tempCanvas.toBlob(handleBlobConversion, "image/png", quality); // Se convierte a PNG como fallback
  } else if (
    targetFormat === "image/gif" ||
    targetFormat === "image/bmp" ||
    targetFormat === "image/tiff" ||
    targetFormat === "image/x-icon" ||
    targetFormat === "image/avif" ||
    targetFormat === "image/heif" || // HEIF es complejo de salida
    targetFormat === "image/jp2" ||
    targetFormat === "image/jpx"
  ) {
    showCustomMessage(
      `La conversión a ${targetFormat
        .split("/")[1]
        .toUpperCase()} tiene compatibilidad limitada y puede no funcionar correctamente en todos los navegadores o convertir GIFs a estáticos.`,
      "warning",
      5000
    );
    tempCanvas.toBlob(handleBlobConversion, targetFormat, quality);
  } else {
    // Formatos comunes y bien soportados
    tempCanvas.toBlob(handleBlobConversion, targetFormat, quality);
  }
}

function handleBlobConversion(blob) {
  const targetFormat = DOMElements.outputFormatSelect.value;
  if (blob) {
    convertedBlob = blob;
    if (DOMElements.downloadBtn) {
      DOMElements.downloadBtn.disabled = false;
      DOMElements.downloadBtn.classList.remove("disabled-btn");
    }
    showCustomMessage(
      `Imagen convertida a ${targetFormat.split("/")[1].toUpperCase()}.`,
      "success"
    );

    conversionsToday++;
    savePreferences();
    updateConversionCounterUI();
    checkConversionLimit();
  } else {
    showCustomMessage(
      `Error al convertir la imagen a ${targetFormat
        .split("/")[1]
        .toUpperCase()}. Es posible que su navegador no admita este formato de salida o la conversión falló.`,
      "error"
    );
  }
  toggleLoading(false); // Ocultar el modal de carga
}

function downloadImageFromBlob() {
  if (!convertedBlob) {
    showCustomMessage("No hay imagen convertida para descargar.", "error");
    return;
  }

  const url = URL.createObjectURL(convertedBlob);
  const a = document.createElement("a");
  a.href = url;

  const originalFileName =
    DOMElements.fileNameSpan && DOMElements.fileNameSpan.textContent
      ? DOMElements.fileNameSpan.textContent.split(".")[0]
      : "imagen";

  let extension = DOMElements.outputFormatSelect.value.split("/")[1];
  if (extension === "jpeg") {
    extension = "jpg";
  } else if (extension === "x-icon") {
    extension = "ico";
  } else if (extension === "tiff") {
    extension = "tif";
  } else if (extension === "svg+xml") {
    extension = "svg";
  } else if (extension === "vnd.adobe.photoshop") {
    extension = "psd";
  } else if (extension === "x-raw") {
    extension = "raw";
  } else if (extension === "dng") {
    extension = "dng";
  } else if (extension === "heif") {
    extension = "heif";
  } else if (extension === "avif") {
    extension = "avif";
  } else if (extension === "jp2") {
    extension = "jp2";
  } else if (extension === "jpx") {
    extension = "jpx";
  } else if (extension === "pdf") {
    extension = "pdf";
  }

  a.download = `${originalFileName}_convertido.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- Preferencias y Almacenamiento Local (LocalStorage) ---

function savePreferences() {
  localStorage.setItem("conversionsToday", conversionsToday);
  localStorage.setItem("adsWatchedToday", adsWatchedToday);
  localStorage.setItem("lastActivityDate", new Date().toDateString());
}

function loadPreferences() {
  const storedConversionsToday = localStorage.getItem("conversionsToday");
  const storedAdsWatchedToday = localStorage.getItem("adsWatchedToday");
  const storedLastActivityDate = localStorage.getItem("lastActivityDate");
  const today = new Date().toDateString();

  if (storedLastActivityDate !== today) {
    conversionsToday = 0;
    adsWatchedToday = 0;
    localStorage.setItem("lastActivityDate", today);
    localStorage.setItem("conversionsToday", 0);
    localStorage.setItem("adsWatchedToday", 0);
  } else {
    conversionsToday = parseInt(storedConversionsToday || "0");
    adsWatchedToday = parseInt(storedAdsWatchedToday || "0");
  }
  updateConversionCounterUI();
  checkConversionLimit();
}

// --- Lógica del FAQ (Copada de ia-text/script.js) ---
const setupFaqToggle = () => {
  console.log("Setting up FAQ toggles..."); // Depuración: Confirmar que la función se ejecuta
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");
    const arrow = item.querySelector(".faq-arrow");

    // Solo añadir el listener si todos los elementos existen
    if (question && answer && arrow) {
      // Initialize state: Ensure maxHeight is 0 and overflow is hidden, and padding is 0.
      // This is crucial to ensure 'isOpen' check works reliably.
      // We do this here directly on the style object to ensure JS has control.
      answer.style.maxHeight = "0px";
      answer.style.paddingTop = "0px";
      answer.style.paddingBottom = "0px";
      // overflow: hidden ya está en CSS, pero lo aseguramos

      question.addEventListener("click", () => {
        console.log("FAQ question clicked!"); // Depuración: Confirmar clic

        // Determine if it's currently open based on maxHeight
        // Check computed style to be robust against initial CSS values
        const currentMaxHeight = getComputedStyle(answer).maxHeight;
        const isOpen = currentMaxHeight !== "0px";
        console.log(
          "Current isOpen state:",
          isOpen,
          "computed maxHeight:",
          currentMaxHeight
        ); // Depuración

        // Close all other open FAQs
        faqItems.forEach((otherItem) => {
          if (otherItem !== item) {
            const otherAnswer = otherItem.querySelector(".faq-answer");
            const otherArrow = otherItem.querySelector(".faq-arrow");
            if (
              otherAnswer &&
              otherArrow &&
              getComputedStyle(otherAnswer).maxHeight !== "0px"
            ) {
              console.log("Closing other FAQ.");
              otherAnswer.style.maxHeight = "0px";
              otherAnswer.style.paddingTop = "0px";
              otherAnswer.style.paddingBottom = "0px";
              otherArrow.classList.remove("rotated");
            }
          }
        });

        // Toggle the current FAQ
        if (isOpen) {
          console.log("Attempting to close current FAQ.");
          answer.style.maxHeight = "0px";
          answer.style.paddingTop = "0px"; // Reset padding
          answer.style.paddingBottom = "0px"; // Reset padding
          arrow.classList.remove("rotated");
        } else {
          console.log("Attempting to open current FAQ.");
          // Temporarily set max-height to 'auto' to get the true scrollHeight
          // and apply paddings to ensure they are included in scrollHeight calculation
          answer.style.maxHeight = "auto";
          answer.style.paddingTop = "1.5rem"; // Apply target padding for calculation
          answer.style.paddingBottom = "2rem"; // Apply target padding for calculation

          // Force reflow to get correct scrollHeight immediately
          void answer.offsetWidth; // This forces a reflow

          const scrollHeight = answer.scrollHeight;
          console.log("Calculated scrollHeight:", scrollHeight); // Depuración: Ver el scrollHeight calculado

          // Set max-height to the calculated scrollHeight
          answer.style.maxHeight = scrollHeight + "px";

          arrow.classList.add("rotated");
        }
      });
    } else {
      console.warn(
        "Elementos FAQ no encontrados para un item. Asegúrate que las clases .faq-question, .faq-answer, .faq-arrow existen dentro de .faq-item.",
        item
      );
    }
  });
};

// --- Inicialización Principal (DOMContentLoaded) ---
document.addEventListener("DOMContentLoaded", function () {
  console.log("convert-img/script.js DOMContentLoaded fired."); // Depuración
  // Asegurarse de que DOMElements ya esté declarado globalmente en global.js
  if (typeof DOMElements === "undefined") {
    console.error(
      "DOMElements no está declarado. Asegúrate de que global.js se cargue primero y declare 'let DOMElements = {};'"
    );
    window.DOMElements = {}; // Fallback para evitar errores, pero indica un problema de carga.
  }

  // Asignar elementos DOM al inicio de DOMContentLoaded
  // Es crucial que estos IDs existan en el HTML
  Object.assign(DOMElements, {
    // Convertidor específico
    imageUpload: document.getElementById("imageUpload"),
    fileNameSpan: document.getElementById("fileName"),
    imageCanvas: document.getElementById("imageCanvas"),
    placeholderText: document.getElementById("placeholderText"),
    outputFormatSelect: document.getElementById("outputFormat"),
    convertBtn: document.getElementById("convertBtn"),
    downloadBtn: document.getElementById("downloadBtn"),
    conversionCounterDisplay: document.getElementById(
      "conversionCounterDisplay"
    ),
    watchAdButton: document.getElementById("watchAdButton"),

    // Elementos del modal de carga global (DEBEN EXISTIR EN EL HTML)
    loadingOverlayModal: document.getElementById("loadingOverlayModal"),
    pocoyoGifModal: document.getElementById("pocoyoGifModal"),
    loadingSpinnerModal: document.getElementById("loadingSpinnerModal"),
    loadingMessageTextModal: document.getElementById("loadingMessageTextModal"),
    loadingErrorTextModal: document.getElementById("loadingErrorTextModal"),
    loadingModalCloseButton: document.getElementById("loadingModalCloseButton"),

    // AdModal (DEBEN EXISTIR EN EL HTML)
    adModal: document.getElementById("adModal"),
    adTimerDisplay: document.getElementById("adTimer"),

    // MessageModal (DEBEN EXISTIR EN EL HTML)
    messageModal: document.getElementById("messageModal"),
    messageModalContent: document.getElementById("messageModalContent"),
    messageModalCloseButton: document.getElementById("messageModalCloseButton"),
    messageModalText: document.getElementById("messageModalText"),
    messageModalIcon: document.getElementById("messageModalIcon"),

    // Elemento para arrastrar y soltar (la etiqueta del input de archivo)
    fileInputArea: document.querySelector('label[for="imageUpload"]'),
  });

  // Asignar contexto del canvas una vez que el elemento esté en DOMElements
  if (DOMElements.imageCanvas) {
    ctx = DOMElements.imageCanvas.getContext("2d");
  } else {
    console.error(
      "Error: Canvas element not found! Conversion functionality might be limited."
    );
  }

  // Cargar preferencias de conversiones al inicio
  loadPreferences();

  // --- Event Listeners ESPECÍFICOS DEL MÓDULO ---

  // Input de archivo y arrastrar/soltar
  if (DOMElements.imageUpload)
    DOMElements.imageUpload.addEventListener("change", handleImageUpload);
  if (DOMElements.fileInputArea) {
    DOMElements.fileInputArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      DOMElements.fileInputArea.classList.add("border-cyan-500", "bg-gray-700");
    });
    DOMElements.fileInputArea.addEventListener("dragleave", (e) => {
      e.preventDefault();
      DOMElements.fileInputArea.classList.remove(
        "border-cyan-500",
        "bg-gray-700"
      );
    });
    DOMElements.fileInputArea.addEventListener("drop", (e) => {
      e.preventDefault();
      DOMElements.fileInputArea.classList.remove(
        "border-cyan-500",
        "bg-gray-700"
      );
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        DOMElements.imageUpload.files = files;
        DOMElements.imageUpload.dispatchEvent(new Event("change"));
      }
    });
  }

  // Controles de conversión
  if (DOMElements.outputFormatSelect)
    DOMElements.outputFormatSelect.addEventListener("change", function () {
      if (convertedBlob) {
        DOMElements.downloadBtn.disabled = false;
        DOMElements.downloadBtn.classList.remove("disabled-btn");
      }
      const selectedValue = this.value;
      if (
        selectedValue === "image/gif" ||
        selectedValue === "image/bmp" ||
        selectedValue === "image/tiff" ||
        selectedValue === "image/x-icon" ||
        selectedValue === "application/pdf" ||
        selectedValue === "image/vnd.adobe.photoshop" ||
        selectedValue === "image/x-raw" ||
        selectedValue === "image/dng" ||
        selectedValue === "image/svg+xml" ||
        selectedValue === "image/heif" ||
        selectedValue === "image/avif" ||
        selectedValue === "image/jp2" ||
        selectedValue === "image/jpx"
      ) {
        let formatName = selectedValue.split("/")[1].toUpperCase();
        if (formatName === "X-ICON") formatName = "ICO";
        else if (formatName === "VND.ADOBE.PHOTOSHOP") formatName = "PSD";
        else if (formatName === "X-RAW") formatName = "RAW";
        else if (formatName === "SVG+XML") formatName = "SVG";
        else if (formatName === "JP2") formatName = "JPEG 2000 (JP2)";
        else if (formatName === "JPX") formatName = "JPEG 2000 (JPX)";

        showCustomMessage(
          `La conversión a ${formatName} tiene compatibilidad limitada o requiere librerías/servidor. Es posible que el navegador no soporte la salida directa, o que GIFs animados se conviertan a estáticos.`,
          "warning",
          8000
        );
      } else {
        hideCustomMessage();
      }
    });
  if (DOMElements.convertBtn)
    DOMElements.convertBtn.addEventListener("click", convertImage);
  if (DOMElements.downloadBtn)
    DOMElements.downloadBtn.addEventListener("click", downloadImageFromBlob);

  // Límite de conversiones y anuncios
  if (DOMElements.watchAdButton)
    DOMElements.watchAdButton.addEventListener("click", simulateAdViewing);

  // Listener para cerrar el modal de carga/error manualmente
  if (DOMElements.loadingModalCloseButton) {
    DOMElements.loadingModalCloseButton.addEventListener(
      "click",
      hideLoadingOverlay
    );
  }

  // Inicialización de la lógica de FAQ
  setupFaqToggle(); // ¡Asegurarse de que esta función se llama aquí!
});

// Reajustar canvas al cambiar el tamaño de la ventana
window.addEventListener("resize", () => {
  if (originalImage) {
    drawImageOnCanvas(originalImage);
  }
});
