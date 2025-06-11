// --- 1. Referencias a Elementos del DOM ---
const DOMElements = {
  // Controles principales
  promptInput: document.getElementById("promptInput"),
  generateButton: document.getElementById("generateButton"),
  loadingIndicator: document.getElementById("loadingIndicator"),
  loadingAnimation: document.querySelector(".dancing-figure"), // Muñequito animado
  loadingMessageText: document.getElementById("loadingMessageText"),
  generatedImage: document.getElementById("generatedImage"),
  imagePlaceholderText: document.getElementById("imagePlaceholderText"),
  downloadMainImageButton: document.getElementById("downloadMainImageButton"),

  // Galería
  galleryContainer: document.getElementById("galleryContainer"),
  downloadSelectedButton: document.getElementById("downloadSelectedButton"),
  clearSelectionButton: document.getElementById("clearSelectionButton"),
  deleteSelectedButton: document.getElementById("deleteSelectedButton"),
  downloadMessage: document.getElementById("downloadMessage"),

  // Lightbox
  lightbox: document.getElementById("lightbox"),
  lightboxImage: document.getElementById("lightboxImage"),
  lightboxCloseButton: document.getElementById("lightboxCloseButton"),
  lightboxPrevButton: document.getElementById("lightboxPrevButton"),
  lightboxNextButton: document.getElementById("lightboxNextButton"),
  lightboxThumbnails: document.getElementById("lightboxThumbnails"),

  // Sugerencia de Prompt
  promptSuggestionBox: document.getElementById("promptSuggestionBox"),
  generatePromptSuggestionButton: document.getElementById(
    "generatePromptSuggestionButton"
  ),
  promptSuggestionLoading: document.getElementById("promptSuggestionLoading"),

  // Modales de Usuario
  cookieConsent: document.getElementById("cookieConsent"),
  acceptCookiesButton: document.getElementById("acceptCookiesButton"),
  subscriptionModal: document.getElementById("subscriptionModal"),
  emailInput: document.getElementById("emailInput"),
  subscribeButton: document.getElementById("subscribeButton"),
  noThanksButton: document.getElementById("noThanksButton"),

  // Modal de Mensajes Genérico
  messageModal: document.getElementById("messageModal"),
  messageModalCloseButton: document.getElementById("messageModalCloseButton"),
  messageModalText: document.getElementById("messageModalText"),
  messageModalIcon: document.getElementById("messageModalIcon"),

  // Contador de Generaciones
  generationCounter: document.getElementById("generationCounter"),
  watchAdButton: document.getElementById("watchAdButton"),
};

// --- 2. Constantes de Configuración ---
const CONFIG = {
  API_BASE_URL: "https://image.pollinations.ai/prompt/",
  MAX_RETRIES: 2,
  RETRY_DELAY_MS: 1500,
  TIMEOUT_MS: 10000,
  MAX_GALLERY_IMAGES: 12,
  PROMPT_SUGGESTION_DELAY_SECONDS: 10,
  ObelisIA_LOGO_URL:
    "https://placehold.co/100x40/000000/FFFFFF?text=ObelisIA_Logo", // Reemplazar con la ruta de tu logo local
  MAX_FREE_GENERATIONS: 5,
  GENERATIONS_PER_AD_WATCH: 3,
  FALLBACK_IMAGES: [
    "https://placehold.co/600x400/FFDDC1/E65100?alt=Atardecer+simulado",
    "https://placehold.co/600x400/C8E6C9/2E7D32?alt=Bosque+mágico+simulado",
    "https://placehold.co/600x400/BBDEFB/1976D2?alt=Ciudad+futurista+simulada",
    "https://placehold.co/600x400/F0F4C3/AFB42B?alt=Abstracto+colorido+simulado",
    "https://placehold.co/600x400/EDE7F6/5E35B1?alt=Retrato+surrealista+simulado",
  ],
};

// --- 3. Variables de Estado Globales ---
let freeGenerationsLeft = CONFIG.MAX_FREE_GENERATIONS;
let selectedGalleryImages = new Set();
let currentLightboxIndex = 0;
let fallbackImageIndex = 0; // Para rotar entre las imágenes de fallback

// --- 4. Funciones de Utilidad General ---
/**
 * Descarga una imagen dada su URL.
 * @param {string} imageUrl - La URL de la imagen a descargar.
 * @param {string} filename - El nombre del archivo para la descarga.
 */
