// js/script.js

// --- Constantes de Configuración ---
const CONFIG = {
  API_BASE_URL: "https://image.pollinations.ai/prompt/",
  MAX_RETRIES: 2,
  RETRY_DELAY_MS: 1500,
  TIMEOUT_MS: 10000,
  MAX_GALLERY_IMAGES: 12,
  PROMPT_SUGGESTION_DELAY_SECONDS: 10,
  // RUTA ACTUALIZADA para tu marca de agua personalizada
  OBELISAI_LOGO_URL: "../img/marca_de_agua.webp",
  IMAGE_CROP_BOTTOM_PX: 60, // Cantidad de píxeles a recortar de la parte inferior
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
  GALLERY_MAX_WIDTH: 600, // Ancho máximo para imágenes guardadas en galería (para optimización)
  GALLERY_JPEG_QUALITY: 0.85, // Calidad JPEG para imágenes de galería (0 a 1)
};

// --- Variables de Estado Globales ---
let freeGenerationsLeft = CONFIG.MAX_FREE_GENERATIONS;
let selectedGalleryImages = new Set();
let currentLightboxIndex = 0;
let fallbackImageIndex = 0;

let editorCtx; // Se inicializa en initApp
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

// --- DOMElements (se inicializará en initApp) ---
let DOMElements;

// --- FUNCIONES ---

/**
 * Descarga una imagen dada su URL.
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
 */
function showCustomMessage(message, type = "info", duration = 3000) {
  DOMElements.messageModalText.textContent = message;
  switch (type) {
    case "success":
      DOMElements.messageModalIcon.textContent = "✔️";
      DOMElements.messageModalIcon.className = "mt-4 text-4xl success";
      break;
    case "error":
      DOMElements.messageModalIcon.textContent = "❌";
      DOMElements.messageModalIcon.className = "mt-4 text-4xl error";
      break;
    case "info":
    default:
      DOMElements.messageModalIcon.textContent = "💡";
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
  DOMElements.messageModalIcon.textContent = "";
  DOMElements.messageModalIcon.className = "mt-4 text-4xl";
}

/**
 * Calcula y muestra el uso del almacenamiento local.
 */
function updateLocalStorageUsage() {
  let totalBytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    totalBytes += localStorage.getItem(key).length * 2; // Multiplicar por 2 para Unicode
  }
  const totalKB = totalBytes / 1024;
  const totalMB = totalKB / 1024;

  let usageText = "";
  if (totalMB >= 1) {
    usageText = `${totalMB.toFixed(2)} MB`;
  } else {
    usageText = `${totalKB.toFixed(2)} KB`;
  }
  DOMElements.localStorageUsage.textContent = `Uso del Almacenamiento Local: ${usageText}`;

  const QUOTA_WARNING_MB = 4; // Umbral de advertencia, localStorage suele ser 5MB
  if (totalMB >= QUOTA_WARNING_MB) {
    showCustomMessage(
      `¡Advertencia! El almacenamiento local se está llenando (${usageText}). Considera limpiar la galería.`,
      "info",
      7000
    );
  }
}

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
        // Si el recorte hace que la imagen sea muy pequeña o nula, simplemente devuelve la imagen original
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
        resolve(canvas.toDataURL("image/png")); // O 'image/webp' si prefieres
      };

      customWatermark.onerror = (e) => {
        console.warn(
          "Error al cargar la imagen de marca de agua (personalizada), la imagen se mostrará sin ella:",
          e
        );
        resolve(canvas.toDataURL("image/png")); // Resolver con la imagen (recortada) original si la marca de agua falla
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
    updateLocalStorageUsage(); // Actualizar el uso después de guardar
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
      '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 S01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>';
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
    await new Promise((resolve) => setTimeout(resolve, 200));
    downloadImage(imageUrl, `seleccion_ia_${downloadCount + 1}.png`);
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
    updateLocalStorageUsage(); // Actualizar uso después de eliminar
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
    updateLocalStorageUsage(); // Actualizar uso después de eliminar
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

function clearSelection() {
  selectedGalleryImages.clear();
  DOMElements.galleryContainer
    .querySelectorAll('input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.checked = false;
      checkbox.closest(".gallery-item-wrapper").classList.remove("selected");
    });
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

function handlePocoyoError() {
  if (DOMElements.pocoyoGif) {
    DOMElements.pocoyoGif.classList.add("hidden");
  }
  if (DOMElements.loadingSpinner) {
    DOMElements.loadingSpinner.classList.remove("hidden");
  }
  console.warn("Pocoyo GIF failed to load, displaying spinner instead.");
}

function updateGenerationCounterUI() {
  DOMElements.generationCounter.textContent = `Generaciones gratuitas restantes: ${freeGenerationsLeft}`;
  const isDisabled = freeGenerationsLeft <= 0;
  DOMElements.generateButton.disabled = isDisabled;
  DOMElements.generateButton.classList.toggle("opacity-50", isDisabled);
  DOMElements.generateButton.classList.toggle("cursor-not-allowed", isDisabled);
  DOMElements.watchAdButton.classList.toggle("hidden", !isDisabled);

  if (isDisabled) {
    showCustomMessage(
      "Has agotado tus generaciones gratuitas. Mira un anuncio para obtener más.",
      "info",
      5000
    );
  }
}

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
  }, 3000);
}

