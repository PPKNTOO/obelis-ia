// ia-img/js/script.js

// --- Constantes de Configuración (específicas de este módulo) ---
const CONFIG = {
  API_BASE_URL: "https://image.pollinations.ai/prompt/",
  MAX_RETRIES: 2,
  RETRY_DELAY_MS: 1500,
  TIMEOUT_MS: 30000, // Aumentado el timeout para generación de imágenes (30 segundos)
  MAX_GALLERY_IMAGES: 12,
  PROMPT_SUGGESTION_DELAY_SECONDS: 10,
  OBELISAI_LOGO_URL: "../img/marca_de_agua.webp",
  IMAGE_CROP_BOTTOM_PX: 60,
  MAX_FREE_GENERATIONS: 5,
  GENERATIONS_PER_AD_WATCH: 3,
  FALLBACK_IMAGES: [
    "https://placehold.co/600x400/FFDDC1/E65100?alt=Atardecer+simulado",
    "https://placehold.co/600x400/C8E6C9/2E7D32?alt=Bosque+mágico+simulado",
    "https://placehold.co/600x400/BBDEFB/1976D2?alt=Ciudad+futurista+simulada",
    "https://placehold.co/600x400/F0F4C3/AFB42B?alt=Abstracto+colorido+simulado",
    "https://placehold.co/600x400/EDE7F6/5E35B1?alt=Retrato+surrealista+simulado",
  ],
  MIN_IMPROVED_PROMPT_LENGTH: 150,
  GALLERY_MAX_WIDTH: 600, // Ancho máximo para optimización de galería
  GALLERY_JPEG_QUALITY: 0.85,
  // Dimensiones predeterminadas para generación de imágenes
  DEFAULT_IMAGE_WIDTH: 768,
  DEFAULT_IMAGE_HEIGHT: 768,
};

// --- Variables de Estado Globales (específicas de este módulo) ---
let freeGenerationsLeft = CONFIG.MAX_FREE_GENERATIONS;
let selectedGalleryImages = new Set();
let currentLightboxIndex = 0;
let fallbackImageIndex = 0;
let lastGeneratedImageUrl = null; // Para el botón de descarga rápida

let editorCtx;
let originalEditorImage = new Image();
let currentEditorImage = new Image();
let editorCurrentFilter = "none";
let editorTextData = {
  content: "",
  color: "#FFFFFF",
  size: 30,
  position: "bottomRight",
};
let editingImageUrl = null;

// --- FUNCIONES (específicas de este módulo) ---

/**
 * Procesa una imagen: recorta la parte inferior (para eliminar marcas de agua de terceros)
 * y luego añade tu marca de agua personalizada.
 * @param {string} imageUrl - La URL de la imagen a procesar.
 * @returns {Promise<string>} - Una promesa que resuelve con la data URL de la imagen procesada con tu marca de agua.
 */
function processImageWithLogo(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Necesario para evitar problemas de CORS al dibujar en canvas

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // 1. Calcular las dimensiones después del recorte inferior (para eliminar marcas de agua de terceros)
      const sourceX = 0;
      const sourceY = 0;
      const sourceWidth = img.naturalWidth;
      const sourceHeight = img.naturalHeight - CONFIG.IMAGE_CROP_BOTTOM_PX;

      // Asegurarse de que la altura no sea negativa después del recorte
      if (sourceHeight <= 0) {
        console.warn(
          "La altura de la imagen después del recorte es cero o negativa. No se aplicará el recorte inferior ni la marca de agua."
        );
        resolve(imageUrl);
        return;
      }

      // Establecer las dimensiones del canvas al tamaño recortado
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;

      // 2. Dibujar la porción recortada de la imagen original en el canvas
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        sourceWidth,
        sourceHeight
      );

      // 3. Cargar y dibujar tu marca de agua personalizada
      const customWatermark = new Image();
      customWatermark.crossOrigin = "Anonymous"; // Necesario para CORS
      customWatermark.src = CONFIG.OBELISAI_LOGO_URL; // Tu marca de agua WEBP

      customWatermark.onload = () => {
        // Calcular tamaño y posición de la marca de agua
        const watermarkWidth = Math.min(
          Math.max(100, canvas.width * 0.15),
          250
        ); // Tamaño adaptable, máx 250px
        const watermarkHeight =
          (customWatermark.naturalHeight / customWatermark.naturalWidth) *
          watermarkWidth;
        const padding = Math.max(10, canvas.width * 0.02); // Padding adaptable

        // Posicionar en la esquina inferior derecha del canvas (ya recortado)
        const x = canvas.width - watermarkWidth - padding;
        const y = canvas.height - watermarkHeight - padding;

        ctx.drawImage(customWatermark, x, y, watermarkWidth, watermarkHeight);
        resolve(canvas.toDataURL("image/png"));
      };

      customWatermark.onerror = (e) => {
        console.warn(
          "Error al cargar la imagen de marca de agua (personalizada), la imagen se mostrará sin ella:",
          e
        );
        resolve(canvas.toDataURL("image/png"));
      };
    };

    img.onerror = (e) => {
      console.error(
        "Error al cargar la imagen principal para procesamiento (recorte/marca de agua):",
        e
      );
      reject(new Error("No se pudo cargar la imagen para procesamiento."));
    };

    img.src = imageUrl;
  });
}

/**
 * Procesa una imagen para la galería (redimensiona y comprime).
 */