function downloadImage(imageUrl, filename = "imagen-generada.png") {
  const link = document.createElement("a");
  link.href = imageUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Muestra un mensaje personalizado en el modal genérico.
 * @param {string} message - El texto del mensaje.
 * @param {'success'|'error'|'info'} type - El tipo de mensaje para el icono.
 * @param {number} duration - Duración en ms antes de ocultar el modal.
 */
function showCustomMessage(message, type = "info", duration = 3000) {
  DOMElements.messageModalText.textContent = message;
  // Configura el icono basado en el tipo
  switch (type) {
    case "success":
      DOMElements.messageModalIcon.textContent = "✔️"; // Unicode checkmark
      DOMElements.messageModalIcon.className = "mt-4 text-4xl success";
      break;
    case "error":
      DOMElements.messageModalIcon.textContent = "❌"; // Unicode X mark
      DOMElements.messageModalIcon.className = "mt-4 text-4xl error";
      break;
    case "info":
    default:
      DOMElements.messageModalIcon.textContent = "💡"; // Unicode lightbulb
      DOMElements.messageModalIcon.className = "mt-4 text-4xl info";
      break;
  }
  DOMElements.messageModal.classList.add("show");

  setTimeout(() => {
    hideCustomMessage();
  }, duration);
}

/** Oculta el modal de mensajes genérico. */
function hideCustomMessage() {
  DOMElements.messageModal.classList.remove("show");
  DOMElements.messageModalText.textContent = "";
  DOMElements.messageModalIcon.textContent = ""; // Limpiar el contenido del icono también
  DOMElements.messageModalIcon.className = "mt-4 text-4xl"; // Resetear clase de icono
}

// --- 5. Funciones de Procesamiento de Imagen (con logo) ---
/**
 * Procesa una imagen añadiendo el logo "ObelisIA" en la esquina inferior derecha.
 * @param {string} imageUrl - La URL de la imagen a procesar.
 * @returns {Promise<string>} - Una promesa que resuelve con la data URL de la imagen procesada.
 */
function processImageWithLogo(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Necesario para evitar problemas de CORS al dibujar en canvas

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      const logo = new Image();
      logo.crossOrigin = "Anonymous"; // Necesario para CORS
      logo.src = CONFIG.ObelisIA_LOGO_URL;

      logo.onload = () => {
        const logoWidth = Math.min(Math.max(100, img.naturalWidth * 0.15), 200);
        const logoHeight = (logo.naturalHeight / logo.naturalWidth) * logoWidth;
        const padding = Math.max(10, img.naturalWidth * 0.02);
        const x = canvas.width - logoWidth - padding;
        const y = canvas.height - logoHeight - padding;

        ctx.drawImage(logo, x, y, logoWidth, logoHeight);
        resolve(canvas.toDataURL("image/png"));
      };

      logo.onerror = (e) => {
        console.warn(
          "Error al cargar el logo de ObelisIA, la imagen se mostrará sin él:",
          e
        );
        resolve(canvas.toDataURL("image/png")); // Resolver con la imagen original si el logo falla
      };
    };

    img.onerror = (e) => {
      console.error("Error al cargar la imagen para procesamiento:", e);
      reject(new Error("No se pudo cargar la imagen para procesamiento."));
    };

    img.src = imageUrl;
  });
}

// --- 6. Funciones de Galería y Lightbox ---

/** Guarda una imagen en el localStorage de la galería. */
function saveImageToGallery(imageUrl) {
  let images = JSON.parse(localStorage.getItem("generatedImages")) || [];
  if (
    !imageUrl.includes("placehold.co") &&
    (images.length === 0 || images[0] !== imageUrl)
  ) {
    images.unshift(imageUrl);
  }
  if (images.length > CONFIG.MAX_GALLERY_IMAGES) {
    images = images.slice(0, CONFIG.MAX_GALLERY_IMAGES);
  }
  localStorage.setItem("generatedImages", JSON.stringify(images));
}

/** Carga las imágenes de la galería del localStorage. */
function loadGalleryImages() {
  return JSON.parse(localStorage.getItem("generatedImages")) || [];
}

