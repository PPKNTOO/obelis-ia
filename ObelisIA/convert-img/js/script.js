const imageUpload = document.getElementById("imageUpload");
const fileNameSpan = document.getElementById("fileName");
const imageCanvas = document.getElementById("imageCanvas");
const ctx = imageCanvas.getContext("2d");
const placeholderText = document.getElementById("placeholderText");
const outputFormatSelect = document.getElementById("outputFormat");
const convertBtn = document.getElementById("convertBtn");
const downloadBtn = document.getElementById("downloadBtn");
const messageArea = document.getElementById("messageArea");
const loadingSpinner = document.getElementById("loadingSpinner");

// Nuevos elementos del DOM para la lógica de límites y anuncios
const conversionCounterDisplay = document.getElementById(
  "conversionCounterDisplay"
);
const watchAdButton = document.getElementById("watchAdButton");
const adModal = document.getElementById("adModal");
const adTimerDisplay = document.getElementById("adTimer");

// Nuevos elementos del DOM para cookies y suscripción
const cookieConsent = document.getElementById("cookieConsent");
const acceptCookiesButton = document.getElementById("acceptCookiesButton");
const subscriptionModal = document.getElementById("subscriptionModal");
const emailInput = document.getElementById("emailInput");
const subscribeButton = document.getElementById("subscribeButton");
const noThanksButton = document.getElementById("noThanksButton");
const subscriptionModalCloseButton = document.getElementById(
  "subscriptionModalCloseButton"
);

let originalImage = null; // Para almacenar la imagen original cargada
let convertedBlob = null; // Para almacenar el blob de la imagen convertida

// Constantes para la lógica de límite de conversiones
const MAX_FREE_CONVERSIONS = 5;
const CONVERSIONS_PER_AD_WATCH = 3;
const MAX_ADS_PER_DAY = 2; // Limitar cuántos anuncios se pueden ver por día
const AD_VIEW_DURATION_SECONDS = 5; // Duración del anuncio simulado

let conversionsToday = 0;
let adsWatchedToday = 0;
let lastActivityDate = ""; // Para reiniciar los contadores diariamente

// --- Funciones de Utilidad y Mensajes ---

// Función para mostrar mensajes al usuario
function showMessage(text, type) {
  messageArea.textContent = text;
  messageArea.className = `message ${type}`;
  messageArea.classList.remove("hidden");
}

// Función para ocultar mensajes
function hideMessage() {
  messageArea.classList.add("hidden");
}

// Función para mostrar u ocultar el spinner de carga
function toggleLoading(show) {
  loadingSpinner.style.display = show ? "block" : "none";
  convertBtn.disabled = show;
  // Deshabilitar descarga si está cargando o no hay blob convertido
  downloadBtn.disabled = show || !convertedBlob;
  convertBtn.classList.toggle("disabled-btn", show);
  downloadBtn.classList.toggle("disabled-btn", show || !convertedBlob);
  checkConversionLimit(); // Asegurarse de que el estado del botón de conversión se actualice con la carga
}

// --- Lógica de Límite de Conversiones y Anuncios ---

function updateConversionCounterUI() {
  const totalAllowed =
    MAX_FREE_CONVERSIONS + adsWatchedToday * CONVERSIONS_PER_AD_WATCH;
  conversionCounterDisplay.textContent = `Conversiones gratuitas restantes: ${Math.max(
    0,
    totalAllowed - conversionsToday
  )}/${totalAllowed}`;
}

function checkConversionLimit() {
  const totalAllowed =
    MAX_FREE_CONVERSIONS + adsWatchedToday * CONVERSIONS_PER_AD_WATCH;
  if (conversionsToday >= totalAllowed) {
    convertBtn.disabled = true;
    convertBtn.classList.add("disabled-btn");
    if (adsWatchedToday < MAX_ADS_PER_DAY) {
      watchAdButton.classList.remove("hidden");
      watchAdButton.disabled = false;
      watchAdButton.classList.remove("opacity-50", "cursor-not-allowed");
    } else {
      watchAdButton.classList.add("hidden");
      showMessage(
        "Has alcanzado el límite de conversiones gratuitas y de anuncios por hoy. Vuelve mañana para más o considera una suscripción premium.",
        "error"
      );
    }
  } else {
    convertBtn.disabled = false;
    convertBtn.classList.remove("disabled-btn");
    watchAdButton.classList.add("hidden"); // Ocultar el botón de anuncio si hay conversiones disponibles
    hideMessage(); // Ocultar mensajes de límite si se vuelve a tener conversiones
  }
}