function processImageForGallery(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      let width = img.naturalWidth;
      let height = img.naturalHeight;
      if (width > CONFIG.GALLERY_MAX_WIDTH) {
        height = Math.round((height * CONFIG.GALLERY_MAX_WIDTH) / width);
        width = CONFIG.GALLERY_MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", CONFIG.GALLERY_JPEG_QUALITY));
    };
    img.onerror = (e) => {
      console.error("Error al cargar la imagen para la galería:", e);
      reject(new Error("No se pudo cargar la imagen para optimización."));
    };
    img.src = imageUrl;
  });
}

// --- Galería y Lightbox (funciones actualizadas) ---

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
  try {
    localStorage.setItem("generatedImages", JSON.stringify(images));
    updateLocalStorageUsage(); // Llama a la función global
  } catch (e) {
    if (e.name === "QuotaExceededError") {
      showCustomMessage(
        "¡Almacenamiento lleno! Has alcanzado el límite de imágenes guardadas. Por favor, elimina algunas imágenes de la galería para generar más.",
        "error",
        7000
      );
    } else {
      console.error("Error al guardar en localStorage:", e);
    }
  }
}

function loadGalleryImages() {
  return JSON.parse(localStorage.getItem("generatedImages")) || [];
}

function renderGallery() {
  const images = loadGalleryImages();
  DOMElements.galleryContainer.innerHTML = "";

  const currentSelected = new Set();
  images.forEach((imgUrl) => {
    if (selectedGalleryImages.has(imgUrl)) {
      currentSelected.add(imgUrl);
    }
  });
  selectedGalleryImages = currentSelected;
  updateDownloadSelectedButtonState();

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
    itemWrapper.classList.add(
      // Ya tiene width/height/object-fit en CSS. Aquí solo clases visuales.
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
    // Usar la personalización de checkboxes de main.css (si aplica)
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
    // CORRECCIÓN DE LA RUTA DEL SVG: Se ha eliminado el 'S' erróneo.
    downloadBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>';
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

    const deleteBtn = document.createElement("button");
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
    );
    deleteBtn.addEventListener("click", () => deleteImageFromGallery(imageUrl));

    const editBtn = document.createElement("button");
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
    editBtn.addEventListener("click", () => openImageEditor(imageUrl));

    controlsWrapper.appendChild(checkbox);
    controlsWrapper.appendChild(downloadBtn);
    controlsWrapper.appendChild(deleteBtn);
    controlsWrapper.appendChild(editBtn);

    itemWrapper.appendChild(imgElement);
    itemWrapper.appendChild(selectionOverlay);
    itemWrapper.appendChild(controlsWrapper);

    if (selectedGalleryImages.has(imageUrl)) {
      itemWrapper.classList.add("selected");
    }
    DOMElements.galleryContainer.appendChild(itemWrapper);
  });
}

function renderRecentGenerations() {
  const images = loadGalleryImages();
  DOMElements.recentGenerationsGallery.innerHTML = ""; // Clear previous content

  if (images.length === 0) {
    DOMElements.recentGenerationsGallery.innerHTML =
      '<p class="text-gray-500 text-sm text-center col-span-2">Genera algunas imágenes para ver tu historial aquí.</p>';
    DOMElements.downloadLastGeneratedButton.disabled = true;
    DOMElements.downloadLastGeneratedButton.classList.add(
      "opacity-50",
      "cursor-not-allowed"
    );
    return;
  }

  const numToShow = Math.min(images.length, 4); // Show up to 4 recent images
  for (let i = 0; i < numToShow; i++) {
    const imageUrl = images[i];
    const imgElement = document.createElement("img");
    imgElement.src = imageUrl;
    imgElement.alt = `Historial ${i + 1}`;
    // Clases CSS se aplicarán desde style.css para width/height/object-fit
    imgElement.classList.add(
      "rounded-md",
      "cursor-pointer",
      "border",
      "border-gray-700",
      "hover:border-cyan-500",
      "transition-colors"
    );
    imgElement.addEventListener("click", () => openLightbox(imageUrl));
    imgElement.onerror = () => {
      imgElement.src = "https://placehold.co/80x80/374151/D1D5DB?text=Error";
    };
    DOMElements.recentGenerationsGallery.appendChild(imgElement);
  }

  // Enable download last generated button
  lastGeneratedImageUrl = images[0]; // The most recent image
  DOMElements.downloadLastGeneratedButton.disabled = false;
  DOMElements.downloadLastGeneratedButton.classList.remove(
    "opacity-50",
    "cursor-not-allowed"
  );
}

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

  DOMElements.deleteSelectedButton.disabled = isDisabled;
  DOMElements.deleteSelectedButton.classList.toggle("opacity-50", isDisabled);
  DOMElements.deleteSelectedButton.classList.toggle(
    "cursor-not-allowed",
    isDisabled
  );
}

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
    // AÑADIDO: Pequeño retraso para evitar que el navegador bloquee descargas múltiples
    await new Promise((resolve) => setTimeout(resolve, 300)); // Esperar 300ms entre descargas
    await downloadImage(imageUrl, `seleccion_ia_${downloadCount + 1}.png`); // Usar await
    downloadCount++;
  }
  clearSelection();
  showCustomMessage(
    `Descarga de ${downloadCount} imágenes completada.`,
    "success"
  );
}

function deleteImageFromGallery(imageUrlToDelete) {
  let images = loadGalleryImages();
  const initialLength = images.length;
  images = images.filter((url) => url !== imageUrlToDelete);

  if (images.length < initialLength) {
    localStorage.setItem("generatedImages", JSON.stringify(images));
    renderGallery();
    renderRecentGenerations(); // Update recent generations after deletion
    showCustomMessage("Imagen eliminada de la galería.", "success", 2000);
  } else {
    showCustomMessage("No se encontró la imagen para eliminar.", "error", 2000);
  }
}

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

  images = images.filter((url) => !selectedGalleryImages.has(url));

  if (images.length < initialLength) {
    localStorage.setItem("generatedImages", JSON.stringify(images));
    renderGallery();
    renderRecentGenerations(); // Update recent generations after deletion
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
  clearSelection();
}

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