/** Renderiza la galería principal con imágenes y controles de selección. */
function renderGallery() {
  const images = loadGalleryImages();
  DOMElements.galleryContainer.innerHTML = "";

  // Sincronizar selección actual con imágenes existentes
  const currentSelected = new Set();
  images.forEach((imgUrl) => {
    if (selectedGalleryImages.has(imgUrl)) {
      currentSelected.add(imgUrl);
    }
  });
  selectedGalleryImages = currentSelected;
  updateDownloadSelectedButtonState(); // Actualiza el estado de los botones de descarga y eliminación masiva

  if (images.length === 0) {
    DOMElements.galleryContainer.innerHTML =
      '<p class="text-gray-500 col-span-full text-center p-4">La galería está vacía. ¡Genera tu primera imagen!</p>';
    return;
  }

  images.forEach((imageUrl, index) => {
    const itemWrapper = document.createElement("div");
    itemWrapper.classList.add(
      "gallery-item-wrapper",
      "relative",
      "rounded-lg",
      "shadow-md",
      "overflow-hidden"
    );
    itemWrapper.dataset.imageUrl = imageUrl;

    const imgElement = document.createElement("img");
    imgElement.src = imageUrl;
    imgElement.alt = `Imagen de galería ${index + 1}`;
    imgElement.classList.add(
      "w-full",
      "h-32",
      "object-cover",
      "cursor-pointer",
      "transition-transform",
      "duration-200"
    );
    imgElement.onerror = () => {
      imgElement.src = "https://placehold.co/150x150/374151/D1D5DB?text=Error";
    };
    imgElement.addEventListener("click", (e) => {
      if (
        !e.target.closest('input[type="checkbox"]') &&
        !e.target.closest("button")
      ) {
        openLightbox(imageUrl);
      }
    });

    const selectionOverlay = document.createElement("div");
    selectionOverlay.classList.add("selection-overlay", "rounded-lg");
    selectionOverlay.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`;

    const controlsWrapper = document.createElement("div");
    controlsWrapper.classList.add(
      "absolute",
      "bottom-0",
      "left-0",
      "right-0",
      "bg-gradient-to-t",
      "from-gray-900",
      "to-transparent",
      "p-2",
      "flex",
      "items-center",
      "justify-between"
    );

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.classList.add(
      "form-checkbox",
      "h-5",
      "w-5",
      "text-cyan-600",
      "rounded",
      "border-gray-300",
      "focus:ring-cyan-500",
      "bg-gray-700",
      "cursor-pointer"
    );
    checkbox.checked = selectedGalleryImages.has(imageUrl);
    checkbox.addEventListener("change", () =>
      toggleImageSelection(imageUrl, checkbox, itemWrapper)
    );

    const downloadBtn = document.createElement("button");
    downloadBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>';
    downloadBtn.title = "Descargar esta imagen";
    downloadBtn.classList.add(
      "text-white",
      "hover:text-cyan-400",
      "transition-colors",
      "duration-200",
      "p-1",
      "rounded-full",
      "bg-gray-800",
      "bg-opacity-50",
      "hover:bg-opacity-80",
      "cursor-pointer"
    );
    downloadBtn.addEventListener("click", () =>
      downloadImage(imageUrl, `imagen-galeria-${index + 1}.png`)
    );

    const deleteBtn = document.createElement("button"); // Botón de eliminar individual
    deleteBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>';
    deleteBtn.title = "Eliminar esta imagen";
    deleteBtn.classList.add(
      "text-red-400",
      "hover:text-red-300",
      "transition-colors",
      "duration-200",
      "p-1",
      "rounded-full",
      "bg-gray-800",
      "bg-opacity-50",
      "hover:bg-opacity-80",
      "cursor-pointer",
      "ml-1"
    ); // Añadido ml-1 para separación
    deleteBtn.addEventListener("click", () => deleteImageFromGallery(imageUrl));

    const editBtn = document.createElement("button"); // Botón de editar individual
    editBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.172-8.172z" /></svg>';
    editBtn.title = "Editar esta imagen";
    editBtn.classList.add(
      "text-yellow-400",
      "hover:text-yellow-300",
      "transition-colors",
      "duration-200",
      "p-1",
      "rounded-full",
      "bg-gray-800",
      "bg-opacity-50",
      "hover:bg-opacity-80",
      "cursor-pointer",
      "ml-1"
    );
    editBtn.addEventListener("click", () => editImage(imageUrl));

    controlsWrapper.appendChild(checkbox);
    controlsWrapper.appendChild(downloadBtn);
    controlsWrapper.appendChild(deleteBtn);
    controlsWrapper.appendChild(editBtn); // Añadido el botón de editar individual

    itemWrapper.appendChild(imgElement);
    itemWrapper.appendChild(selectionOverlay);
    itemWrapper.appendChild(controlsWrapper);

    if (selectedGalleryImages.has(imageUrl)) {
      itemWrapper.classList.add("selected");
    }
    DOMElements.galleryContainer.appendChild(itemWrapper);
  });
}

/**
 * Alterna la selección de una imagen en la galería.
 * @param {string} imageUrl - URL de la imagen.
 * @param {HTMLInputElement} checkbox - Elemento checkbox.
 * @param {HTMLElement} itemWrapper - Contenedor del item de la galería.
 */
function toggleImageSelection(imageUrl, checkbox, itemWrapper) {
  if (checkbox.checked) {
    selectedGalleryImages.add(imageUrl);
    itemWrapper.classList.add("selected");
  } else {
    selectedGalleryImages.delete(imageUrl);
    itemWrapper.classList.remove("selected");
  }
  updateDownloadSelectedButtonState();
}

/** Actualiza el estado de los botones de descarga y eliminación de selección múltiple. */
function updateDownloadSelectedButtonState() {
  const isDisabled = selectedGalleryImages.size === 0;
  DOMElements.downloadSelectedButton.disabled = isDisabled;
  DOMElements.downloadSelectedButton.classList.toggle("opacity-50", isDisabled);
  DOMElements.downloadSelectedButton.classList.toggle(
    "cursor-not-allowed",
    isDisabled
  );
  DOMElements.clearSelectionButton.disabled = isDisabled;
  DOMElements.clearSelectionButton.classList.toggle("opacity-50", isDisabled);
  DOMElements.clearSelectionButton.classList.toggle(
    "cursor-not-allowed",
    isDisabled
  );

  // También para el botón de eliminar seleccionadas
  DOMElements.deleteSelectedButton.disabled = isDisabled;
  DOMElements.deleteSelectedButton.classList.toggle("opacity-50", isDisabled);
  DOMElements.deleteSelectedButton.classList.toggle(
    "cursor-not-allowed",
    isDisabled
  );
}

/** Descarga todas las imágenes seleccionadas. */
async function downloadSelectedImages() {
  if (selectedGalleryImages.size === 0) {
    showCustomMessage(
      "Por favor, selecciona al menos una imagen para descargar.",
      "error"
    );
    return;
  }
  showCustomMessage(
    `Descargando ${selectedGalleryImages.size} imágenes...`,
    "info",
    4000
  );

  let downloadCount = 0;
  for (const imageUrl of selectedGalleryImages) {
    await new Promise((resolve) => setTimeout(resolve, 200)); // Pequeño retraso para evitar bloqueos
    downloadImage(imageUrl, `seleccion_ia_${downloadCount + 1}.png`);
    downloadCount++;
  }
  clearSelection();
  showCustomMessage(
    `Descarga de ${downloadCount} imágenes completada.`,
    "success"
  );
}

/**
 * Elimina una imagen específica de la galería.
 * @param {string} imageUrlToDelete - La URL de la imagen a eliminar.
 */
function deleteImageFromGallery(imageUrlToDelete) {
  let images = loadGalleryImages();
  const initialLength = images.length;
  images = images.filter((url) => url !== imageUrlToDelete);

  if (images.length < initialLength) {
    localStorage.setItem("generatedImages", JSON.stringify(images));
    renderGallery(); // Vuelve a renderizar la galería para reflejar el cambio
    showCustomMessage("Imagen eliminada de la galería.", "success", 2000);
  } else {
    showCustomMessage("No se encontró la imagen para eliminar.", "error", 2000);
  }
}

/** Elimina todas las imágenes seleccionadas de la galería. */
function deleteSelectedImagesFromGallery() {
  if (selectedGalleryImages.size === 0) {
    showCustomMessage(
      "Por favor, selecciona al menos una imagen para eliminar.",
      "error"
    );
    return;
  }

  let images = loadGalleryImages();
  const initialLength = images.length;

  // Filtrar las imágenes que NO están en el conjunto de seleccionadas
  images = images.filter((url) => !selectedGalleryImages.has(url));

  if (images.length < initialLength) {
    localStorage.setItem("generatedImages", JSON.stringify(images));
    renderGallery(); // Vuelve a renderizar la galería para reflejar el cambio
    showCustomMessage(
      `Se eliminaron ${initialLength - images.length} imágenes seleccionadas.`,
      "success",
      3000
    );
  } else {
    showCustomMessage(
      "No se encontraron imágenes seleccionadas para eliminar.",
      "error",
      2000
    );
  }
  clearSelection(); // Limpiar la selección después de eliminar
}

/**
 * Simula la edición de una imagen y muestra un mensaje.
 * @param {string} imageUrlToEdit - La URL de la imagen a "editar".
 */
function editImage(imageUrlToEdit) {
  console.log("Intentando editar imagen:", imageUrlToEdit);
  showCustomMessage(
    `Abriendo editor para la imagen... (Función en desarrollo). URL: ${imageUrlToEdit}`,
    "info",
    5000
  );
  // En una aplicación real, aquí redirigirías a un editor de imágenes
  // o abrirías una interfaz de edición compleja.
  // window.location.href = `img-edit.html?image=${encodeURIComponent(imageUrlToEdit)}`;
}

/** Limpia todas las selecciones de la galería. */
function clearSelection() {
  selectedGalleryImages.clear();
  renderGallery(); // Re-renderizar para desmarcar visualmente
  updateDownloadSelectedButtonState();
}

/** Abre el lightbox con la imagen seleccionada y su contexto de galería. */
function openLightbox(imageUrl) {
  const galleryImages = loadGalleryImages();
  currentLightboxIndex = galleryImages.findIndex((img) => img === imageUrl);

  updateLightboxContent(); // Actualiza la imagen principal y las miniaturas
  DOMElements.lightbox.classList.add("show");
}

/** Cierra el lightbox. */
function closeLightbox() {
  DOMElements.lightbox.classList.remove("show");
}

/** Actualiza la imagen principal y las miniaturas del lightbox. */
function updateLightboxContent() {
  const galleryImages = loadGalleryImages();
  if (galleryImages.length === 0) {
    DOMElements.lightboxImage.src =
      "https://placehold.co/600x400/374151/D1D5DB?text=Galería+vacía";
    DOMElements.lightboxThumbnails.innerHTML = "";
    return;
  }

  // Asegurar que el índice esté dentro de los límites
  if (currentLightboxIndex < 0) {
    currentLightboxIndex = galleryImages.length - 1;
  } else if (currentLightboxIndex >= galleryImages.length) {
    currentLightboxIndex = 0;
  }

  const currentImageUrl = galleryImages[currentLightboxIndex];
  DOMElements.lightboxImage.src = currentImageUrl;
  DOMElements.lightboxImage.alt = `Imagen en grande ${
    currentLightboxIndex + 1
  } de ${galleryImages.length}`;

  // Renderizar miniaturas del lightbox
  DOMElements.lightboxThumbnails.innerHTML = "";
  galleryImages.forEach((url, index) => {
    const thumbImg = document.createElement("img");
    thumbImg.src = url;
    thumbImg.alt = `Miniatura ${index + 1}`;
    thumbImg.classList.add("lightbox-thumbnail-item");
    if (index === currentLightboxIndex) {
      thumbImg.classList.add("active");
    }
    thumbImg.addEventListener("click", () => {
      currentLightboxIndex = index;
      updateLightboxContent();
    });
    thumbImg.onerror = () => {
      thumbImg.src = "https://placehold.co/80x80/374151/D1D5DB?text=Error";
    };
    DOMElements.lightboxThumbnails.appendChild(thumbImg);
  });

  // Desplazar las miniaturas para que la activa sea visible
  const activeThumbnail = DOMElements.lightboxThumbnails.querySelector(
    ".lightbox-thumbnail-item.active"
  );
  if (activeThumbnail) {
    activeThumbnail.scrollIntoView({
      behavior: "smooth",
      inline: "center",
    });
  }
}

/** Muestra la siguiente imagen en el lightbox. */
function showNextImage() {
  currentLightboxIndex++;
  updateLightboxContent();
}

/** Muestra la imagen anterior en el lightbox. */
function showPrevImage() {
  currentLightboxIndex--;
  updateLightboxContent();
}

// --- 7. Funciones de Modales de Usuario (Cookies y Suscripción) ---
/** Muestra el banner de consentimiento de cookies si no ha sido aceptado. */
function showCookieConsent() {
  if (!localStorage.getItem("cookieAccepted")) {
    DOMElements.cookieConsent.classList.add("show");
  }
}

/** Acepta las cookies y guarda la preferencia. */
function acceptCookies() {
  localStorage.setItem("cookieAccepted", "true");
  DOMElements.cookieConsent.classList.remove("show");
  showSubscriptionModal(); // Mostrar modal de suscripción después de aceptar cookies
}

/** Muestra el modal de suscripción si el usuario no se ha suscrito o dicho "no gracias". */
function showSubscriptionModal() {
  if (
    !localStorage.getItem("subscribed") &&
    !localStorage.getItem("noThanksSubscription")
  ) {
    DOMElements.subscriptionModal.classList.add("show");
  }
}

/** Maneja la suscripción al boletín (simulada). */
function handleSubscription() {
  const email = DOMElements.emailInput.value.trim();
  if (email) {
    console.log("Correo suscrito:", email);
    localStorage.setItem("subscribed", "true");
    DOMElements.subscriptionModal.classList.remove("show");
    showCustomMessage("¡Gracias por suscribirte!", "success");
  } else {
    showCustomMessage(
      "Por favor, introduce un correo electrónico válido.",
      "error"
    );
  }
}

/** Cierra el modal de suscripción y guarda la preferencia de "no, gracias". */
function dismissSubscription() {
  localStorage.setItem("noThanksSubscription", "true");
  DOMElements.subscriptionModal.classList.remove("show");
}

// --- 8. Funciones de Sugerencia de Prompt ---
/** Muestra el cuadro de sugerencia de prompt. */
function showPromptSuggestionBox() {
  DOMElements.promptSuggestionBox.classList.add("show");
}

/** Genera una sugerencia de prompt utilizando la API de Gemini. */
async function generatePromptSuggestion() {
  DOMElements.promptSuggestionLoading.classList.remove("hidden");
  DOMElements.generatePromptSuggestionButton.disabled = true;

  try {
    const promptForLLM =
      "Genera una idea de prompt detallada y creativa para una imagen de IA. Asegúrate de que sea concisa pero inspiradora. Por ejemplo: 'Un bosque místico con árboles bioluminiscentes y criaturas de fantasía, estilo arte digital, iluminación etérea.'";

    let chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: promptForLLM }] });
    const payload = { contents: chatHistory };
    const apiKey = ""; // La clave de API se inyecta automáticamente en tiempo de ejecución.
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Error al generar prompt: ${
          errorData.error.message || "Error desconocido"
        }`
      );
    }

    const result = await response.json();
    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content &&
      result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0
    ) {
      const generatedText = result.candidates[0].content.parts[0].text;
      DOMElements.promptInput.value = generatedText;
      DOMElements.promptSuggestionBox.classList.remove("show");
    } else {
      throw new Error("Respuesta inesperada de la IA para el prompt.");
    }
  } catch (error) {
    console.error("Error al generar prompt sugerido:", error);
    showCustomMessage(
      `No se pudo generar un prompt. ${error.message}`,
      "error"
    );
  } finally {
    DOMElements.promptSuggestionLoading.classList.add("hidden");
    DOMElements.generatePromptSuggestionButton.disabled = false;
  }
}

