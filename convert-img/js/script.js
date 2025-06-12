// js/script.js

(function () {
  // IIFE para encapsular todo el código y asegurar el ámbito y hoisting
  // --- Constantes de Configuración ---
  const CONFIG = {
    MAX_FREE_CONVERSIONS: 5,
    CONVERSIONS_PER_AD_WATCH: 3,
    AD_VIEW_DURATION_SECONDS: 5, // Duración del anuncio simulado
    MAX_ADS_PER_DAY: 2, // Límite de anuncios por día
  };

  // --- Variables de Estado Globales ---
  let originalImage = null; // Para almacenar la imagen original cargada
  let convertedBlob = null; // Para almacenar el blob de la imagen convertida

  let conversionsToday = 0;
  let adsWatchedToday = 0;
  let lastActivityDate = ""; // Para reiniciar los contadores diariamente

  // --- DOMElements (se inicializará en DOMContentLoaded) ---
  let DOMElements;

  // --- editorCtx (contexto del canvas, usado en este script) ---
  let ctx;

  // --- FUNCIONES DE UTILIDAD Y MENSAJES ---

  function showMessage(text, type, duration = 4000) {
    if (!DOMElements || !DOMElements.messageArea) {
      console.warn("Message area not found, cannot display message:", text);
      return;
    }
    DOMElements.messageArea.textContent = text;
    DOMElements.messageArea.className = `message ${type}`;
    DOMElements.messageArea.classList.remove("hidden");
    if (type !== "error") {
      setTimeout(() => {
        hideMessage();
      }, duration);
    }
  }

  function hideMessage() {
    if (DOMElements.messageArea) {
      DOMElements.messageArea.classList.add("hidden");
    }
  }

  function toggleLoading(show) {
    if (DOMElements.loadingSpinner)
      DOMElements.loadingSpinner.style.display = show ? "block" : "none";

    // Deshabilitar/Habilitar todos los controles
    const allControls = document.querySelectorAll(
      'button, input[type="file"], select, label[for="imageUpload"]'
    );
    allControls.forEach((control) => {
      if (control.id === "imageUpload" || control.id === "fileInputArea") {
        // fileInputArea es la etiqueta label
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
        showMessage(
          "Has alcanzado el límite de conversiones gratuitas y de anuncios por hoy. Vuelve mañana para más o considera una suscripción premium.",
          "error",
          10000 // Mensaje más largo
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
        hideMessage();
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
        // Recarga conversiones. Podríamos dar X conversiones nuevas o reajustar el contador.
        // Aquí, simplemente permitimos que `checkConversionLimit` re-evalúe.
        savePreferences();
        updateConversionCounterUI();
        checkConversionLimit();
        showMessage(
          `¡Gracias por ver el anuncio! Has recibido +${CONFIG.CONVERSIONS_PER_AD_WATCH} conversiones.`,
          "success",
          3000
        );
      }
    }, 1000);
  }

  // --- Funciones de Conversión de Imagen ---

  function drawImageOnCanvas(img) {
    if (!DOMElements.placeholderText || !DOMElements.imageCanvas || !ctx)
      return;

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
      hideMessage();
      toggleLoading(true);

      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
          originalImage = img;
          drawImageOnCanvas(originalImage);
          // Habilitar el botón de convertir una vez que la imagen se carga
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
          showMessage(
            "No se pudo cargar la imagen. Asegúrate de que es un archivo de imagen válido.",
            "error"
          );
          if (DOMElements.fileNameSpan)
            DOMElements.fileNameSpan.textContent =
              "Ningún archivo seleccionado";
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
      hideMessage();
    }
  }

  function convertImage() {
    if (!originalImage) {
      showMessage("Por favor, selecciona una imagen primero.", "error");
      return;
    }
    const totalAllowed =
      CONFIG.MAX_FREE_CONVERSIONS +
      adsWatchedToday * CONFIG.CONVERSIONS_PER_AD_WATCH;
    if (conversionsToday >= totalAllowed) {
      checkConversionLimit();
      return;
    }

    hideMessage();
    toggleLoading(true);

    const targetFormat = DOMElements.outputFormatSelect.value;
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = originalImage.width;
    tempCanvas.height = originalImage.height;

    // Manejar la conversión de RGBA (transparencia) a RGB para formatos que no soportan transparencia o es complejo
    if (
      targetFormat === "image/jpeg" ||
      targetFormat === "image/bmp" ||
      targetFormat === "image/tiff"
    ) {
      // Si la imagen original tiene transparencia, se dibuja sobre un fondo blanco
      // Esto es para evitar problemas de transparencia o color negro en formatos que no la manejan bien
      if (
        originalImage.src.startsWith("data:image/png") ||
        originalImage.src.startsWith("data:image/gif") ||
        originalImage.src.startsWith("data:image/webp")
      ) {
        tempCtx.fillStyle = "#ffffff"; // Fondo blanco
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      }
    }

    tempCtx.drawImage(originalImage, 0, 0);

    // Calidad para formatos JPEG y WebP
    const quality = 0.9; // 90% de calidad

    // Manejo de formatos de salida
    if (
      targetFormat === "application/pdf" || // PDF
      targetFormat === "image/vnd.adobe.photoshop" || // PSD
      targetFormat === "image/x-raw" || // RAW (entrada, no salida directa)
      targetFormat === "image/dng" || // DNG (entrada, no salida directa)
      targetFormat === "image/svg+xml" // SVG
    ) {
      showMessage(
        `La conversión a ${targetFormat
          .split("/")[1]
          .toUpperCase()} no es directamente compatible desde el navegador para todos los tipos de imagen sin librerías avanzadas o procesamiento en el servidor. La imagen será convertida a PNG para descarga.`,
        "warning",
        8000
      );
      // Intenta convertir a PNG como fallback si no se soporta el formato
      tempCanvas.toBlob(handleBlobConversion, "image/png", quality);
    } else if (
      targetFormat === "image/gif" ||
      targetFormat === "image/bmp" ||
      targetFormat === "image/tiff" ||
      targetFormat === "image/x-icon" || // ICO
      targetFormat === "image/avif" || // AVIF
      targetFormat === "image/heif" || // HEIF
      targetFormat === "image/jp2" || // JPEG 2000 (JP2)
      targetFormat === "image/jpx" // JPEG 2000 (JPX)
    ) {
      // Estos formatos pueden tener soporte limitado o no ser directamente generables por toBlob en todos los navegadores
      // La API toBlob es la forma más estándar, pero su éxito depende del navegador.
      showMessage(
        `La conversión a ${targetFormat
          .split("/")[1]
          .toUpperCase()} tiene compatibilidad limitada y puede no funcionar correctamente en todos los navegadores o convertir GIFs a estáticos.`,
        "warning",
        5000
      );
      tempCanvas.toBlob(handleBlobConversion, targetFormat, quality);
    } else {
      // Formatos comunes y bien soportados (JPEG, PNG, WebP)
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
      showMessage(
        `Imagen convertida a ${targetFormat.split("/")[1].toUpperCase()}.`,
        "success"
      );

      conversionsToday++;
      savePreferences();
      updateConversionCounterUI();
      checkConversionLimit();
    } else {
      showMessage(
        `Error al convertir la imagen a ${targetFormat
          .split("/")[1]
          .toUpperCase()}. Es posible que su navegador no admita este formato de salida o la conversión falló.`,
        "error"
      );
    }
    toggleLoading(false);
  }

  function downloadImageFromBlob() {
    if (!convertedBlob) {
      showMessage("No hay imagen convertida para descargar.", "error");
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
    } else if (extension === "webp") {
      extension = "webp";
    } // Asegurar que WebP tenga extensión correcta
    else if (extension === "gif") {
      extension = "gif";
    } else if (extension === "bmp") {
      extension = "bmp";
    } else if (extension === "avif") {
      extension = "avif";
    } else if (extension === "jp2") {
      extension = "jp2";
    } else if (extension === "jpx") {
      extension = "jpx";
    } else if (extension === "pdf") {
      extension = "pdf";
    } else if (extension === "vnd.adobe.photoshop") {
      extension = "psd";
    } else if (extension === "x-raw") {
      extension = "raw";
    } else if (extension === "dng") {
      extension = "dng";
    } else if (extension === "svg+xml") {
      extension = "svg";
    } // Para SVG

    a.download = `${originalFileName}_convertido.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Liberar el objeto URL
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

  // --- Lógica de Cookies y Suscripción ---

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
    if (
      DOMElements.subscriptionModal &&
      !localStorage.getItem("subscribed") &&
      !localStorage.getItem("noThanksSubscription")
    ) {
      DOMElements.subscriptionModal.classList.add("show");
    }
  }

  function handleSubscription() {
    if (!DOMElements.emailInput) {
      console.error("emailInput no encontrado.");
      showMessage(
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
      showMessage("¡Gracias por suscribirte!", "success");
    } else {
      showMessage(
        "Por favor, introduce un correo electrónico válido.",
        "error"
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
        // Usar .submenu
        if (openDropdown && openDropdown !== dropdown) {
          openDropdown.classList.remove("show");
        }
      });
      dropdown.classList.toggle("show");
    });
  }

  // Función para actualizar la clase 'active-link' de la barra de navegación
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
        span.classList.remove("active-link");
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

  // --- Inicialización Principal (DOMContentLoaded) ---
  document.addEventListener("DOMContentLoaded", function () {
    // Asignar elementos DOM al inicio de DOMContentLoaded
    DOMElements = {
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

      // Modales y mensajes generales
      messageArea: document.getElementById("messageArea"),
      loadingSpinner: document.getElementById("loadingSpinner"), // Aquí es donde el spinner del conversor se definirá.
      cookieConsent: document.getElementById("cookieConsent"),
      acceptCookiesButton: document.getElementById("acceptCookiesButton"),
      subscriptionModal: document.getElementById("subscriptionModal"),
      emailInput: document.getElementById("emailInput"),
      subscribeButton: document.getElementById("subscribeButton"),
      noThanksButton: document.getElementById("noThanksButton"),
      subscriptionModalCloseButton: document.getElementById(
        "subscriptionModalCloseButton"
      ),

      // Navbar general
      mainNavbar: document.getElementById("main-navbar"),
      menuToggle: document.getElementById("menuToggle"),
      navLinksContainer: document.querySelector(
        ".navbar-inner-content .flex-wrap"
      ), // Contenedor de enlaces de la navbar
    };

    // Asignar contexto del canvas una vez que el elemento esté en DOMElements
    if (DOMElements.imageCanvas) {
      ctx = DOMElements.imageCanvas.getContext("2d");
    } else {
      console.error("Error: Canvas element not found!");
      return; // Detener la ejecución si el canvas no se encuentra
    }

    // Cargar preferencias de conversiones al inicio
    loadPreferences();
    // Mostrar el mensaje de cookies al cargar la página
    showCookieConsent();

    // --- Event Listeners ---

    // Input de archivo y arrastrar/soltar
    if (DOMElements.imageUpload)
      DOMElements.imageUpload.addEventListener("change", handleImageUpload);
    if (DOMElements.fileInputArea) {
      // Asegúrate que el elemento fileInputArea existe
      DOMElements.fileInputArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        DOMElements.fileInputArea.classList.add(
          "border-cyan-500",
          "bg-gray-700"
        );
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
        // Actualizar el texto del botón de descarga si el formato cambia
        if (convertedBlob) {
          // Si ya hay una imagen convertida, permitir descargar con el nuevo formato
          DOMElements.downloadBtn.disabled = false;
          DOMElements.downloadBtn.classList.remove("disabled-btn");
        }
        // Mostrar advertencia de compatibilidad
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
          selectedValue === "image/heif" || // Añadidos los nuevos
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

          showMessage(
            `La conversión a ${formatName} tiene compatibilidad limitada o requiere librerías/servidor. Es posible que el navegador no soporte la salida directa, o que GIFs animados se conviertan a estáticos.`,
            "warning",
            8000
          );
        } else {
          hideMessage();
        }
      });
    if (DOMElements.convertBtn)
      DOMElements.convertBtn.addEventListener("click", convertImage);
    if (DOMElements.downloadBtn)
      DOMElements.downloadBtn.addEventListener("click", downloadImageFromBlob);

    // Límite de conversiones y anuncios
    if (DOMElements.watchAdButton)
      DOMElements.watchAdButton.addEventListener("click", simulateAdViewing);

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

    // Generic Message Modal
    if (DOMElements.messageModalCloseButton)
      DOMElements.messageModalCloseButton.addEventListener(
        "click",
        hideMessage
      );
    if (DOMElements.messageModal)
      DOMElements.messageModal.addEventListener("click", (event) => {
        if (event.target === DOMElements.messageModal) {
          hideMessage();
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

  // Reajustar canvas al cambiar el tamaño de la ventana
  window.addEventListener("resize", () => {
    if (originalImage) {
      drawImageOnCanvas(originalImage);
    }
  });
})(); // Cierre de la IIFE