function toggleSelectAllImages() {
  const allImages = loadGalleryImages();
  const allCheckboxes = DOMElements.galleryContainer.querySelectorAll(
    'input[type="checkbox"]'
  );

  if (selectedGalleryImages.size === allImages.length && allImages.length > 0) {
    clearSelection();
  } else {
    selectedGalleryImages.clear();
    allImages.forEach((imageUrl) => selectedGalleryImages.add(imageUrl));
    allCheckboxes.forEach((checkbox) => {
      checkbox.checked = true;
      checkbox.closest(".gallery-item-wrapper").classList.add("selected");
    });
    updateDownloadSelectedButtonState();
  }
}

function openLightbox(imageUrl) {
  const galleryImages = loadGalleryImages();
  currentLightboxIndex = galleryImages.findIndex((img) => img === imageUrl);

  updateLightboxContent();
  DOMElements.lightbox.classList.add("show");
}

function closeLightbox() {
  DOMElements.lightbox.classList.remove("show");
}

function updateLightboxContent() {
  const galleryImages = loadGalleryImages();
  if (galleryImages.length === 0) {
    DOMElements.lightboxImage.src =
      "https://placehold.co/600x400/374151/D1D5DB?text=Galería+vacía";
    DOMElements.lightboxThumbnails.innerHTML = "";
    return;
  }

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

  const activeThumbnail = DOMElements.lightboxThumbnails.querySelector(
    ".lightbox-thumbnail-item.active"
  );
  if (activeThumbnail) {
    activeThumbnail.scrollIntoView({ behavior: "smooth", inline: "center" });
  }
}

function showNextImage() {
  currentLightboxIndex++;
  updateLightboxContent();
}

function showPrevImage() {
  currentLightboxIndex--;
  updateLightboxContent();
}

// --- Modal de Carga y Mensajes de Generación (NUEVO) ---
function showLoadingOverlay(
  message = "Generando tu imagen, por favor espera...",
  isError = false
) {
  if (!DOMElements.loadingOverlayModal) {
    console.error("Loading overlay modal elements not found.");
    return;
  }
  DOMElements.loadingMessageTextModal.textContent = message;
  DOMElements.loadingErrorTextModal.classList.add("hidden"); // Ocultar errores previos

  if (isError) {
    DOMElements.loadingErrorTextModal.textContent = message;
    DOMElements.loadingErrorTextModal.classList.remove("hidden");
    DOMElements.loadingMessageTextModal.textContent = "¡Ha ocurrido un error!"; // Mensaje principal para error
    DOMElements.pocoyoGifModal.classList.add("hidden");
    DOMElements.loadingSpinnerModal.classList.add("hidden");
    DOMElements.loadingModalCloseButton.classList.remove("hidden"); // Mostrar botón de cerrar en error
  } else {
    DOMElements.loadingModalCloseButton.classList.add("hidden"); // Ocultar botón si no hay error
    // Decidir si mostrar Pocoyo o spinner
    if (
      DOMElements.pocoyoGifModal &&
      !DOMElements.pocoyoGifModal.classList.contains("hidden")
    ) {
      // Pocoyo ya está visible o se intenta mostrar
    } else if (DOMElements.loadingSpinnerModal) {
      DOMElements.pocoyoGifModal.classList.add("hidden"); // Asegurarse de que Pocoyo esté oculto si el spinner debe verse
      DOMElements.loadingSpinnerModal.classList.remove("hidden");
    }
  }
  DOMElements.loadingOverlayModal.classList.add("show");
}

function hideLoadingOverlay() {
  if (!DOMElements.loadingOverlayModal) return;
  DOMElements.loadingOverlayModal.classList.remove("show");
  DOMElements.loadingMessageTextModal.textContent = "";
  DOMElements.loadingErrorTextModal.textContent = "";
  DOMElements.loadingErrorTextModal.classList.add("hidden");
  DOMElements.pocoyoGifModal.classList.remove("hidden"); // Resetear para la próxima vez
  DOMElements.loadingSpinnerModal.classList.add("hidden"); // Ocultar spinner al finalizar
  DOMElements.loadingModalCloseButton.classList.add("hidden"); // Asegurarse de que esté oculto
}

function updateGenerationCounterUI() {
  DOMElements.generationCounter.textContent = `Generaciones gratuitas restantes: ${freeGenerationsLeft}`;
  const isDisabled = freeGenerationsLeft <= 0;
  DOMElements.generateButton.disabled = isDisabled;
  DOMElements.generateButton.classList.toggle("opacity-50", isDisabled);
  DOMElements.generateButton.classList.toggle("cursor-not-allowed", isDisabled);
  DOMElements.watchAdButton.classList.toggle("hidden", !isDisabled);

  if (isDisabled) {
    // Si no hay generaciones, mostrar un mensaje de ayuda en la UI principal, no en el modal flotante
    DOMElements.generationCounter.textContent += " (Ver anuncio para más)";
  }
}

function watchAdForGenerations() {
  showCustomMessage("Simulando anuncio... por favor espera.", "info", 3000); // Usar modal global para esta notificación
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
  }, 3000);
}

function showPromptSuggestionBox() {
  DOMElements.promptSuggestionBox.classList.add("show");
}