// --- 9. Funciones de Límite de Generaciones ---
/** Actualiza la UI del contador de generaciones y el estado del botón de generar. */
function updateGenerationCounterUI() {
  DOMElements.generationCounter.textContent = `Generaciones gratuitas restantes: ${freeGenerationsLeft}`;
  const isDisabled = freeGenerationsLeft <= 0;
  DOMElements.generateButton.disabled = isDisabled;
  DOMElements.generateButton.classList.toggle("opacity-50", isDisabled);
  DOMElements.generateButton.classList.toggle("cursor-not-allowed", isDisabled);
  DOMElements.watchAdButton.classList.toggle("hidden", !isDisabled); // Mostrar si está deshabilitado

  if (isDisabled) {
    showCustomMessage(
      "Has agotado tus generaciones gratuitas. Mira un anuncio para obtener más.",
      "info",
      5000
    );
  }
}

/** Simula la visualización de un anuncio y otorga generaciones adicionales. */
function watchAdForGenerations() {
  showCustomMessage("Simulando anuncio... por favor espera.", "info", 3000);
  DOMElements.watchAdButton.disabled = true;

  setTimeout(() => {
    freeGenerationsLeft += CONFIG.GENERATIONS_PER_AD_WATCH;
    localStorage.setItem("freeGenerationsLeft", freeGenerationsLeft);
    updateGenerationCounterUI();
    DOMElements.watchAdButton.disabled = false;
    showCustomMessage(
      `¡Has obtenido +${CONFIG.GENERATIONS_PER_AD_WATCH} generaciones!`,
      "success",
      3000
    );
  }, 3000); // Simular 3 segundos de anuncio
}

