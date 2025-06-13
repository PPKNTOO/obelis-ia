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

// --- FUNCIONES DE UTILIDAD Y MENSAJES (Las funciones showMessage y hideMessage se han movido a global.js como showCustomMessage y hideCustomMessage) ---

function toggleLoading(show) {
  if (DOMElements.loadingSpinner)
    DOMElements.loadingSpinner.style.display = show ? "block" : "none";

  // Deshabilitar/Habilitar todos los controles
  const allControls = document.querySelectorAll(
    'button, input[type="file"], select, label[for="imageUpload"]'
  );
  allControls.forEach((control) => {
    if (control.id === "imageUpload" || control.id === "fileInputArea") {
      control.disabled = false; // Siempre se puede cargar una imagen
    } else if (control.id === "watchAdButton") {
      control.disabled = show; // Deshabilitar durante la carga general
      control.classList.toggle("disabled-btn", show);
    } else {
      control.disabled = show;
      control.classList.toggle("disabled-btn", show);
    }
  });

  // Habilitar/deshabilitar botones de convertir y descargar según el estado de carga y blob
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

  checkConversionLimit(); // Re-evaluar límites después de cambiar el estado de carga
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
    // Si el mensaje de límite estaba activo y ahora hay conversiones disponibles, ocúltalo
    if (
      DOMElements.messageArea &&
      DOMElements.messageArea.textContent.includes("límite de conversiones")
    ) {
      hideCustomMessage(); // Usar la función global
    }
  }
}

function simulateAdViewing() {
  if (!DOMElements.adModal || !DOMElements.adTimerDisplay) return;

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
    hideCustomMessage(); // Usar la función global
    toggleLoading(true);

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
        toggleLoading(false);
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
        toggleLoading(false);
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
    hideCustomMessage(); // Usar la función global
  }
}

function convertImage() {
  if (!originalImage) {
    showCustomMessage("Por favor, selecciona una imagen primero.", "error"); // Usar la función global
    return;
  }
  const totalAllowed =
    CONFIG.MAX_FREE_CONVERSIONS +
    adsWatchedToday * CONFIG.CONVERSIONS_PER_AD_WATCH;
  if (conversionsToday >= totalAllowed) {
    checkConversionLimit();
    return;
  }

  hideCustomMessage(); // Usar la función global
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
    tempCanvas.toBlob(handleBlobConversion, "image/png", quality);
  } else if (
    targetFormat === "image/gif" ||
    targetFormat === "image/bmp" ||
    targetFormat === "image/tiff" ||
    targetFormat === "image/x-icon" ||
    targetFormat === "image/avif" ||
    targetFormat === "image/heif" ||
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
    ); // Usar la función global

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
    ); // Usar la función global
  }
  toggleLoading(false);
}