async function generatePromptSuggestion() {
  showLoadingOverlay("Generando una sugerencia de prompt...", false);
  DOMElements.generatePromptSuggestionButton.disabled = true;

  try {
    const promptForLLM =
      "Genera una idea de prompt detallada y creativa para una imagen de IA. Asegúrate de que sea concisa pero inspiradora. Por ejemplo: 'Un bosque místico con árboles bioluminiscentes y criaturas de fantasía, estilo arte digital, iluminación etérea.'";

    let chatHistory = [{ role: "user", parts: [{ text: promptForLLM }] }]; // Prepara el historial para la API

    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: chatHistory, // Usar 'contents' para Gemini, no 'prompt'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Error al generar prompt desde el proxy: ${
          errorData.error?.message || response.statusText || "Error desconocido"
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
      showCustomMessage("Sugerencia de prompt generada.", "success");
    } else {
      throw new Error(
        "Respuesta inesperada de la IA para el prompt a través del proxy."
      );
    }
  } catch (error) {
    console.error("Error al generar prompt sugerido (frontend):", error);
    showLoadingOverlay(`No se pudo generar un prompt: ${error.message}`, true); // Mostrar error en modal de carga
  } finally {
    hideLoadingOverlay();
    DOMElements.generatePromptSuggestionButton.disabled = false;
  }
}

async function improvePrompt() {
  const currentPrompt = DOMElements.promptInput.value.trim();
  if (!currentPrompt) {
    showCustomMessage(
      "Por favor, escribe algo en el prompt para mejorarlo.",
      "error"
    );
    return;
  }

  showLoadingOverlay("Mejorando el prompt... Por favor, espera.", false);

  DOMElements.improvePromptButton.disabled = true;
  DOMElements.generateButton.disabled = true;
  DOMElements.promptInput.disabled = true;

  try {
    const selectedTone = DOMElements.toneSelect.value;
    const promptForLLM = `Reescribe y expande el siguiente prompt para una imagen de IA. Hazlo mucho más detallado, con al menos ${CONFIG.MIN_IMPROVED_PROMPT_LENGTH} caracteres, y aplica un tono '${selectedTone}'. Solo devuelve el prompt puro, sin comentarios ni texto adicional. Prompt original: '${currentPrompt}'`;

    let chatHistory = [{ role: "user", parts: [{ text: promptForLLM }] }]; // Prepara el historial

    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: chatHistory, // Usar 'contents' para Gemini
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Error al mejorar prompt desde el proxy: ${
          errorData.error?.message || response.statusText || "Error desconocido"
        }`
      );
    }

    const result = await response.json();
    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content &&
      result.candidates[0].content.parts &&
      result.candidates[0].content[0] && // Acceso correcto al contenido para Gemini 2.0
      result.candidates[0].content.parts.length > 0
    ) {
      let generatedText = result.candidates[0].content.parts[0].text.trim();

      if (generatedText.length < CONFIG.MIN_IMPROVED_PROMPT_LENGTH) {
        showCustomMessage(
          `El prompt generado fue demasiado corto (${generatedText.length} caracteres). Intenta de nuevo o ajusta el tono.`,
          "info"
        );
      } else {
        showCustomMessage("¡Prompt mejorado con éxito!", "success");
      }
      DOMElements.promptInput.value = generatedText;
    } else {
      throw new Error(
        "Respuesta inesperada de la IA al mejorar el prompt a través del proxy."
      );
    }
  } catch (error) {
    console.error("Error al mejorar prompt (frontend):", error);
    showLoadingOverlay(`No se pudo mejorar el prompt: ${error.message}`, true);
  } finally {
    hideLoadingOverlay();
    DOMElements.improvePromptButton.disabled = false;
    DOMElements.generateButton.disabled = false;
    DOMElements.promptInput.disabled = false;
  }
}

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

  showLoadingOverlay(
    `Generando tu imagen de "${prompt}"... Esto puede tardar unos 2-3 minutos, por favor espera.`,
    false
  );
  DOMElements.generatedImage.classList.add("hidden");
  DOMElements.imagePlaceholderText.classList.add("hidden");
  DOMElements.downloadMainImageButton.classList.add("hidden");
  DOMElements.promptSuggestionBox.classList.remove("show");

  const selectedStyle = DOMElements.styleSelect.value;
  const selectedAspectRatio = DOMElements.aspectRatioSelect.value;

  let finalPrompt = prompt;
  if (selectedStyle !== "none") {
    finalPrompt += `, ${selectedStyle} style`;
  }

  let width = CONFIG.DEFAULT_IMAGE_WIDTH;
  let height = CONFIG.DEFAULT_IMAGE_HEIGHT;

  switch (selectedAspectRatio) {
    case "1:1":
      width = 768;
      height = 768;
      break; // Cuadrado
    case "16:9":
      width = 1024;
      height = 576;
      break; // Horizontal
    case "9:16":
      width = 576;
      height = 1024;
      break; // Vertical
    case "4:3":
      width = 800;
      height = 600;
      break; // Estándar
  }

  const encodedPrompt = encodeURIComponent(finalPrompt);
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
      }${encodedPrompt}?width=${width}&height=${height}&_=${new Date().getTime()}&attempt=${attemptCount}`;

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

      const optimizedImageUrlForGallery = await processImageForGallery(
        processedImageUrl
      );

      saveImageToGallery(optimizedImageUrlForGallery);
      lastGeneratedImageUrl = processedImageUrl; // Guarda la URL de la imagen procesada
      localStorage.setItem("lastGeneratedImageUrlDisplayed", processedImageUrl); // Guarda para mostrar al cargar la página

      success = true;

      freeGenerationsLeft--;
      localStorage.setItem("freeGenerationsLeft", freeGenerationsLeft);
      updateGenerationCounterUI();
    } catch (error) {
      console.warn(`Intento ${attemptCount + 1} fallido: ${error.message}`);
      if (attemptCount === CONFIG.MAX_RETRIES) {
        showLoadingOverlay(
          `Todos los intentos para generar la imagen con IA fallaron: ${error.message}.`,
          true
        );
      } else {
        await new Promise((resolve) =>
          setTimeout(resolve, CONFIG.RETRY_DELAY_MS)
        );
      }
    }
  }

  if (success && processedImageUrl) {
    DOMElements.generatedImage.src = processedImageUrl;
    DOMElements.generatedImage.alt = `Imagen generada: ${prompt}`;
    DOMElements.generatedImage.classList.remove("hidden");
    DOMElements.imagePlaceholderText.classList.add("hidden");
    DOMElements.downloadMainImageButton.classList.remove("hidden");

    renderGallery(); // Actualizar galería principal
    renderRecentGenerations(); // Actualizar galería reciente en aside

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
    DOMElements.generatedImage.alt = "Imagen de ejemplo";
    DOMElements.downloadMainImageButton.classList.add("hidden");
    showCustomMessage(
      "No se pudo generar la imagen con IA. Se mostró una imagen de ejemplo.",
      "info"
    );
    renderGallery(); // Asegurarse de que la galería se renderice incluso con fallo
    renderRecentGenerations(); // Asegurarse de que el historial reciente se renderice
  }

  hideLoadingOverlay();
}