// --- 10. Lógica Principal de Generación de Imagen ---
/** Maneja el proceso completo de generación de imagen. */
async function generateImage() {
  if (freeGenerationsLeft <= 0) {
    showCustomMessage(
      "Has agotado tus generaciones gratuitas. Mira un anuncio para obtener más.",
      "error"
    );
    return;
  }

  const prompt = DOMElements.promptInput.value.trim();
  if (!prompt) {
    showCustomMessage(
      "Por favor, ingresa una descripción para la imagen.",
      "error"
    );
    return;
  }

  // Mostrar UI de estado de carga
  DOMElements.loadingIndicator.classList.remove("hidden");
  DOMElements.loadingAnimation.classList.remove("hidden"); // Mostrar muñequito
  DOMElements.generatedImage.classList.add("hidden"); // Esconder la imagen previamente generada
  DOMElements.imagePlaceholderText.classList.add("hidden"); // Esconder el texto placeholder
  DOMElements.downloadMainImageButton.classList.add("hidden"); // Esconder el botón de descarga principal
  DOMElements.promptSuggestionBox.classList.remove("show"); // Ocultar sugerencia si se genera

  // Actualizar el mensaje de carga con el prompt y tiempo estimado
  DOMElements.loadingMessageText.textContent = `Generando tu imagen de "${prompt}"... Esto puede tardar unos 2-3 minutos, por favor espera.`;

  const encodedPrompt = encodeURIComponent(prompt);
  let originalImageUrl = "";
  let processedImageUrl = "";
  let success = false;

  for (
    let attemptCount = 0;
    attemptCount <= CONFIG.MAX_RETRIES && !success;
    attemptCount++
  ) {
    try {
      const currentPollinationUrl = `${
        CONFIG.API_BASE_URL
      }${encodedPrompt}?_=${new Date().getTime()}&attempt=${attemptCount}`;

      const loadImagePromise = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(currentPollinationUrl);
        img.onerror = () =>
          reject(new Error("Error al cargar la imagen de IA."));
        img.src = currentPollinationUrl;
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(new Error("Tiempo de espera excedido para la API de IA.")),
          CONFIG.TIMEOUT_MS
        )
      );

      originalImageUrl = await Promise.race([loadImagePromise, timeoutPromise]);
      processedImageUrl = await processImageWithLogo(originalImageUrl);
      success = true;

      freeGenerationsLeft--; // Decrementar el contador solo si la IA fue exitosa
      localStorage.setItem("freeGenerationsLeft", freeGenerationsLeft);
      updateGenerationCounterUI();
    } catch (error) {
      console.warn(`Intento ${attemptCount + 1} fallido: ${error.message}`);
      if (attemptCount === CONFIG.MAX_RETRIES) {
        // Si es el último intento y falla
        showCustomMessage(
          `Todos los intentos para generar la imagen con IA fallaron: ${error.message}.`,
          "error"
        );
      } else {
        await new Promise((resolve) =>
          setTimeout(resolve, CONFIG.RETRY_DELAY_MS)
        );
      }
    }
  }

  if (success && processedImageUrl) {
    // PRIMERO: Mostrar la imagen generada en el área principal para que el usuario la vea.
    DOMElements.generatedImage.src = processedImageUrl;
    DOMElements.generatedImage.alt = prompt; // Alt text descriptivo
    DOMElements.generatedImage.classList.remove("hidden"); // Mostrar la imagen
    DOMElements.imagePlaceholderText.classList.add("hidden"); // Ocultar el texto placeholder
    DOMElements.downloadMainImageButton.classList.remove("hidden"); // Mostrar el botón de descarga principal (para esta imagen)

    // PEQUEÑA PAUSA para que el usuario vea la imagen ANTES de que se mueva a la galería
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Visible por 1.5 segundos

    // SEGUNDO: Guardar en la galería y restablecer el área principal
    localStorage.setItem("lastGeneratedImageUrl", processedImageUrl);
    saveImageToGallery(processedImageUrl);
    renderGallery(); // Actualizar la galería

    // Restablecer el área de imagen principal a su estado inicial (placeholder)
    DOMElements.generatedImage.src =
      "https://placehold.co/600x400/374151/D1D5DB?text=Tu+imagen+aparecerá+aquí";
    DOMElements.generatedImage.alt = "Placeholder para imagen generada por IA"; // Restablecer alt
    DOMElements.generatedImage.classList.add("hidden");
    DOMElements.imagePlaceholderText.classList.remove("hidden");
    DOMElements.downloadMainImageButton.classList.add("hidden"); // Ocultar el botón de descarga principal

    // Mensaje de éxito de generación y guardado
    showCustomMessage(
      "¡Imagen generada y guardada en tu galería!",
      "success",
      3000
    );
  } else {
    const fallbackUrl = CONFIG.FALLBACK_IMAGES[fallbackImageIndex];
    fallbackImageIndex =
      (fallbackImageIndex + 1) % CONFIG.FALLBACK_IMAGES.length;
    DOMElements.generatedImage.src = fallbackUrl;
    DOMElements.downloadMainImageButton.classList.add("hidden");
    showCustomMessage(
      "No se pudo generar la imagen con IA. Se mostró una imagen de ejemplo.",
      "info"
    );
  }

  // Ocultar indicador de carga y animación
  DOMElements.loadingIndicator.classList.add("hidden");
  DOMElements.loadingAnimation.classList.add("hidden"); // Ocultar muñequito
}