function simulateAdViewing() {
  adModal.classList.add("show");
  let timer = AD_VIEW_DURATION_SECONDS;
  adTimerDisplay.textContent = `Tiempo restante: ${timer} segundos`;
  watchAdButton.disabled = true; // Desactivar el botón mientras se "ve" el anuncio
  watchAdButton.classList.add("opacity-50", "cursor-not-allowed");

  const adInterval = setInterval(() => {
    timer--;
    adTimerDisplay.textContent = `Tiempo restante: ${timer} segundos`;
    if (timer <= 0) {
      clearInterval(adInterval);
      adModal.classList.remove("show");
      adsWatchedToday++;
      // Restablece las conversiones disponibles como si hubieras obtenido nuevas
      // En lugar de simplemente sumar, calculamos el nuevo total permitido
      conversionsToday = Math.max(
        0,
        conversionsToday - CONVERSIONS_PER_AD_WATCH
      ); // Resta las que ya usaste para "recargar"
      savePreferences(); // Guarda el contador de anuncios y conversiones
      updateConversionCounterUI();
      checkConversionLimit(); // Vuelve a comprobar el límite para habilitar el botón de convertir
      showMessage(
        `¡Gracias por ver el anuncio! Has recibido +${CONVERSIONS_PER_AD_WATCH} conversiones.`,
        "success"
      );
      setTimeout(() => hideMessage(), 3000); // Ocultar mensaje de bonificación
    }
  }, 1000);
}

// --- Funciones de Dibujo y Conversión de Imagen ---

// Función para dibujar la imagen en el canvas
function drawImageOnCanvas(img) {
  placeholderText.classList.add("hidden"); // Ocultar el texto del placeholder
  // Ajustar el tamaño del canvas para que coincida con la imagen
  imageCanvas.width = img.width;
  imageCanvas.height = img.height;

  // Escalar la imagen si es demasiado grande para el contenedor
  const maxWidth = imageCanvas.parentElement.offsetWidth;
  const maxHeight = imageCanvas.parentElement.offsetHeight;
  let ratio = 1;
  if (img.width > maxWidth) {
    ratio = maxWidth / img.width;
  }
  if (img.height * ratio > maxHeight) {
    ratio = maxHeight / img.height;
  }

  imageCanvas.style.width = `${img.width * ratio}px`;
  imageCanvas.style.height = `${img.height * ratio}px`;

  // Limpiar el canvas antes de dibujar
  ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
  ctx.drawImage(img, 0, 0);
}

// Evento cuando se selecciona un archivo
imageUpload.addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (file) {
    fileNameSpan.textContent = file.name;
    hideMessage();
    toggleLoading(true);

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        originalImage = img; // Guardar la imagen original
        drawImageOnCanvas(originalImage);
        // Habilitar el botón de convertir una vez que la imagen se carga
        convertBtn.disabled = false;
        convertBtn.classList.remove("disabled-btn");
        downloadBtn.disabled = true; // Deshabilitar descarga hasta que se convierta
        downloadBtn.classList.add("disabled-btn");
        convertedBlob = null; // Resetear el blob convertido
        toggleLoading(false);
        checkConversionLimit(); // Verificar el límite después de cargar la imagen
      };
      img.onerror = function () {
        showMessage(
          "No se pudo cargar la imagen. Asegúrate de que es un archivo de imagen válido.",
          "error"
        );
        fileNameSpan.textContent = "Ningún archivo seleccionado";
        originalImage = null;
        convertedBlob = null;
        convertBtn.disabled = true;
        convertBtn.classList.add("disabled-btn");
        downloadBtn.disabled = true;
        downloadBtn.classList.add("disabled-btn");
        placeholderText.classList.remove("hidden");
        ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
        imageCanvas.style.width = "";
        imageCanvas.style.height = "";
        toggleLoading(false);
        checkConversionLimit();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    fileNameSpan.textContent = "Ningún archivo seleccionado";
    originalImage = null;
    convertedBlob = null;
    convertBtn.disabled = true;
    convertBtn.classList.add("disabled-btn");
    downloadBtn.disabled = true;
    downloadBtn.classList.add("disabled-btn");
    placeholderText.classList.remove("hidden");
    ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
    imageCanvas.style.width = "";
    imageCanvas.style.height = "";
    hideMessage();
  }
});