function openImageEditor(imageUrl) {
  editingImageUrl = imageUrl;
  originalEditorImage.src = imageUrl;
  originalEditorImage.onload = () => {
    // Asegurarse de que el canvas se ajuste a la imagen si es necesario
    const aspectRatio =
      originalEditorImage.naturalWidth / originalEditorImage.naturalHeight;
    const maxCanvasHeight = window.innerHeight * 0.7; // Por ejemplo, 70% de la altura de la ventana
    const maxCanvasWidth = window.innerWidth * 0.7; // Por ejemplo, 70% de la anchura de la ventana

    let newWidth = originalEditorImage.naturalWidth;
    let newHeight = originalEditorImage.naturalHeight;

    if (newWidth > maxCanvasWidth) {
      newWidth = maxCanvasWidth;
      newHeight = newWidth / aspectRatio;
    }
    if (newHeight > maxCanvasHeight) {
      newHeight = maxCanvasHeight;
      newWidth = newHeight * aspectRatio;
    }

    DOMElements.editorCanvas.width = newWidth;
    DOMElements.editorCanvas.height = newHeight;
    DOMElements.editorCanvas.style.width = `${newWidth}px`;
    DOMElements.editorCanvas.style.height = `${newHeight}px`;

    editorCtx = DOMElements.editorCanvas.getContext("2d");
    redrawEditorCanvas();
    DOMElements.imageEditorModal.classList.add("show");
  };
  renderFilterThumbnails();
}

function closeImageEditor() {
  DOMElements.imageEditorModal.classList.remove("show");
  editorCurrentFilter = "none";
  editorTextData = {
    content: "",
    color: "#FFFFFF",
    size: 30,
    position: "bottomRight",
  };
  DOMElements.editorTextInput.value = "";
  DOMElements.editorTextColor.value = "#FFFFFF";
  DOMElements.editorTextSize.value = "30";
  DOMElements.editorTextPosition.value = "bottomRight";
  DOMElements.cropWidthInput.value = "";
  DOMElements.cropHeightInput.value = "";
}

function redrawEditorCanvas() {
  if (!editorCtx || !originalEditorImage.complete) return;

  editorCtx.clearRect(
    0,
    0,
    DOMElements.editorCanvas.width,
    DOMElements.editorCanvas.height
  );

  let drawX = 0,
    drawY = 0,
    drawW = originalEditorImage.naturalWidth,
    drawH = originalEditorImage.naturalHeight;
  let cropW =
    parseInt(DOMElements.cropWidthInput.value) ||
    originalEditorImage.naturalWidth;
  let cropH =
    parseInt(DOMElements.cropHeightInput.value) ||
    originalEditorImage.naturalHeight;

  // Si hay valores de recorte, ajusta las dimensiones de origen
  if (
    cropW < originalEditorImage.naturalWidth ||
    cropH < originalEditorImage.naturalHeight
  ) {
    drawX = (originalEditorImage.naturalWidth - cropW) / 2;
    drawY = (originalEditorImage.naturalHeight - cropH) / 2;
    drawW = cropW;
    drawH = cropH;
  }

  // Dibuja la porción recortada de la imagen original en el canvas con las nuevas dimensiones del canvas
  editorCtx.drawImage(
    originalEditorImage,
    drawX, // sourceX
    drawY, // sourceY
    drawW, // sourceWidth
    drawH, // sourceHeight
    0, // destX
    0, // destY
    DOMElements.editorCanvas.width, // destWidth (ajustado a la nueva anchura del canvas)
    DOMElements.editorCanvas.height // destHeight (ajustado a la nueva altura del canvas)
  );

  applyFilterToCanvas(editorCurrentFilter);

  if (editorTextData.content) {
    editorCtx.font = `${editorTextData.size}px Arial`;
    editorCtx.fillStyle = editorTextData.color;
    editorCtx.textAlign = "left";
    editorCtx.textBaseline = "top";

    let textX, textY;
    const margin = 20;

    switch (editorTextData.position) {
      case "topLeft":
        textX = margin;
        textY = margin;
        break;
      case "topRight":
        // Asegúrate de que el cálculo del ancho del texto se haga después de establecer la fuente
        textX =
          DOMElements.editorCanvas.width -
          editorCtx.measureText(editorTextData.content).width -
          margin;
        textY = margin;
        break;
      case "bottomLeft":
        textX = margin;
        textY = DOMElements.editorCanvas.height - editorTextData.size - margin;
        break;
      case "center":
        textX =
          (DOMElements.editorCanvas.width -
            editorCtx.measureText(editorTextData.content).width) /
          2;
        textY = (DOMElements.editorCanvas.height - editorTextData.size) / 2;
        break;
      case "bottomRight":
      default:
        textX =
          DOMElements.editorCanvas.width -
          editorCtx.measureText(editorTextData.content).width -
          margin;
        textY = DOMElements.editorCanvas.height - editorTextData.size - margin;
        break;
    }
    editorCtx.fillText(editorTextData.content, textX, textY);
  }
}