// --- 11. Event Listeners e Inicialización ---
document.addEventListener("DOMContentLoaded", () => {
  // Cargar estado inicial y actualizar UI
  const storedGenerations = localStorage.getItem("freeGenerationsLeft");
  if (storedGenerations !== null) {
    freeGenerationsLeft = parseInt(storedGenerations, 10);
  } else {
    freeGenerationsLeft = CONFIG.MAX_FREE_GENERATIONS;
    localStorage.setItem("freeGenerationsLeft", freeGenerationsLeft);
  }
  updateGenerationCounterUI();

  const lastImageUrl = localStorage.getItem("lastGeneratedImageUrl");
  if (lastImageUrl) {
    // Si hay una última imagen, mostrarla brevemente y luego restablecer a placeholder
    DOMElements.generatedImage.src = lastImageUrl;
    DOMElements.generatedImage.classList.remove("hidden");
    DOMElements.imagePlaceholderText.classList.add("hidden");
    DOMElements.downloadMainImageButton.classList.remove("hidden"); // Mostrar para descargar la última si quieren

    // Después de un tiempo, restablecer la vista principal
    setTimeout(() => {
      DOMElements.generatedImage.src =
        "https://placehold.co/600x400/374151/D1D5DB?text=Tu+imagen+aparecerá+aquí";
      DOMElements.generatedImage.classList.add("hidden");
      DOMElements.imagePlaceholderText.classList.remove("hidden");
      DOMElements.downloadMainImageButton.classList.add("hidden");
    }, 2000); // 2 segundos para ver la última imagen cargada
  } else {
    // Si no hay última imagen, solo mostrar el placeholder inicial
    DOMElements.generatedImage.classList.add("hidden"); // Asegurarse de que esté oculto al inicio
    DOMElements.imagePlaceholderText.classList.remove("hidden");
  }
  renderGallery();
  showCookieConsent();

  // Mostrar sugerencia de prompt después de un retraso inicial
  setTimeout(
    showPromptSuggestionBox,
    CONFIG.PROMPT_SUGGESTION_DELAY_SECONDS * 1000
  );
});