function showPromptSuggestionBox() {
  DOMElements.promptSuggestionBox.classList.add("show");
}

async function generatePromptSuggestion() {
  DOMElements.promptSuggestionLoading.classList.remove("hidden");
  DOMElements.generatePromptSuggestionButton.disabled = true;

  try {
    const promptForLLM =
      "Genera una idea de prompt detallada y creativa para una imagen de IA. Asegúrate de que sea concisa pero inspiradora. Por ejemplo: 'Un bosque místico con árboles bioluminiscentes y criaturas de fantasía, estilo arte digital, iluminación etérea.'";

    let chatHistory = [{ role: "user", parts: [{ text: promptForLLM }] }]; // Prepara el historial para la API

    // Llama a tu serverless function en Vercel, no a la API de Google directamente
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: promptForLLM, // Puedes enviar el prompt original también si tu función proxy lo necesita
        chatHistory: chatHistory, // Envía el historial de chat que será usado por la serverless function
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
    } else {
      throw new Error(
        "Respuesta inesperada de la IA para el prompt a través del proxy."
      );
    }
  } catch (error) {
    console.error("Error al generar prompt sugerido (frontend):", error);
    showCustomMessage(
      `No se pudo generar un prompt. ${error.message}`,
      "error"
    );
  } finally {
    DOMElements.promptSuggestionLoading.classList.add("hidden");
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

  DOMElements.loadingIndicator.classList.remove("hidden");
  DOMElements.pocoyoGif.classList.add("hidden");
  DOMElements.loadingSpinner.classList.remove("hidden");
  DOMElements.loadingMessageText.textContent =
    "Mejorando el prompt... Por favor, espera.";

  DOMElements.improvePromptButton.disabled = true;
  DOMElements.generateButton.disabled = true;
  DOMElements.promptInput.disabled = true;

  try {
    const selectedTone = DOMElements.toneSelect.value;
    const promptForLLM = `Reescribe y expande el siguiente prompt para una imagen de IA. Hazlo mucho más detallado, con al menos ${CONFIG.MIN_IMPROVED_PROMPT_LENGTH} caracteres, y aplica un tono '${selectedTone}'. Solo devuelve el prompt puro, sin comentarios ni texto adicional. Prompt original: '${currentPrompt}'`;

    let chatHistory = [{ role: "user", parts: [{ text: promptForLLM }] }]; // Prepara el historial

    // Llama a tu serverless function en Vercel
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: promptForLLM,
        chatHistory: chatHistory,
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
    showCustomMessage(
      `No se pudo mejorar el prompt. ${error.message}`,
      "error"
    );
  } finally {
    DOMElements.loadingIndicator.classList.add("hidden");
    DOMElements.pocoyoGif.classList.add("hidden");
    DOMElements.loadingSpinner.classList.add("hidden");
    DOMElements.improvePromptButton.disabled = false;
    DOMElements.generateButton.disabled = false;
    DOMElements.promptInput.disabled = false;
    DOMElements.loadingMessageText.textContent = "";
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

  DOMElements.loadingIndicator.classList.remove("hidden");
  DOMElements.pocoyoGif.classList.remove("hidden");
  DOMElements.loadingSpinner.classList.add("hidden");
  DOMElements.generatedImage.classList.add("hidden");
  DOMElements.imagePlaceholderText.classList.add("hidden");
  DOMElements.downloadMainImageButton.classList.add("hidden");
  DOMElements.promptSuggestionBox.classList.remove("show");

  if (DOMElements.pocoyoGif) {
    DOMElements.pocoyoGif.onerror = handlePocoyoError;
  }

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
      // Procesa la imagen con tu marca de agua ANTES de la galería
      processedImageUrl = await processImageWithLogo(originalImageUrl);

      const optimizedImageUrlForGallery = await processImageForGallery(
        processedImageUrl
      ); // Optimiza la imagen ya con tu marca de agua

      saveImageToGallery(optimizedImageUrlForGallery); // Guarda la imagen optimizada en localStorage

      success = true;

      freeGenerationsLeft--;
      localStorage.setItem("freeGenerationsLeft", freeGenerationsLeft);
      updateGenerationCounterUI();
    } catch (error) {
      console.warn(`Intento ${attemptCount + 1} fallido: ${error.message}`);
      if (attemptCount === CONFIG.MAX_RETRIES) {
        showCustomMessage(
          `Todos los intentos para generar la imagen con IA fallaron: ${error.message}.`,
          "error"
        );
        handlePocoyoError();
      } else {
        await new Promise((resolve) =>
          setTimeout(resolve, CONFIG.RETRY_DELAY_MS)
        );
      }
    }
  }

  if (success && processedImageUrl) {
    DOMElements.generatedImage.src = processedImageUrl; // Muestra la imagen FINAL PROCESADA (con tu marca de agua)
    DOMElements.generatedImage.alt = `Imagen generada: ${prompt}`;
    DOMElements.generatedImage.classList.remove("hidden");
    DOMElements.imagePlaceholderText.classList.add("hidden");
    DOMElements.downloadMainImageButton.classList.remove("hidden"); // Botón de descarga principal debería descargar la procesada

    await new Promise((resolve) => setTimeout(resolve, 1500));

    renderGallery(); // La galería ya se actualiza con la versión optimizada

    DOMElements.generatedImage.src =
      "https://placehold.co/600x400/374151/D1D5DB?text=Tu+imagen+aparecerá+aquí";
    DOMElements.generatedImage.alt = "Placeholder para imagen generada por IA";
    DOMElements.generatedImage.classList.add("hidden");
    DOMElements.imagePlaceholderText.classList.remove("hidden");
    DOMElements.downloadMainImageButton.classList.add("hidden");

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

  DOMElements.loadingIndicator.classList.add("hidden");
  DOMElements.pocoyoGif.classList.add("hidden");
  DOMElements.loadingSpinner.classList.add("hidden");
}