function applyFilterToCanvas(filter) {
  editorCurrentFilter = filter;
  if (editorCurrentFilter !== "none") {
    editorCtx.filter = filter;
  } else {
    editorCtx.filter = "none";
  }
  // Redibuja la imagen de base con el filtro aplicado
  editorCtx.drawImage(
    originalEditorImage,
    0,
    0,
    DOMElements.editorCanvas.width,
    DOMElements.editorCanvas.height
  );
  // Vuelve a dibujar el texto encima si existe
  if (editorTextData.content) {
    editorCtx.font = `${editorTextData.size}px Arial`;
    editorCtx.fillStyle = editorTextData.color;
    editorCtx.textAlign = "left";
    editorCtx.textBaseline = "top";
    let textX, textY;
    const margin = 20;
    // Recalcular posiciones de texto para asegurar que se muestre correctamente sobre el filtro
    switch (editorTextData.position) {
      case "topLeft":
        textX = margin;
        textY = margin;
        break;
      case "topRight":
        textX =
          DOMElements.editorCanvas.width -
          editorCtx.measureText(editorTextData.content).width -
          margin;
        textY = margin;
        break;
      case "bottomLeft":
        textX = margin;
        textY = DOMElements.editorCanvas.height - editorTextData.size - margin;
        break;
      case "center":
        textX =
          (DOMElements.editorCanvas.width -
            editorCtx.measureText(editorTextData.content).width) /
          2;
        textY = (DOMElements.editorCanvas.height - editorTextData.size) / 2;
        break;
      case "bottomRight":
      default:
        textX =
          DOMElements.editorCanvas.width -
          editorCtx.measureText(editorTextData.content).width -
          margin;
        textY = DOMElements.editorCanvas.height - editorTextData.size - margin;
        break;
    }
    editorCtx.fillText(editorTextData.content, textX, textY);
  }
}

function addTextToCanvas() {
  redrawEditorCanvas();
  showCustomMessage("Texto añadido a la imagen.", "success", 2000);
}

function applyCrop() {
  const width = parseInt(DOMElements.cropWidthInput.value);
  const height = parseInt(DOMElements.cropHeightInput.value);

  if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
    showCustomMessage(
      "Por favor, ingresa dimensiones de recorte válidas.",
      "error"
    );
    return;
  }

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  // Establece las dimensiones temporales del canvas al tamaño del recorte deseado
  tempCanvas.width = width;
  tempCanvas.height = height;

  // Calcula las coordenadas de origen para un recorte centrado
  const sourceX = (originalEditorImage.naturalWidth - width) / 2;
  const sourceY = (originalEditorImage.naturalHeight - height) / 2;

  // Dibuja la porción recortada de la imagen original en el canvas temporal
  tempCtx.drawImage(
    originalEditorImage,
    sourceX, // sourceX: Coordenada X inicial del recorte en la imagen original
    sourceY, // sourceY: Coordenada Y inicial del recorte en la imagen original
    width, // sourceWidth: Ancho del recorte en la imagen original
    height, // sourceHeight: Alto del recorte en la imagen original
    0, // destX: Coordenada X inicial en el canvas temporal
    0, // destY: Coordenada Y inicial en el canvas temporal
    width, // destWidth: Ancho de la imagen dibujada en el canvas temporal
    height // destHeight: Alto de la imagen dibujada en el canvas temporal
  );

  // Convierte el canvas temporal a una URL de datos y actualiza la imagen original del editor
  originalEditorImage.src = tempCanvas.toDataURL("image/png");
  originalEditorImage.onload = () => {
    // Ajusta las dimensiones del canvas principal del editor para que coincidan con la nueva imagen recortada
    DOMElements.editorCanvas.width = originalEditorImage.naturalWidth;
    DOMElements.editorCanvas.height = originalEditorImage.naturalHeight;
    // Vuelve a dibujar el canvas con la imagen recortada y el filtro/texto aplicados
    redrawEditorCanvas();
    showCustomMessage("Imagen recortada con éxito.", "success", 2000);
  };
}

function saveEditedImage() {
  // Asegurarse de que el canvas esté dibujado con los últimos cambios
  redrawEditorCanvas();
  const editedImageUrl = DOMElements.editorCanvas.toDataURL("image/png");

  let images = loadGalleryImages();
  const indexToUpdate = images.findIndex((url) => url === editingImageUrl);

  if (indexToUpdate !== -1) {
    images[indexToUpdate] = editedImageUrl;
    localStorage.setItem("generatedImages", JSON.stringify(images));
    renderGallery();
    renderRecentGenerations(); // Update recent generations after edit
    showCustomMessage(
      "Imagen editada y guardada en la galería.",
      "success",
      3000
    );
  } else {
    showCustomMessage(
      "No se pudo encontrar la imagen original en la galería para actualizar.",
      "error",
      3000
    );
  }
  closeImageEditor();
}