// Evento para arrastrar y soltar
const fileInputArea = document.querySelector(".file-input");
fileInputArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  fileInputArea.classList.add(
    "border-cyan-500",
    "bg-gray-700"
  ); /* Actualizado para el tema oscuro */
});

fileInputArea.addEventListener("dragleave", (e) => {
  e.preventDefault();
  fileInputArea.classList.remove(
    "border-cyan-500",
    "bg-gray-700"
  ); /* Actualizado para el tema oscuro */
});

fileInputArea.addEventListener("drop", (e) => {
  e.preventDefault();
  fileInputArea.classList.remove(
    "border-cyan-500",
    "bg-gray-700"
  ); /* Actualizado para el tema oscuro */
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    imageUpload.files = files; // Asignar los archivos arrastrados al input
    imageUpload.dispatchEvent(new Event("change")); // Disparar el evento change manualmente
  }
});

// Función para manejar la advertencia de compatibilidad
outputFormatSelect.addEventListener("change", function () {
  const selectedValue = this.value;
  if (
    selectedValue === "image/gif" ||
    selectedValue === "image/bmp" ||
    selectedValue === "image/tiff" ||
    selectedValue === "image/x-icon"
  ) {
    showMessage(
      `La conversión a ${selectedValue
        .split("/")[1]
        .toUpperCase()} tiene compatibilidad limitada y puede no funcionar correctamente en todos los navegadores.`,
      "warning"
    );
  } else {
    hideMessage();
  }
});