function downloadImageFromBlob() {
  if (!convertedBlob) {
    showCustomMessage("No hay imagen convertida para descargar.", "error"); // Usar la función global
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

// --- Lógica de Cookies y Suscripción (ELIMINADAS - AHORA EN GLOBAL.JS) ---
// showCookieConsent ya no está aquí
// acceptCookies ya no está aquí
// showSubscriptionModal ya no está aquí
// handleSubscription ya no está aquí
// dismissSubscription ya no está aquí

// --- Lógica del Menú Desplegable (para la navbar responsive - ELIMINADA - AHORA EN GLOBAL.JS) ---
// setupDropdown ya no está aquí
// updateActiveClass ya no está aquí

// --- Inicialización Principal (DOMContentLoaded) ---
document.addEventListener("DOMContentLoaded", function () {
  // Asignar elementos DOM al inicio de DOMContentLoaded
  // ¡¡IMPORTANTE!! Usa Object.assign para fusionar con el DOMElements global
  Object.assign(DOMElements, {
    // Conversor específico
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
    adModal: document.getElementById("adModal"),
    adTimerDisplay: document.getElementById("adTimer"),

    // Modales y mensajes generales (Eliminados de aquí si ya están en global.js)
    messageArea: document.getElementById("messageArea"), // Si este es único para convert-img
    loadingSpinner: document.getElementById("loadingSpinner"), // Si este es único para convert-img
    // cookieConsent: document.getElementById("cookieConsent"), // ELIMINADO
    // acceptCookiesButton: document.getElementById("acceptCookiesButton"), // ELIMINADO
    // subscriptionModal: document.getElementById("subscriptionModal"), // ELIMINADO
    // emailInput: document.getElementById("emailInput"), // ELIMINADO
    // subscribeButton: document.getElementById("subscribeButton"), // ELIMINADO
    // noThanksButton: document.getElementById("noThanksButton"), // ELIMINADO
    // subscriptionModalCloseButton: document.getElementById("subscriptionModalCloseButton"), // ELIMINADO
    // messageModal: document.getElementById("messageModal"), // ELIMINADO
    // messageModalCloseButton: document.getElementById("messageModalCloseButton"), // ELIMINADO
    // messageModalText: document.getElementById("messageModalText"), // ELIMINADO
    // messageModalIcon: document.getElementById("messageModalIcon"), // ELIMINADO

    // Navbar general (Eliminados de aquí si ya están en global.js)
    // mainNavbar: document.getElementById("main-navbar"), // ELIMINADO
    // menuToggle: document.getElementById("menuToggle"), // ELIMINADO
    // navLinksContainer: document.querySelector(".navbar-inner-content .flex-wrap"), // ELIMINADO
  });

  // Asignar contexto del canvas una vez que el elemento esté en DOMElements
  if (DOMElements.imageCanvas) {
    ctx = DOMElements.imageCanvas.getContext("2d");
  } else {
    console.error("Error: Canvas element not found!");
    return;
  }

  // Cargar preferencias de conversiones al inicio
  loadPreferences();
  // Mostrar el mensaje de cookies al cargar la página (ELIMINADO - Ahora global.js lo maneja)
  // showCookieConsent();

  // --- Event Listeners ESPECÍFICOS DEL MÓDULO ---

  // Input de archivo y arrastrar/soltar
  if (DOMElements.imageUpload)
    DOMElements.imageUpload.addEventListener("change", handleImageUpload);
  if (DOMElements.fileInputArea) {
    // Asegúrate que el elemento fileInputArea existe
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
        hideCustomMessage(); // Usar la función global
      }
    });
  if (DOMElements.convertBtn)
    DOMElements.convertBtn.addEventListener("click", convertImage);
  if (DOMElements.downloadBtn)
    DOMElements.downloadBtn.addEventListener("click", downloadImageFromBlob);

  // Límite de conversiones y anuncios
  if (DOMElements.watchAdButton)
    DOMElements.watchAdButton.addEventListener("click", simulateAdViewing);

  // Modales de cookies y suscripción (ELIMINADOS - Ahora global.js los maneja)
  // if (DOMElements.acceptCookiesButton) DOMElements.acceptCookiesButton.addEventListener("click", acceptCookies);
  // if (DOMElements.subscribeButton) DOMElements.subscribeButton.addEventListener("click", handleSubscription);
  // if (DOMElements.noThanksButton) DOMElements.noThanksButton.addEventListener("click", dismissSubscription);
  // if (DOMElements.subscriptionModalCloseButton) DOMElements.subscriptionModalCloseButton.addEventListener("click", dismissSubscription);
  // if (DOMElements.subscriptionModal) DOMElements.subscriptionModal.addEventListener("click", (event) => {
  //   if (event.target === DOMElements.subscriptionModal) { dismissSubscription(); }
  // });

  // Generic Message Modal (ELIMINADOS - Ahora global.js los maneja)
  // if (DOMElements.messageModalCloseButton) DOMElements.messageModalCloseButton.addEventListener("click", hideMessage);
  // if (DOMElements.messageModal) DOMElements.messageModal.addEventListener("click", (event) => {
  //   if (event.target === DOMElements.messageModal) { hideMessage(); }
  // });

  // Navegación responsive (ELIMINADOS - Ahora global.js los maneja)
  // if (DOMElements.menuToggle && DOMElements.navLinksContainer) { /* ... */ }

  // Actualizar la clase activa de la navegación al cargar la página (ELIMINADO - Ahora global.js lo maneja)
  // updateActiveClass();
});

// Reajustar canvas al cambiar el tamaño de la ventana
window.addEventListener("resize", () => {
  if (originalImage) {
    drawImageOnCanvas(originalImage);
  }
});