function renderFilterThumbnails() {
  DOMElements.filterThumbnails.innerHTML = "";
  const filters = [
    { name: "none", label: "Original", filter: "none" },
    { name: "grayscale", label: "B/N", filter: "grayscale(100%)" },
    { name: "sepia", label: "Sepia", filter: "sepia(100%)" },
    { name: "brightness", label: "Brillo", filter: "brightness(150%)" },
    { name: "contrast", label: "Contraste", filter: "contrast(150%)" },
    { name: "blur", label: "Desenfoque", filter: "blur(3px)" },
    { name: "saturate", label: "Saturar", filter: "saturate(200%)" },
    { name: "invert", label: "Invertir", filter: "invert(100%)" },
  ];

  filters.forEach((filter) => {
    const img = document.createElement("img");
    img.src = originalEditorImage.src;
    img.alt = filter.label;
    img.classList.add(
      "w-20",
      "h-20",
      "object-cover",
      "rounded-lg",
      "cursor-pointer",
      "border-2",
      "border-gray-700",
      "hover:border-cyan-500",
      "transition-all",
      "duration-200"
    );
    img.style.filter = filter.filter;

    img.addEventListener("click", () => {
      applyFilterToCanvas(filter.filter);
      DOMElements.filterThumbnails.querySelectorAll("img").forEach((thumb) => {
        thumb.classList.remove("border-cyan-500", "ring-2");
      });
      img.classList.add("border-cyan-500", "ring-2");
    });
    DOMElements.filterThumbnails.appendChild(img);
  });
}