// Función para convertir la imagen
convertBtn.addEventListener("click", function () {
  if (!originalImage) {
    showMessage("Por favor, selecciona una imagen primero.", "error");
    return;
  }
  // Verificar el límite antes de intentar la conversión
  const totalAllowed =
    MAX_FREE_CONVERSIONS + adsWatchedToday * CONVERSIONS_PER_AD_WATCH;
  if (conversionsToday >= totalAllowed) {
    checkConversionLimit(); // Vuelve a mostrar el mensaje de límite si es necesario
    return;
  }

  hideMessage(); // Oculta mensajes anteriores
  toggleLoading(true);

  const targetFormat = outputFormatSelect.value;
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  tempCanvas.width = originalImage.width;
  tempCanvas.height = originalImage.height;

  // Manejar la conversión de RGBA (transparencia) a RGB para JPEG/BMP/TIFF (que no soportan transparencia o es complejo)
  if (
    targetFormat === "image/jpeg" ||
    targetFormat === "image/bmp" ||
    targetFormat === "image/tiff"
  ) {
    // Si la imagen original tiene transparencia (ej. PNG, GIF, WebP con alfa), se dibuja sobre un fondo blanco
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

  // Determinar la calidad solo para JPEG y WebP
  let quality = 0.9;
  if (targetFormat === "image/jpeg" || targetFormat === "image/webp") {
    quality = 0.9; // Mantener la calidad en 90%
  }

  try {
    tempCanvas.toBlob(
      function (blob) {
        if (blob) {
          convertedBlob = blob;
          downloadBtn.disabled = false;
          downloadBtn.classList.remove("disabled-btn");
          showMessage(
            `Imagen convertida a ${targetFormat.split("/")[1].toUpperCase()}.`,
            "success"
          );

          // Solo incrementa el contador si la conversión fue exitosa
          conversionsToday++;
          savePreferences(); // Guarda el nuevo contador
          updateConversionCounterUI(); // Actualiza la UI
          checkConversionLimit(); // Vuelve a verificar si se alcanzó el límite
        } else {
          // Esto puede ocurrir si el navegador no soporta el formato de salida
          showMessage(
            `Error al convertir la imagen a ${targetFormat
              .split("/")[1]
              .toUpperCase()}. Es posible que su navegador no admita este formato de salida o la conversión falló.`,
            "error"
          );
        }
        toggleLoading(false);
      },
      targetFormat,
      quality
    );
  } catch (error) {
    // Capturar errores que puedan ocurrir durante toBlob si el formato no es compatible
    showMessage(
      `Error grave al intentar convertir a ${targetFormat
        .split("/")[1]
        .toUpperCase()}: ${
        error.message
      }. Este formato puede no ser soportado por su navegador.`,
      "error"
    );
    toggleLoading(false);
  }
});

// Función para descargar la imagen
downloadBtn.addEventListener("click", function () {
  if (convertedBlob) {
    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement("a");
    a.href = url;
    const originalFileName = fileNameSpan.textContent.split(".")[0];
    let extension = outputFormatSelect.value.split("/")[1];
    // Ajustar la extensión para JPEG si el MIME type es 'jpeg'
    if (extension === "jpeg") {
      extension = "jpg";
    } else if (extension === "x-icon") {
      // Para ICO
      extension = "ico";
    } else if (extension === "tiff") {
      // Para TIFF
      extension = "tif"; // o tiff, pero .tif es común
    }
    a.download = `${originalFileName}_convertido.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Liberar el objeto URL
  } else {
    showMessage("No hay imagen convertida para descargar.", "error");
  }
});

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
    // Reiniciar contadores si es un nuevo día
    conversionsToday = 0;
    adsWatchedToday = 0;
    localStorage.setItem("lastActivityDate", today);
    localStorage.setItem("conversionsToday", 0);
    localStorage.setItem("adsWatchedToday", 0);
  } else {
    conversionsToday = parseInt(storedConversionsToday || "0");
    adsWatchedToday = parseInt(storedAdsWatchedToday || "0");
  }
  updateConversionCounterUI(); // Actualizar la UI al cargar
  checkConversionLimit(); // Verificar el límite al cargar
}

// --- Lógica de Cookies y Suscripción ---

function showCookieConsent() {
  if (!localStorage.getItem("cookieAccepted")) {
    cookieConsent.classList.add("show");
  }
}

function acceptCookies() {
  localStorage.setItem("cookieAccepted", "true");
  cookieConsent.classList.remove("show");
  // Mostrar modal de suscripción después de aceptar cookies, si no se ha suscrito o dicho "no gracias"
  if (
    !localStorage.getItem("subscribed") &&
    !localStorage.getItem("noThanksSubscription")
  ) {
    showSubscriptionModal();
  }
}

function showSubscriptionModal() {
  subscriptionModal.classList.add("show");
}

function handleSubscription() {
  const email = emailInput.value.trim();
  if (email) {
    // Aquí iría la lógica real para enviar el email a un servidor
    console.log("Correo suscrito:", email);
    localStorage.setItem("subscribed", "true");
    subscriptionModal.classList.remove("show");
    showMessage("¡Gracias por suscribirte!", "success");
  } else {
    showMessage("Por favor, introduce un correo electrónico válido.", "error");
  }
}

function dismissSubscription() {
  localStorage.setItem("noThanksSubscription", "true");
  subscriptionModal.classList.remove("show");
}

// --- Event Listeners y Carga Inicial ---

// Inicializar el estado de los botones al cargar la página
window.onload = function () {
  convertBtn.disabled = true;
  convertBtn.classList.add("disabled-btn");
  downloadBtn.disabled = true;
  downloadBtn.classList.add("disabled-btn");
  placeholderText.classList.remove("hidden");

  loadPreferences(); // Cargar preferencias de conversiones al inicio
  showCookieConsent(); // Mostrar el mensaje de cookies al cargar la página
};

// Asegurar que el canvas se redibuje y ajuste al tamaño de la ventana si se cambia el tamaño
window.addEventListener("resize", () => {
  if (originalImage) {
    drawImageOnCanvas(originalImage);
  }
});

// Event listeners para los nuevos elementos
watchAdButton.addEventListener("click", simulateAdViewing);
acceptCookiesButton.addEventListener("click", acceptCookies);
subscribeButton.addEventListener("click", handleSubscription);
noThanksButton.addEventListener("click", dismissSubscription);
subscriptionModalCloseButton.addEventListener("click", dismissSubscription);

// Cerrar el modal de suscripción al hacer clic fuera de él
subscriptionModal.addEventListener("click", (event) => {
  if (event.target === subscriptionModal) {
    dismissSubscription();
  }
});