function showCookieConsent() {
  if (!localStorage.getItem("cookieAccepted")) {
    DOMElements.cookieConsent.classList.add("show");
  }
}

function acceptCookies() {
  localStorage.setItem("cookieAccepted", "true");
  DOMElements.cookieConsent.classList.remove("show");
  if (
    !localStorage.getItem("subscribed") &&
    !localStorage.getItem("noThanksSubscription")
  ) {
    showSubscriptionModal();
  }
}

function showSubscriptionModal() {
  if (
    !localStorage.getItem("subscribed") &&
    !localStorage.getItem("noThanksSubscription")
  ) {
    DOMElements.subscriptionModal.classList.add("show");
  }
}

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

function dismissSubscription() {
  localStorage.setItem("noThanksSubscription", "true");
  DOMElements.subscriptionModal.classList.remove("show");
}

function updateActiveClass() {
  const navLinks = document.querySelectorAll(".navbar-inner-content a");
  const submenuItems = document.querySelectorAll(".submenu-item");
  const navItemParents = document.querySelectorAll(".nav-item.group");

  const currentPath = window.location.pathname;

  navLinks.forEach((link) => {
    link.classList.remove("active-link");
    link.removeAttribute("aria-current");
  });
  submenuItems.forEach((item) => {
    item.classList.remove("active-link");
  });
  navItemParents.forEach((parent) => {
    parent
      .querySelector("span.cursor-pointer")
      ?.classList.remove("active-link");
  });

  const normalizePath = (path) => {
    let normalized = path;
    if (normalized.endsWith("/index.html")) {
      normalized = normalized.replace("/index.html", "/");
    }
    if (!normalized.endsWith("/")) {
      normalized += "/";
    }
    return normalized;
  };

  const normalizedCurrentPath = normalizePath(currentPath);

  document
    .querySelectorAll(".navbar-inner-content a, .submenu-item")
    .forEach((item) => {
      const href = item.getAttribute("href");
      if (href) {
        const itemPath = normalizePath(
          new URL(href, window.location.origin).pathname
        );

        if (itemPath === "/" && normalizedCurrentPath === "/") {
          item.classList.add("active-link");
          item.setAttribute("aria-current", "page");
        } else if (
          itemPath !== "/" &&
          normalizedCurrentPath.startsWith(itemPath)
        ) {
          item.classList.add("active-link");
          item.setAttribute("aria-current", "page");

          const parentSubmenu = item.closest(".submenu");
          if (parentSubmenu) {
            const parentNavItem = parentSubmenu.closest(".nav-item.group");
            if (parentNavItem) {
              parentNavItem
                .querySelector("span.cursor-pointer")
                ?.classList.add("active-link");
            }
          }
        }
      }
    });
}