// --- initApp: la función principal de inicialización ---
function initApp() {
  // Inicializa DOMElements aquí, para asegurarte de que el DOM esté completamente cargado.
  // ¡¡IMPORTANTE!! Usa Object.assign para fusionar con el DOMElements global
  Object.assign(DOMElements, {
    promptInput: document.getElementById("promptInput"),
    generateButton: document.getElementById("generateButton"),
    loadingOverlayModal: document.getElementById("loadingOverlayModal"), // Nuevo modal de carga
    pocoyoGifModal: document.getElementById("pocoyoGifModal"),
    loadingSpinnerModal: document.getElementById("loadingSpinnerModal"),
    loadingMessageTextModal: document.getElementById("loadingMessageTextModal"),
    loadingErrorTextModal: document.getElementById("loadingErrorTextModal"),
    loadingModalCloseButton: document.getElementById("loadingModalCloseButton"),
    generatedImage: document.getElementById("generatedImage"),
    imagePlaceholderText: document.getElementById("imagePlaceholderText"),
    downloadMainImageButton: document.getElementById("downloadMainImageButton"),
    galleryContainer: document.getElementById("galleryContainer"),
    selectAllButton: document.getElementById("selectAllButton"),
    downloadSelectedButton: document.getElementById("downloadSelectedButton"),
    clearSelectionButton: document.getElementById("clearSelectionButton"),
    deleteSelectedButton: document.getElementById("deleteSelectedButton"),
    downloadMessage: document.getElementById("downloadMessage"), // Este puede no ser necesario si se usa el nuevo modal
    lightbox: document.getElementById("lightbox"),
    lightboxImage: document.getElementById("lightboxImage"),
    lightboxCloseButton: document.getElementById("lightboxCloseButton"),
    lightboxPrevButton: document.getElementById("lightboxPrevButton"),
    lightboxNextButton: document.getElementById("lightboxNextButton"),
    lightboxThumbnails: document.getElementById("lightboxThumbnails"),
    promptSuggestionBox: document.getElementById("promptSuggestionBox"),
    generatePromptSuggestionButton: document.getElementById(
      "generatePromptSuggestionButton"
    ),
    promptSuggestionLoading: document.getElementById("promptSuggestionLoading"),
    toneSelect: document.getElementById("toneSelect"),
    improvePromptButton: document.getElementById("improvePromptButton"),
    generationCounter: document.getElementById("generationCounter"),
    watchAdButton: document.getElementById("watchAdButton"),
    imageEditorModal: document.getElementById("imageEditorModal"),
    editorCanvas: document.getElementById("editorCanvas"),
    editorCloseButton: document.getElementById("editorCloseButton"),
    filterThumbnails: document.getElementById("filterThumbnails"),
    editorTextInput: document.getElementById("editorTextInput"),
    editorTextColor: document.getElementById("editorTextColor"),
    editorTextSize: document.getElementById("editorTextSize"),
    editorTextPosition: document.getElementById("editorTextPosition"),
    addTextToCanvasButton: document.getElementById("addTextToCanvasButton"),
    applyCropButton: document.getElementById("applyCropButton"),
    cropWidthInput: document.getElementById("cropWidthInput"),
    cropHeightInput: document.getElementById("cropHeightInput"),
    saveEditedImageButton: document.getElementById("saveEditedImageButton"),
    cancelEditButton: document.getElementById("cancelEditButton"),
    styleSelect: document.getElementById("styleSelect"), // Nuevo select de estilo
    aspectRatioSelect: document.getElementById("aspectRatioSelect"), // Nuevo select de aspecto
    recentGenerationsGallery: document.getElementById(
      "recentGenerationsGallery"
    ), // Galería reciente
    downloadLastGeneratedButton: document.getElementById(
      "downloadLastGeneratedButton"
    ), // Botón de descarga última imagen
  });

  // Cargar estado inicial y actualizar UI (específico de este módulo)
  const storedGenerations = localStorage.getItem("freeGenerationsLeft");
  if (storedGenerations !== null) {
    freeGenerationsLeft = parseInt(storedGenerations, 10);
  } else {
    freeGenerationsLeft = CONFIG.MAX_FREE_GENERATIONS;
    localStorage.setItem("freeGenerationsLeft", freeGenerationsLeft);
  }
  updateGenerationCounterUI();

  const lastImageUrlFromStorage = localStorage.getItem(
    "lastGeneratedImageUrlDisplayed"
  ); // Recuperar la última imagen mostrada
  if (lastImageUrlFromStorage) {
    DOMElements.generatedImage.src = lastImageUrlFromStorage;
    DOMElements.generatedImage.alt = `Última imagen generada`;
    DOMElements.generatedImage.classList.remove("hidden");
    DOMElements.imagePlaceholderText.classList.add("hidden");
    DOMElements.downloadMainImageButton.classList.remove("hidden");
    // No ocultar inmediatamente para que el usuario vea la última imagen al cargar
  } else {
    DOMElements.generatedImage.classList.add("hidden");
    DOMElements.imagePlaceholderText.classList.remove("hidden");
    DOMElements.downloadMainImageButton.classList.add("hidden");
  }
  renderGallery();
  renderRecentGenerations(); // Inicializar galería reciente

  setTimeout(
    showPromptSuggestionBox,
    CONFIG.PROMPT_SUGGESTION_DELAY_SECONDS * 1000
  );

  // --- Configuración de Event Listeners (específicos de este módulo) ---
  DOMElements.generateButton.addEventListener("click", generateImage);
  DOMElements.downloadMainImageButton.addEventListener("click", () => {
    const imageUrl = DOMElements.generatedImage.src;
    if (imageUrl && !imageUrl.includes("placehold.co")) {
      downloadImage(imageUrl, "imagen-generada.png");
    } else {
      showCustomMessage("No hay una imagen válida para descargar.", "error");
    }
  });
  DOMElements.selectAllButton.addEventListener("click", toggleSelectAllImages);
  DOMElements.downloadSelectedButton.addEventListener(
    "click",
    downloadSelectedImages
  );
  DOMElements.clearSelectionButton.addEventListener("click", clearSelection);
  DOMElements.deleteSelectedButton.addEventListener(
    "click",
    deleteSelectedImagesFromGallery
  );

  DOMElements.lightboxCloseButton.addEventListener("click", closeLightbox);
  DOMElements.lightbox.addEventListener("click", (e) => {
    if (e.target === DOMElements.lightbox) {
      closeLightbox();
    }
  });
  DOMElements.lightboxPrevButton.addEventListener("click", showPrevImage);
  DOMElements.lightboxNextButton.addEventListener("click", showNextImage);

  DOMElements.generatePromptSuggestionButton.addEventListener(
    "click",
    generatePromptSuggestion
  );
  DOMElements.improvePromptButton.addEventListener("click", improvePrompt);

  DOMElements.promptInput.addEventListener("input", () => {
    DOMElements.promptSuggestionBox.classList.remove("show");
  });

  DOMElements.watchAdButton.addEventListener("click", watchAdForGenerations);

  // Nuevo listener para descargar la última imagen generada
  DOMElements.downloadLastGeneratedButton.addEventListener("click", () => {
    if (
      lastGeneratedImageUrl &&
      !lastGeneratedImageUrl.includes("placehold.co")
    ) {
      downloadImage(lastGeneratedImageUrl, "ultima-imagen-ia.png");
      showCustomMessage("Última imagen descargada.", "success");
    } else {
      showCustomMessage(
        "No hay una última imagen generada para descargar.",
        "info"
      );
    }
  });

  // Editor de imagen
  if (DOMElements.editorCanvas) {
    editorCtx = DOMElements.editorCanvas.getContext("2d");
  }

  DOMElements.editorCloseButton.addEventListener("click", closeImageEditor);
  DOMElements.cancelEditButton.addEventListener("click", closeImageEditor);
  DOMElements.saveEditedImageButton.addEventListener("click", saveEditedImage);
  DOMElements.addTextToCanvasButton.addEventListener("click", addTextToCanvas);
  DOMElements.applyCropButton.addEventListener("click", applyCrop);
  DOMElements.editorTextInput.addEventListener("input", () => {
    editorTextData.content = DOMElements.editorTextInput.value;
    redrawEditorCanvas();
  });
  DOMElements.editorTextColor.addEventListener("input", () => {
    editorTextData.color = DOMElements.editorTextColor.value;
    redrawEditorCanvas();
  });
  DOMElements.editorTextSize.addEventListener("input", () => {
    editorTextData.size = parseInt(DOMElements.editorTextSize.value);
    redrawEditorCanvas();
  });
  DOMElements.editorTextPosition.addEventListener("change", () => {
    editorTextData.position = DOMElements.editorTextPosition.value;
    redrawEditorCanvas();
  });
  DOMElements.cropWidthInput.addEventListener("input", redrawEditorCanvas);
  DOMElements.cropHeightInput.addEventListener("input", redrawEditorCanvas);

  // Listener para cerrar el nuevo modal de carga/error manualmente
  DOMElements.loadingModalCloseButton.addEventListener(
    "click",
    hideLoadingOverlay
  );
}

// Llama a initApp cuando el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", initApp);