// Event Listeners principales de la aplicación
DOMElements.generateButton.addEventListener("click", generateImage);
DOMElements.downloadMainImageButton.addEventListener("click", () => {
  const imageUrl = DOMElements.generatedImage.src;
  if (imageUrl && !imageUrl.includes("placehold.co")) {
    // Evitar descargar placeholders
    downloadImage(imageUrl, "imagen-generada.png");
  } else {
    showCustomMessage("No hay una imagen válida para descargar.", "error");
  }
});
DOMElements.downloadSelectedButton.addEventListener(
  "click",
  downloadSelectedImages
);
DOMElements.clearSelectionButton.addEventListener("click", clearSelection);
DOMElements.deleteSelectedButton.addEventListener(
  "click",
  deleteSelectedImagesFromGallery
);

// Lightbox
DOMElements.lightboxCloseButton.addEventListener("click", closeLightbox);
DOMElements.lightbox.addEventListener("click", (e) => {
  if (e.target === DOMElements.lightbox) {
    closeLightbox();
  }
});
DOMElements.lightboxPrevButton.addEventListener("click", showPrevImage);
DOMElements.lightboxNextButton.addEventListener("click", showNextImage);

// Modales de Usuario
DOMElements.acceptCookiesButton.addEventListener("click", acceptCookies);
DOMElements.subscribeButton.addEventListener("click", handleSubscription);
DOMElements.noThanksButton.addEventListener("click", dismissSubscription);

// Sugerencia de Prompt
DOMElements.generatePromptSuggestionButton.addEventListener(
  "click",
  generatePromptSuggestion
);
DOMElements.promptInput.addEventListener("input", () => {
  DOMElements.promptSuggestionBox.classList.remove("show");
});

// Límite de Generaciones
DOMElements.watchAdButton.addEventListener("click", watchAdForGenerations);

// Event listener para el modal de mensajes genérico
DOMElements.messageModalCloseButton.addEventListener(
  "click",
  hideCustomMessage
);
DOMElements.messageModal.addEventListener("click", (event) => {
  if (event.target === DOMElements.messageModal) {
    hideCustomMessage();
  }
});