function openImageEditor(imageUrl) {
  editingImageUrl = imageUrl;
  originalEditorImage.src = imageUrl;
  originalEditorImage.onload = () => {
    editorCanvas.width = originalEditorImage.naturalWidth;
    editorCanvas.height = originalEditorImage.naturalHeight;
    editorCtx = editorCanvas.getContext("2d");
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

  editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);

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

  if (
    cropW < originalEditorImage.naturalWidth ||
    cropH < originalEditorImage.naturalHeight
  ) {
    drawX = (originalEditorImage.naturalWidth - cropW) / 2;
    drawY = (originalEditorImage.naturalHeight - cropH) / 2;
    drawW = cropW;
    drawH = cropH;
  }

  editorCtx.drawImage(
    originalEditorImage,
    drawX,
    drawY,
    drawW,
    drawH,
    0,
    0,
    editorCanvas.width,
    editorCanvas.height
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
        textX =
          editorCanvas.width -
          editorCtx.measureText(editorTextData.content).width -
          margin;
        textY = margin;
        break;
      case "bottomLeft":
        textX = margin;
        textY = editorCanvas.height - editorTextData.size - margin;
        break;
      case "center":
        textX =
          (editorCanvas.width -
            editorCtx.measureText(editorTextData.content).width) /
          2;
        textY = (editorCanvas.height - editorTextData.size) / 2;
        break;
      case "bottomRight":
      default:
        textX =
          editorCanvas.width -
          editorCtx.measureText(editorTextData.content).width -
          margin;
        textY = editorCanvas.height - editorTextData.size - margin;
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
  editorCtx.drawImage(
    originalEditorImage,
    0,
    0,
    editorCanvas.width,
    editorCanvas.height
  );
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

  tempCanvas.width = width;
  tempCanvas.height = height;

  const sourceX = (originalEditorImage.naturalWidth - width) / 2;
  const sourceY = (originalEditorImage.naturalHeight - height) / 2;

  const finalSourceX = Math.max(0, sourceX);
  const finalSourceY = Math.max(0, sourceY);
  const finalSourceWidth = Math.min(
    width,
    originalEditorImage.naturalWidth - finalSourceX
  );
  const finalSourceHeight = Math.min(
    height,
    originalEditorImage.naturalHeight - finalSourceY
  );

  tempCtx.drawImage(
    originalEditorImage,
    finalSourceX,
    finalSourceY,
    finalSourceWidth,
    finalSourceHeight,
    0,
    0,
    width,
    height
  );

  originalEditorImage.src = tempCanvas.toDataURL("image/png");
  originalEditorImage.onload = () => {
    editorCanvas.width = originalEditorImage.naturalWidth;
    editorCanvas.height = originalEditorImage.naturalHeight;
    redrawEditorCanvas();
    showCustomMessage("Imagen recortada con éxito.", "success", 2000);
  };
}

function saveEditedImage() {
  const editedImageUrl = editorCanvas.toDataURL("image/png");

  let images = loadGalleryImages();
  const indexToUpdate = images.findIndex((url) => url === editingImageUrl);

  if (indexToUpdate !== -1) {
    images[indexToUpdate] = editedImageUrl;
    localStorage.setItem("generatedImages", JSON.stringify(images));
    renderGallery();
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
  DOMElements = {
    promptInput: document.getElementById("promptInput"),
    generateButton: document.getElementById("generateButton"),
    loadingIndicator: document.getElementById("loadingIndicator"),
    pocoyoGif: document.getElementById("pocoyoGif"),
    loadingSpinner: document.getElementById("loadingSpinner"),
    localStorageUsage: document.getElementById("localStorageUsage"),
    loadingMessageText: document.getElementById("loadingMessageText"),
    generatedImage: document.getElementById("generatedImage"),
    imagePlaceholderText: document.getElementById("imagePlaceholderText"),
    downloadMainImageButton: document.getElementById("downloadMainImageButton"),
    galleryContainer: document.getElementById("galleryContainer"),
    selectAllButton: document.getElementById("selectAllButton"),
    downloadSelectedButton: document.getElementById("downloadSelectedButton"),
    clearSelectionButton: document.getElementById("clearSelectionButton"),
    deleteSelectedButton: document.getElementById("deleteSelectedButton"),
    downloadMessage: document.getElementById("downloadMessage"),
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
    cookieConsent: document.getElementById("cookieConsent"),
    acceptCookiesButton: document.getElementById("acceptCookiesButton"),
    subscriptionModal: document.getElementById("subscriptionModal"),
    emailInput: document.getElementById("emailInput"),
    subscribeButton: document.getElementById("subscribeButton"),
    noThanksButton: document.getElementById("noThanksButton"),
    messageModal: document.getElementById("messageModal"),
    messageModalCloseButton: document.getElementById("messageModalCloseButton"),
    messageModalText: document.getElementById("messageModalText"),
    messageModalIcon: document.getElementById("messageModalIcon"),
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
    menuToggle: document.getElementById("menuToggle"),
    navLinksContainer: document.querySelector(
      ".navbar-inner-content .flex-wrap"
    ),
  };

  // Actualizar el uso del almacenamiento local al inicio
  updateLocalStorageUsage();

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
    DOMElements.generatedImage.src = lastImageUrl;
    DOMElements.generatedImage.alt = `Última imagen generada`;
    DOMElements.generatedImage.classList.remove("hidden");
    DOMElements.imagePlaceholderText.classList.add("hidden");
    DOMElements.downloadMainImageButton.classList.remove("hidden");

    setTimeout(() => {
      DOMElements.generatedImage.src =
        "https://placehold.co/600x400/374151/D1D5DB?text=Tu+imagen+aparecerá+aquí";
      DOMElements.generatedImage.alt =
        "Placeholder para imagen generada por IA";
      DOMElements.generatedImage.classList.add("hidden");
      DOMElements.imagePlaceholderText.classList.remove("hidden");
      DOMElements.downloadMainImageButton.classList.add("hidden");
    }, 2000);
  } else {
    DOMElements.generatedImage.classList.add("hidden");
    DOMElements.imagePlaceholderText.classList.remove("hidden");
  }
  renderGallery();
  showCookieConsent();

  setTimeout(
    showPromptSuggestionBox,
    CONFIG.PROMPT_SUGGESTION_DELAY_SECONDS * 1000
  );

  // --- Configuración de Event Listeners ---
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

  DOMElements.acceptCookiesButton.addEventListener("click", acceptCookies);
  DOMElements.subscribeButton.addEventListener("click", handleSubscription);
  DOMElements.noThanksButton.addEventListener("click", dismissSubscription);

  DOMElements.generatePromptSuggestionButton.addEventListener(
    "click",
    generatePromptSuggestion
  );
  DOMElements.improvePromptButton.addEventListener("click", improvePrompt);

  DOMElements.promptInput.addEventListener("input", () => {
    DOMElements.promptSuggestionBox.classList.remove("show");
  });

  DOMElements.watchAdButton.addEventListener("click", watchAdForGenerations);

  DOMElements.messageModalCloseButton.addEventListener(
    "click",
    hideCustomMessage
  );
  DOMElements.messageModal.addEventListener("click", (event) => {
    if (event.target === DOMElements.messageModal) {
      hideCustomMessage();
    }
  });

  // Editor de imagen
  // Asegurarse de que editorCanvas existe antes de obtener el contexto
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

  // Navegación responsive
  DOMElements.menuToggle.addEventListener("click", () => {
    DOMElements.navLinksContainer.classList.toggle("active");
    DOMElements.menuToggle.querySelector("i").classList.toggle("fa-bars");
    DOMElements.menuToggle.querySelector("i").classList.toggle("fa-times");
  });

  document.addEventListener("click", (event) => {
    const isClickInsideNav = DOMElements.navLinksContainer.contains(
      event.target
    );
    const isClickOnToggle =
      DOMElements.menuToggle && DOMElements.menuToggle.contains(event.target);

    if (
      !isClickInsideNav &&
      !isClickOnToggle &&
      DOMElements.navLinksContainer.classList.contains("active")
    ) {
      DOMElements.navLinksContainer.classList.remove("active");
      if (DOMElements.menuToggle) {
        DOMElements.menuToggle.querySelector("i").classList.remove("fa-times");
        DOMElements.menuToggle.querySelector("i").classList.add("fa-bars");
      }
    }
  });

  DOMElements.navLinksContainer.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        DOMElements.navLinksContainer.classList.remove("active");
        if (DOMElements.menuToggle) {
          DOMElements.menuToggle
            .querySelector("i")
            .classList.remove("fa-times");
          DOMElements.menuToggle.querySelector("i").classList.add("fa-bars");
        }
      }
    });
  });

  updateActiveClass();
}

// Llama a initApp cuando el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", initApp);
