// --- Referencias de Elementos del DOM (declaradas aquí para acceso global, asignadas en DOMContentLoaded) ---
let imageUpload;
let fileNameSpan;
let imageCanvas;
let ctx;
let placeholderText;
let cropOverlay;
let fileUploadLabel; // Declared here for global access
let mainNavbar; // Reference to the main navigation bar

// Menu Bar Buttons
let fileMenuBtn;
let fileMenuDropdown;
let editMenuBtn;
let editMenuDropdown;
let imageMenuBtn;
let imageMenuDropdown;
let filtersMenuBtn;
let filtersMenuDropdown;
let toolsMenuBtn;
let toolsMenuDropdown;

// Menu Dropdown Items
let menuLoadImageBtn;
let menuDownloadImageBtn;
let menuResetImageBtn;
let menuClearCanvasBtn;
let menuUndoBtn;
let menuRedoBtn;
let menuRotateLeftBtn;
let menuRotateRightBtn;
let menuFlipHorizontalBtn;
let menuFlipVerticalBtn;
let menuResizeBtn;
let menuCropTool;
let menuDistortTool;
let menuBrightnessContrastBtn;
let menuSaturationHueBtn;
let menuExposureGammaBtn;
let menuLevelsBtn;
let menuColorBalanceBtn;
let menuVibranceBtn;
let menuGrayscaleBtn;
let menuSepiaBtn;
let menuInvertBtn;
let menuBlurBtn;
let menuSharpenBtn;
let menuPixelateBtn;
let menuVignetteBtn;
let menuNoiseBtn;
let menuEmbossBtn;
let menuPosterizeBtn;
let menuDuotoneBtn;
let menuBwControlBtn;
let menuWarmFilterBtn;
let menuCoolFilterBtn;
let brushTool; // Correctly declared here
let eraserTool; // Correctly declared here
let lineTool; // Correctly declared here
let textTool; // Correctly declared here
let rectangleTool; // Correctly declared here
let circleTool; // Correctly declared here
let triangleTool; // Correctly declared here
let eyedropperTool; // Correctly declared here
let fillTool; // Correctly declared here
let rectSelectTool; // Correctly declared here
let lassoTool; // Correctly declared here
let magicWandTool; // Correctly declared here
let flattenLayersBtn; // Correctly declared here
let mergeVisibleBtn; // Correctly declared here

// Sidebar Elements
let activeToolDisplay;
let colorPicker;
let lineWidthRange;
let lineWidthValue;
let brushHardnessRange;
let brushHardnessValue;
let globalOpacityRange;
let globalOpacityValue;
let textOptions;
let textInput;
let fontFamilySelect;
let boldTextBtn;
let italicTextBtn;
let fontSizeRange;
let fontSizeValue;
let resizeOptions;
let resizeWidthInput;
let resizeHeightInput;
let resizeBtn;
let cropOptions;
let applyCropBtn;
let cancelCropBtn;

let brightnessRange;
let brightnessValue;
let contrastRange;
let contrastValue;
let saturationRange;
let saturationValue;
let hueRotateRange;
let hueRotateValue;
let exposureRange;
let exposureValue;
let gammaRange;
let gammaValue;
let blurIntensityRange; // New slider for blur intensity
let blurIntensityValue; // New value display for blur intensity
let sharpenIntensityRange; // New slider for sharpen intensity
let sharpenIntensityValue; // New value display for sharpen intensity

let undoBtn;
let redoBtn;
let downloadCounter;
let watchAdButton;

let messageArea;
let loadingSpinner;

// Modals
let cookieConsent;
let acceptCookiesButton;
let subscriptionModal;
let emailInput;
let subscribeButton;
let noThanksButton;

// --- Variables de Estado Globales ---
let originalImage = null; // La imagen original cargada
let currentImageBuffer = null; // Un canvas temporal para aplicar efectos y mantener el estado intermedio
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let activeTool = "brush"; // 'brush', 'eraser', 'text', 'line', 'rectangle', 'circle', 'triangle', 'eyedropper', 'crop'
let isShapeDrawing = false;
let startShapeX, startShapeY;

// Crop variables
let isCropping = false;
let cropStartX, cropStartY, cropCurrentX, cropCurrentY;

// Text variables
let currentFontFamily = "Inter, sans-serif";
let isBold = false;
let isItalic = false;

// Historial para deshacer/rehacer (almacena DataURLs de los estados del canvas)
let history = [];
let historyIndex = -1;

// Constantes para el límite de descargas
const MAX_FREE_DOWNLOADS = 5;
const DOWNLOADS_PER_AD_WATCH = 3;
let freeDownloadsLeft = MAX_FREE_DOWNLOADS; // Se inicializa desde localStorage al cargar

// --- Funciones de Utilidad y UI ---

/**
 * Muestra un mensaje al usuario en el área de mensajes.
 * @param {string} text - El texto del mensaje.
 * @param {string} type - El tipo de mensaje ('success', 'error', 'warning').
 */
function showMessage(text, type) {
  if (messageArea) {
    // Check if messageArea is defined
    messageArea.textContent = text;
    messageArea.className = `message ${type}`;
    messageArea.classList.remove("hidden");
    if (type !== "error") {
      setTimeout(() => {
        hideMessage();
      }, 4000);
    }
  } else {
    console.warn("Message area not found, cannot display message:", text);
  }
}

/**
 * Oculta el área de mensajes.
 */
function hideMessage() {
  if (messageArea) {
    messageArea.classList.add("hidden");
  }
}

/**
 * Muestra u oculta el spinner de carga y deshabilita/habilita los botones.
 * @param {boolean} show - Verdadero para mostrar el spinner y deshabilitar botones, falso para ocultar y habilitar.
 */
function toggleLoading(show) {
  if (loadingSpinner) loadingSpinner.style.display = show ? "block" : "none";
  // Deshabilitar/Habilitar todos los botones y sliders mientras carga
  const allControls = document.querySelectorAll(
    'button, input[type="file"], input[type="range"], input[type="color"], input[type="text"], select'
  );
  allControls.forEach((control) => {
    // Special handling for download and ad buttons
    if (control.id === "menuDownloadImageBtn" || control.id === "downloadBtn") {
      // Both download buttons
      control.disabled =
        show || !originalImage || (freeDownloadsLeft <= 0 && !show);
      control.classList.toggle(
        "disabled-btn",
        show || !originalImage || (freeDownloadsLeft <= 0 && !show)
      );
    } else if (control.id === "watchAdButton") {
      control.disabled = show; // Deshabilitar durante la carga general
      control.classList.toggle("disabled-btn", show);
    } else if (
      control.id === "imageUpload" ||
      control.id === "fileUploadLabel"
    ) {
      // Both load buttons
      control.disabled = false; // Always enable image upload
    } else if (
      control.id === "menuResetImageBtn" ||
      control.id === "menuClearCanvasBtn"
    ) {
      control.disabled = show || !originalImage;
      control.classList.toggle("disabled-btn", show || !originalImage);
    } else {
      control.disabled = show;
      control.classList.toggle("disabled-btn", show);
    }
  });

  // Adjust undo/redo/reset state specifically if not loading
  if (!show) {
    updateUndoRedoButtons();
  }
  updateDownloadCounterUI(); // Ensure counter and download button state are updated
}

/**
 * Dibuja la imagen en el canvas principal, ajustando su tamaño visualmente.
 * @param {HTMLImageElement|HTMLCanvasElement} img - La imagen o canvas a dibujar.
 */
function drawImageOnCanvas(img) {
  if (placeholderText) placeholderText.classList.add("hidden");
  if (imageCanvas && ctx) {
    // Ensure both canvas and its context are available
    imageCanvas.width = img.width;
    imageCanvas.height = img.height;

    const parentWidth = imageCanvas.parentElement.clientWidth;
    const parentHeight = imageCanvas.parentElement.clientHeight;

    let ratio = 1;
    if (img.width > parentWidth) {
      ratio = parentWidth / img.width;
    }
    if (img.height * ratio > parentHeight && img.height * ratio !== 0) {
      ratio = parentHeight / img.height;
    }

    imageCanvas.style.width = `${img.width * ratio}px`;
    imageCanvas.style.height = `${img.height * ratio}px`;

    ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
    ctx.drawImage(img, 0, 0);
  }
}

/**
 * Guarda el estado actual del canvas en el historial.
 * Se llama después de cada operación de edición significativa.
 */
function saveState() {
  if (historyIndex < history.length - 1) {
    history = history.slice(0, historyIndex + 1);
  }
  if (imageCanvas) {
    history.push(imageCanvas.toDataURL());
    historyIndex++;
    updateUndoRedoButtons();
  }
}

/**
 * Restaura un estado del historial en el canvas.
 * @param {string} dataURL - La DataURL del estado a restaurar.
 */
function restoreState(dataURL) {
  const img = new Image();
  img.onload = () => {
    drawImageOnCanvas(img);
    currentImageBuffer = document.createElement("canvas");
    currentImageBuffer.width = img.width;
    currentImageBuffer.height = img.height;
    const bufferCtx = currentImageBuffer.getContext("2d");
    bufferCtx.drawImage(img, 0, 0);
    updateUndoRedoButtons();
  };
  img.src = dataURL;
}

/**
 * Actualiza el estado de los botones Deshacer y Rehacer.
 */
function updateUndoRedoButtons() {
  if (undoBtn) {
    undoBtn.disabled = historyIndex <= 0;
    undoBtn.classList.toggle("disabled-btn", historyIndex <= 0);
  }
  if (redoBtn) {
    redoBtn.disabled = historyIndex >= history.length - 1;
    redoBtn.classList.toggle(
      "disabled-btn",
      historyIndex >= history.length - 1
    );
  }

  // Also update menu buttons
  if (menuUndoBtn) menuUndoBtn.disabled = historyIndex <= 0;
  if (menuRedoBtn) menuRedoBtn.disabled = historyIndex >= history.length - 1;
}

/**
 * Aplica ajustes (brillo, contraste, saturación, tonalidad, exposición, gamma) a una imagen.
 * @param {HTMLImageElement|HTMLCanvasElement} img - La imagen/canvas original.
 * @param {number} brightness - Brillo (-100 a 100).
 * @param {number} contrast - Contraste (-100 a 100).
 * @param {number} saturation - Saturación (0 a 200).
 * @param {number} hueRotate - Tonalidad (0 a 360).
 * @param {number} exposure - Exposición (-100 a 100).
 * @param {number} gamma - Gamma (0.01 a 3.0, mapeado de 1 a 300).
 */
function applyAdjustments(
  img,
  brightness,
  contrast,
  saturation,
  hueRotate,
  exposure,
  gamma
) {
  if (!img || !ctx) return;

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  tempCanvas.width = img.width;
  tempCanvas.height = img.height;
  tempCtx.drawImage(img, 0, 0);

  const imageData = tempCtx.getImageData(
    0,
    0,
    tempCanvas.width,
    tempCanvas.height
  );
  const pixels = imageData.data;

  const brightFactor = brightness / 100;
  const contrastFactor = contrast / 100 + 1;
  const saturationFactor = saturation / 100;
  const hueRadians = (hueRotate * Math.PI) / 180;
  const exposureFactor = exposure / 100;
  const gammaFactor = gamma / 100; // gamma from 1 to 300 maps to 0.01 to 3.0

  // Pre-calculate hue matrix for performance
  const cosHue = Math.cos(hueRadians);
  const sinHue = Math.sin(hueRadians);
  const hueMatrix = [
    [
      0.213 + cosHue * 0.787 - sinHue * 0.213,
      0.715 - cosHue * 0.715 - sinHue * 0.715,
      0.072 - cosHue * 0.072 + sinHue * 0.928,
    ],
    [
      0.213 - cosHue * 0.213 + sinHue * 0.143,
      0.715 + cosHue * 0.285 + sinHue * 0.14,
      0.072 - cosHue * 0.072 - sinHue * 0.283,
    ],
    [
      0.213 - cosHue * 0.213 - sinHue * 0.787,
      0.715 - cosHue * 0.715 + sinHue * 0.072,
      0.072 + cosHue * 0.928 + sinHue * 0.072,
    ],
  ];

  for (let i = 0; i < pixels.length; i += 4) {
    let r = pixels[i];
    let g = pixels[i + 1];
    let b = pixels[i + 2];

    // Exposure
    r = r * (1 + exposureFactor * 2); // Simple multiplicative exposure
    g = g * (1 + exposureFactor * 2);
    b = b * (1 + exposureFactor * 2);

    // Brightness
    r += brightFactor * 255;
    g += brightFactor * 255;
    b += brightFactor * 255;

    // Contrast (midpoint 128)
    r = (r - 128) * contrastFactor + 128;
    g = (g - 128) * contrastFactor + 128;
    b = (b - 128) * contrastFactor + 128;

    // Saturation (luminance weighting for simple desaturation/oversaturation)
    const avg = (r + g + b) / 3;
    r = avg + (r - avg) * saturationFactor;
    g = avg + (g - avg) * saturationFactor;
    b = avg + (b - avg) * saturationFactor;

    // Hue (color matrix)
    const originalR = r;
    const originalG = g;
    const originalB = b;

    r =
      originalR * hueMatrix[0][0] +
      originalG * hueMatrix[0][1] +
      originalB * hueMatrix[0][2];
    g =
      originalR * hueMatrix[1][0] +
      originalG * hueMatrix[1][1] +
      originalB * hueMatrix[1][2];
    b =
      originalR * hueMatrix[2][0] +
      originalG * hueMatrix[2][1] +
      originalB * hueMatrix[2][2];

    // Gamma (power function)
    r = 255 * Math.pow(r / 255, 1 / gammaFactor);
    g = 255 * Math.pow(g / 255, 1 / gammaFactor);
    b = 255 * Math.pow(b / 255, 1 / gammaFactor);

    // Clamp values
    pixels[i] = Math.max(0, Math.min(255, r));
    pixels[i + 1] = Math.max(0, Math.min(255, g));
    pixels[i + 2] = Math.max(0, Math.min(255, b));
  }
  tempCtx.putImageData(imageData, 0, 0);

  if (currentImageBuffer) {
    // Check before drawing
    currentImageBuffer.width = tempCanvas.width;
    currentImageBuffer.height = tempCanvas.height;
    currentImageBuffer.getContext("2d").drawImage(tempCanvas, 0, 0);
  }
  drawImageOnCanvas(currentImageBuffer);
}

// --- Eventos de Carga de Imagen ---
// imageUpload and menuLoadImageBtn event listeners are moved to DOMContentLoaded

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    if (fileNameSpan) fileNameSpan.textContent = file.name;
    hideMessage();
    toggleLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        originalImage = img;
        currentImageBuffer = document.createElement("canvas");
        currentImageBuffer.width = originalImage.width;
        currentImageBuffer.height = originalImage.height;
        currentImageBuffer.getContext("2d").drawImage(originalImage, 0, 0);

        drawImageOnCanvas(currentImageBuffer);

        history = [];
        historyIndex = -1;
        saveState();
        toggleLoading(false);
        showMessage("Imagen cargada y lista para editar.", "success");

        // Enable relevant controls after image load
        const controlsToEnable = document.querySelectorAll(
          ".tool-group button, .tool-group input, .tool-group select, .action-buttons button"
        );
        controlsToEnable.forEach((control) => {
          if (
            control.id !== "imageUpload" &&
            control.id !== "fileUploadLabel"
          ) {
            // These are always enabled
            control.disabled = false;
            control.classList.remove("disabled-btn");
          }
        });
        updateDownloadCounterUI(); // Re-evaluate download button
        // Reset crop state
        isCropping = false;
        if (cropOverlay) cropOverlay.classList.add("hidden");
        if (cropOptions) cropOptions.classList.add("hidden"); // Ensure crop options are hidden
        if (imageCanvas) imageCanvas.style.cursor = "default";
        // Use the click handler directly for brushTool to ensure proper state setup
        if (brushTool)
          setupToolButtons(
            brushTool
          ); // Ensure brushTool is initialized and activate it
        else if (activeToolDisplay) activeToolDisplay.textContent = "Pincel"; // Fallback if brushTool not yet init
        if (resizeOptions) resizeOptions.classList.add("hidden"); // Ensure resize options are hidden
      };
      img.onerror = () => {
        showMessage(
          "No se pudo cargar la imagen. Asegúrate de que es un archivo de imagen válido.",
          "error"
        );
        if (fileNameSpan)
          fileNameSpan.textContent = "Ningún archivo seleccionado";
        resetEditorState();
        toggleLoading(false);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    resetEditorState();
    hideMessage();
  }
}

// Función para resetear el estado del editor
function resetEditorState() {
  originalImage = null;
  currentImageBuffer = null;
  history = [];
  historyIndex = -1;
  if (ctx && imageCanvas)
    ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
  if (imageCanvas) {
    imageCanvas.style.width = "";
    imageCanvas.style.height = "";
  }
  if (placeholderText) placeholderText.classList.remove("hidden");
  if (fileNameSpan) fileNameSpan.textContent = "Ningún archivo seleccionado";

  const controlsToDisable = document.querySelectorAll(
    ".tool-group button, .tool-group input, .tool-group select, .action-buttons button"
  );
  controlsToDisable.forEach((control) => {
    if (control.id !== "imageUpload" && control.id !== "fileUploadLabel") {
      // Keep load buttons enabled
      control.disabled = true;
      control.classList.add("disabled-btn");
    }
  });

  // Reset slider values and text content, ensuring elements exist
  if (brightnessRange) brightnessRange.value = 0;
  if (brightnessValue) brightnessValue.textContent = "0";
  if (contrastRange) contrastRange.value = 0;
  if (contrastValue) contrastValue.textContent = "0";
  if (saturationRange) saturationRange.value = 100;
  if (saturationValue) saturationValue.textContent = "100%";
  if (hueRotateRange) hueRotateRange.value = 0;
  if (hueRotateValue) hueRotateValue.textContent = "0°";
  if (exposureRange) exposureRange.value = 0;
  if (exposureValue) exposureValue.textContent = "0";
  if (gammaRange) gammaRange.value = 100;
  if (gammaValue) gammaValue.textContent = "1.0";
  if (blurIntensityRange) blurIntensityRange.value = 0;
  if (blurIntensityValue) blurIntensityValue.textContent = "0";
  if (sharpenIntensityRange) sharpenIntensityRange.value = 0;
  if (sharpenIntensityValue) sharpenIntensityValue.textContent = "0";
  if (textInput) textInput.value = "";
  if (fontSizeRange) fontSizeRange.value = 30;
  if (fontSizeValue) fontSizeValue.textContent = "30px";
  if (lineWidthRange) lineWidthRange.value = 5;
  if (lineWidthValue) lineWidthValue.textContent = "5px";
  if (brushHardnessRange) brushHardnessRange.value = 50;
  if (brushHardnessValue) brushHardnessValue.textContent = "50%";
  if (globalOpacityRange) globalOpacityRange.value = 100;
  if (globalOpacityValue) globalOpacityValue.textContent = "100%";
  if (resizeWidthInput) resizeWidthInput.value = "";
  if (resizeHeightInput) resizeHeightInput.value = "";

  updateUndoRedoButtons();
  if (textOptions) textOptions.classList.add("hidden");
  if (resizeOptions) resizeOptions.classList.add("hidden");
  if (cropOptions) cropOptions.classList.add("hidden");
  if (brushTool)
    setupToolButtons(
      brushTool
    ); // Set brush as default active tool using the common function
  else if (activeToolDisplay) activeToolDisplay.textContent = "Pincel"; // Fallback if brushTool not yet init

  isCropping = false; // Reset crop state
  if (cropOverlay) cropOverlay.classList.add("hidden");
  if (imageCanvas) imageCanvas.style.cursor = "default";
}

// --- Configuración de Herramientas ---
let drawingToolButtons = []; // Array will be populated in DOMContentLoaded

function setupToolButtons(toolBtn) {
  if (!originalImage) {
    showMessage(
      "Carga una imagen antes de seleccionar una herramienta.",
      "warning"
    );
    return;
  }
  // Deactivate all tool buttons visually
  document
    .querySelectorAll(".tool-btn.active")
    .forEach((btn) => btn.classList.remove("active"));

  // Activate the clicked tool button visually
  if (toolBtn) {
    // Add null check
    toolBtn.classList.add("active");
  }

  activeTool = toolBtn.id.replace("Tool", "").replace("Btn", "").toLowerCase();
  if (activeToolDisplay)
    activeToolDisplay.textContent = toolBtn.textContent
      .trim()
      .replace(/[\uD800-\uDFFF].\s/g, ""); // Remove emojis and extra space

  // Hide all special options
  if (textOptions) textOptions.classList.add("hidden");
  if (resizeOptions) resizeOptions.classList.add("hidden");
  if (cropOptions) cropOptions.classList.add("hidden");
  if (cropOverlay) cropOverlay.classList.add("hidden"); // Ensure crop overlay is hidden
  if (imageCanvas) imageCanvas.style.cursor = "default"; // Reset cursor

  if (ctx && globalOpacityRange) {
    ctx.globalCompositeOperation =
      activeTool === "eraser" ? "destination-out" : "source-over";
    ctx.globalAlpha = parseInt(globalOpacityRange.value) / 100;
  }

  // Show specific UI for active tool
  if (activeTool === "text") {
    if (textOptions) textOptions.classList.remove("hidden");
    showMessage(
      "Herramienta: Texto seleccionada. Haz clic en el canvas para añadir texto.",
      "success"
    );
  } else if (activeTool === "resize") {
    // Activated by menuResizeBtn
    if (resizeOptions) resizeOptions.classList.remove("hidden");
    showMessage(
      "Herramienta: Redimensionar seleccionada. Ingresa nuevas dimensiones.",
      "success"
    );
  } else if (activeTool === "crop") {
    isCropping = true;
    if (imageCanvas) imageCanvas.style.cursor = "crosshair";
    if (cropOptions) cropOptions.classList.remove("hidden");
    if (cropOverlay) cropOverlay.classList.remove("hidden"); // Show overlay when crop tool is active
    showMessage(
      "Herramienta: Recortar seleccionada. Arrastra para seleccionar un área.",
      "success"
    );
  } else if (activeTool === "eyedropper") {
    if (imageCanvas) imageCanvas.style.cursor = "crosshair";
    showMessage(
      "Herramienta: Cuentagotas seleccionada. Haz clic en el canvas para seleccionar un color.",
      "success"
    );
  } else {
    showMessage(
      `Herramienta: ${toolBtn.textContent
        .trim()
        .replace(/[\uD800-\uDFFF].\s/g, "")} seleccionada.`,
      "success"
    );
  }

  isShapeDrawing = false; // Reset shape drawing state
}

// --- Funcionalidad de Dibujo y Formas ---
// Mouse and touch event listeners are moved to DOMContentLoaded

function getMousePos(e) {
  if (!imageCanvas) return { x: 0, y: 0 }; // Return default if canvas is null
  const rect = imageCanvas.getBoundingClientRect();
  const scaleX = imageCanvas.width / rect.width;
  const scaleY = imageCanvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

function redrawFromBuffer() {
  if (currentImageBuffer && ctx && imageCanvas) {
    // Add imageCanvas check
    ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
    ctx.drawImage(currentImageBuffer, 0, 0);
  }
}

function drawShape(startX, startY, endX, endY, permanent = false) {
  if (!ctx || !colorPicker || !lineWidthRange) return;
  ctx.beginPath();
  ctx.strokeStyle = colorPicker.value;
  ctx.fillStyle = colorPicker.value;
  ctx.lineWidth = lineWidthRange.value;

  const width = endX - startX;
  const height = endY - startY;

  if (activeTool === "line") {
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  } else if (activeTool === "rectangle") {
    ctx.rect(startX, startY, width, height);
    ctx.fill();
  } else if (activeTool === "circle") {
    const centerX = startX + width / 2;
    const centerY = startY + height / 2;
    const radius = Math.sqrt(width * width + height * height) / 2;
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
  } else if (activeTool === "triangle") {
    ctx.moveTo(startX, endY); // Bottom-left
    ctx.lineTo(startX + width / 2, startY); // Top-middle
    ctx.lineTo(endX, endY); // Bottom-right
    ctx.closePath(); // Close the path
    ctx.fill();
  }
}

function pickColor(x, y) {
  if (!ctx || !colorPicker || !imageCanvas) return; // Add imageCanvas check
  const pixel = ctx.getImageData(x, y, 1, 1).data;
  const rgbaColor = `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${
    pixel[3] / 255
  })`;
  const hexColor = `#${(
    (1 << 24) |
    (pixel[0] << 16) |
    (pixel[1] << 8) |
    pixel[2]
  )
    .toString(16)
    .slice(1)}`;
  colorPicker.value = hexColor;
  ctx.strokeStyle = hexColor;
  ctx.fillStyle = hexColor;
  showMessage(`Color seleccionado: ${hexColor}`, "success");
}

// --- Funcionalidad de Transformación ---

function applyTransformation(type) {
  if (!currentImageBuffer || !ctx || !imageCanvas) {
    // Add imageCanvas check
    showMessage("Carga una imagen antes de transformar.", "warning");
    return;
  }
  toggleLoading(true);
  hideMessage();

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  let newWidth = currentImageBuffer.width;
  let newHeight = currentImageBuffer.height;

  if (type === "rotateLeft" || type === "rotateRight") {
    newWidth = currentImageBuffer.height;
    newHeight = currentImageBuffer.width;
  }

  tempCanvas.width = newWidth;
  tempCanvas.height = newHeight;

  tempCtx.translate(newWidth / 2, newHeight / 2);

  if (type === "rotateLeft") {
    tempCtx.rotate((-90 * Math.PI) / 180);
  } else if (type === "rotateRight") {
    tempCtx.rotate((90 * Math.PI) / 180);
  } else if (type === "flipHorizontal") {
    tempCtx.scale(-1, 1);
  } else if (type === "flipVertical") {
    tempCtx.scale(1, -1);
  }

  tempCtx.drawImage(
    currentImageBuffer,
    -currentImageBuffer.width / 2,
    -currentImageBuffer.height / 2
  );

  if (currentImageBuffer) {
    // Check before drawing
    currentImageBuffer.width = tempCanvas.width;
    currentImageBuffer.height = tempCanvas.height;
    currentImageBuffer.getContext("2d").drawImage(tempCanvas, 0, 0);
  }

  drawImageOnCanvas(currentImageBuffer);
  saveState();
  toggleLoading(false);
  showMessage(
    `Imagen ${type
      .replace("Btn", "")
      .replace(/([A-Z])/g, " $1")
      .toLowerCase()} aplicada.`,
    "success"
  );
}

// Event listeners for transform buttons are moved to DOMContentLoaded

// Resize Image (from menu)
// menuResizeBtn and resizeBtn event listeners are moved to DOMContentLoaded

// Crop Tool (from menu)
// menuCropTool, applyCropBtn, cancelCropBtn event listeners are moved to DOMContentLoaded

function drawCropOverlay() {
  if (
    isCropping &&
    cropStartX !== undefined &&
    imageCanvas &&
    imageCanvas.getBoundingClientRect().width > 0 &&
    cropOverlay
  ) {
    const x = Math.min(cropStartX, cropCurrentX);
    const y = Math.min(cropStartY, cropCurrentY);
    const width = Math.abs(cropCurrentX - cropStartX);
    const height = Math.abs(cropCurrentY - cropStartY);

    // Adjust overlay position and size relative to canvas
    const canvasRect = imageCanvas.getBoundingClientRect();
    const scaleX = canvasRect.width / imageCanvas.width;
    const scaleY = canvasRect.height / imageCanvas.height;

    cropOverlay.style.left = `${canvasRect.left + x * scaleX}px`;
    cropOverlay.style.top = `${canvasRect.top + y * scaleY}px`;
    cropOverlay.style.width = `${width * scaleX}px`;
    cropOverlay.style.height = `${height * scaleY}px`;
    cropOverlay.classList.remove("hidden");
  }
}

// --- Funcionalidad de Ajustes y Filtros (con Sliders) ---

let adjustmentTimeout;
const applyCurrentAdjustments = () => {
  if (!originalImage) return;

  const tempImageForAdjustments = new Image();
  tempImageForAdjustments.onload = () => {
    applyAdjustments(
      tempImageForAdjustments,
      parseInt(brightnessRange.value),
      parseInt(contrastRange.value),
      parseInt(saturationRange.value),
      parseInt(hueRotateRange.value),
      parseInt(exposureRange.value),
      parseInt(gammaRange.value)
    );
  };
  if (historyIndex >= 0) {
    tempImageForAdjustments.src = history[historyIndex];
  } else if (originalImage) {
    tempImageForAdjustments.src = originalImage.src;
  } else {
    return;
  }
};

const debouncedApplyAdjustments = (e) => {
  if (!originalImage) {
    showMessage("Carga una imagen para aplicar ajustes.", "warning");
    return;
  }
  // Update displayed value immediately
  if (brightnessRange && brightnessValue)
    brightnessValue.textContent = brightnessRange.value.toString();
  if (contrastRange && contrastValue)
    contrastValue.textContent = contrastRange.value.toString();
  if (saturationRange && saturationValue)
    saturationValue.textContent = `${saturationRange.value.toString()}%`;
  if (hueRotateRange && hueRotateValue)
    hueRotateValue.textContent = `${hueRotateRange.value.toString()}°`;
  if (exposureRange && exposureValue)
    exposureValue.textContent = exposureRange.value.toString();
  if (gammaRange && gammaValue)
    gammaValue.textContent = (parseInt(gammaRange.value) / 100).toFixed(1);

  clearTimeout(adjustmentTimeout);
  adjustmentTimeout = setTimeout(() => {
    applyCurrentAdjustments();
    saveState();
    showMessage("Ajustes aplicados.", "success");
  }, 300);
};

// Event listeners for adjustments are moved to DOMContentLoaded

// Simple filters
// Event listeners for filters are moved to DOMContentLoaded

const applyFilter = (filterType) => {
  if (!currentImageBuffer || !ctx || !imageCanvas) {
    // Add imageCanvas check
    showMessage("Carga una imagen antes de aplicar filtros.", "warning");
    return;
  }
  toggleLoading(true);
  hideMessage();

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  tempCanvas.width = currentImageBuffer.width;
  tempCanvas.height = currentImageBuffer.height;
  tempCtx.drawImage(currentImageBuffer, 0, 0);

  const imageData = tempCtx.getImageData(
    0,
    0,
    tempCanvas.width,
    tempCanvas.height
  );
  const pixels = imageData.data;

  // Apply filter based on type
  if (filterType === "grayscale") {
    for (let i = 0; i < pixels.length; i += 4) {
      const lightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = lightness;
    }
  } else if (filterType === "sepia") {
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      pixels[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
      pixels[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
      pixels[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
    }
  } else if (filterType === "invert") {
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 255 - pixels[i];
      pixels[i + 1] = 255 - pixels[i + 1];
      pixels[i + 2] = 255 - pixels[i + 2];
    }
  } else if (filterType === "blur" && blurIntensityRange) {
    // Now uses blurIntensityRange
    const blurRadius = parseFloat(blurIntensityRange.value) * 2; // Scale slider value
    if (blurRadius === 0) {
      // No blur if intensity is 0
      toggleLoading(false);
      return;
    }
    const newPixels = new Uint8ClampedArray(pixels.length);
    const width = tempCanvas.width;
    const height = tempCanvas.height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let rSum = 0,
          gSum = 0,
          bSum = 0,
          count = 0;
        for (let ky = -blurRadius; ky <= blurRadius; ky++) {
          for (let kx = -blurRadius; kx <= blurRadius; kx++) {
            const nx = x + kx;
            const ny = y + ky;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const index = (ny * width + nx) * 4;
              rSum += pixels[index];
              gSum += pixels[index + 1];
              bSum += pixels[index + 2];
              count++;
            }
          }
        }
        const pixelIndex = (y * width + x) * 4;
        newPixels[pixelIndex] = rSum / count;
        newPixels[pixelIndex + 1] = gSum / count;
        newPixels[pixelIndex + 2] = bSum / count;
        newPixels[pixelIndex + 3] = pixels[pixelIndex + 3]; // Preserve alpha
      }
    }
    pixels.set(newPixels);
  } else if (filterType === "sharpen" && sharpenIntensityRange) {
    // Now uses sharpenIntensityRange
    const sharpenAmount = parseFloat(sharpenIntensityRange.value); // Use slider value
    if (sharpenAmount === 0) {
      // No sharpen if intensity is 0
      toggleLoading(false);
      return;
    }
    const kernel = [
      0,
      -sharpenAmount,
      0,
      -sharpenAmount,
      1 + 4 * sharpenAmount,
      -sharpenAmount,
      0,
      -sharpenAmount,
      0,
    ]; // Dynamic sharpen kernel
    const kernelSize = Math.sqrt(kernel.length);
    const halfKernel = Math.floor(kernelSize / 2);
    const newPixels = new Uint8ClampedArray(pixels.length);
    const width = tempCanvas.width;
    const height = tempCanvas.height;

    for (let y = halfKernel; y < height - halfKernel; y++) {
      for (let x = halfKernel; x < width - halfKernel; x++) {
        let rSum = 0,
          gSum = 0,
          bSum = 0;
        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const pixelX = x + kx - halfKernel;
            const pixelY = y + ky - halfKernel;
            const index = (pixelY * width + pixelX) * 4;
            const kernelValue = kernel[ky * kernelSize + kx];
            rSum += pixels[index] * kernelValue;
            gSum += pixels[index + 1] * kernelValue;
            bSum += pixels[index + 2] * kernelValue;
          }
        }
        const pixelIndex = (y * width + x) * 4;
        newPixels[pixelIndex] = Math.max(0, Math.min(255, rSum));
        newPixels[pixelIndex + 1] = Math.max(0, Math.min(255, gSum));
        newPixels[pixelIndex + 2] = Math.max(0, Math.min(255, bSum));
        newPixels[pixelIndex + 3] = pixels[pixelIndex + 3]; // Preserve alpha
      }
    }
    pixels.set(newPixels);
  } else if (filterType === "pixelate") {
    const pixelSize = 10;
    for (let y = 0; y < tempCanvas.height; y += pixelSize) {
      for (let x = 0; x < tempCanvas.width; x += pixelSize) {
        const pixelIndex = (y * tempCanvas.width + x) * 4;
        const r = pixels[pixelIndex];
        const g = pixels[pixelIndex + 1];
        const b = pixels[pixelIndex + 2];
        for (let py = 0; py < pixelSize && y + py < tempCanvas.height; py++) {
          for (let px = 0; px < pixelSize && x + px < tempCanvas.width; px++) {
            const targetIndex = ((y + py) * tempCanvas.width + (x + px)) * 4;
            pixels[targetIndex] = r;
            pixels[targetIndex + 1] = g;
            pixels[targetIndex + 2] = b;
          }
        }
      }
    }
  } else if (filterType === "vignette") {
    const vignetteStrength = 0.5;
    const centerX = tempCanvas.width / 2;
    const centerY = tempCanvas.height / 2;
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

    for (let y = 0; y < tempCanvas.height; y++) {
      for (let x = 0; x < tempCanvas.width; x++) {
        const dist = Math.sqrt(
          Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        );
        const vignette = 1 - (dist / maxDist) * vignetteStrength;
        const pixelIndex = (y * tempCanvas.width + x) * 4;
        pixels[pixelIndex] *= vignette;
        pixels[pixelIndex + 1] *= vignette;
        pixels[pixelIndex + 2] *= vignette;
      }
    }
  } else if (filterType === "noise") {
    const noiseStrength = 50;
    for (let y = 0; y < tempCanvas.height; y++) {
      for (let x = 0; x < tempCanvas.width; x++) {
        const pixelIndex = (y * tempCanvas.width + x) * 4;
        const noise = (Math.random() * 2 - 1) * noiseStrength;
        pixels[pixelIndex] = Math.max(
          0,
          Math.min(255, pixels[pixelIndex] + noise)
        );
        pixels[pixelIndex + 1] = Math.max(
          0,
          Math.min(255, pixels[pixelIndex + 1] + noise)
        );
        pixels[pixelIndex + 2] = Math.max(
          0,
          Math.min(255, pixels[pixelIndex + 2] + noise)
        );
      }
    }
  } else if (filterType === "emboss") {
    const kernel = [-2, -1, 0, -1, 1, 1, 0, 1, 2];
    const kernelSize = Math.sqrt(kernel.length);
    const halfKernel = Math.floor(kernelSize / 2);
    const newPixels = new Uint8ClampedArray(pixels.length);
    const width = tempCanvas.width;
    const height = tempCanvas.height;

    for (let y = halfKernel; y < height - halfKernel; y++) {
      for (let x = halfKernel; x < width - halfKernel; x++) {
        let rSum = 0,
          gSum = 0,
          bSum = 0;
        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const pixelX = x + kx - halfKernel;
            const pixelY = y + ky - halfKernel;
            const index = (pixelY * width + pixelX) * 4;
            const kernelValue = kernel[ky * kernelSize + kx];
            rSum += pixels[index] * kernelValue;
            gSum += pixels[index + 1] * kernelValue;
            bSum += pixels[index + 2] * kernelValue;
          }
        }
        const pixelIndex = (y * width + x) * 4;
        newPixels[pixelIndex] = Math.max(0, Math.min(255, rSum + 128));
        newPixels[pixelIndex + 1] = Math.max(0, Math.min(255, gSum + 128));
        newPixels[pixelIndex + 2] = Math.max(0, Math.min(255, bSum + 128));
        newPixels[pixelIndex + 3] = pixels[pixelIndex + 3]; // Preserve alpha
      }
    }
    pixels.set(newPixels);
  } else if (filterType === "warm") {
    for (let j = 0; j < pixels.length; j += 4) {
      pixels[j] = Math.min(255, pixels[j] + 30);
      pixels[j + 2] = Math.max(0, pixels[j + 2] - 30);
    }
  } else if (filterType === "cool") {
    for (let j = 0; j < pixels.length; j += 4) {
      pixels[j] = Math.max(0, pixels[j] - 30);
      pixels[j + 2] = Math.min(255, pixels[j + 2] + 30);
    }
  }

  tempCtx.putImageData(imageData, 0, 0);

  if (currentImageBuffer) {
    // Check before drawing
    currentImageBuffer.width = tempCanvas.width;
    currentImageBuffer.height = tempCanvas.height;
    currentImageBuffer.getContext("2d").drawImage(tempCanvas, 0, 0);
  }

  drawImageOnCanvas(currentImageBuffer);
  saveState();
  toggleLoading(false);
  showMessage(`Filtro ${filterType} aplicado.`, "success");
};

// --- Funcionalidad Deshacer/Rehacer/Reiniciar/Limpiar ---

// Event listeners for these are moved to DOMContentLoaded

// --- Descargar Imagen (Ahora con límite) ---

// Event listener for download is moved to DOMContentLoaded

// --- Lógica de Límite de Descargas y Anuncios ---
function updateDownloadCounterUI() {
  if (downloadCounter)
    downloadCounter.textContent = `Descargas gratuitas restantes: ${freeDownloadsLeft}`;
  if (freeDownloadsLeft <= 0) {
    if (menuDownloadImageBtn) menuDownloadImageBtn.disabled = true;
    if (watchAdButton) watchAdButton.classList.remove("hidden");
    showMessage(
      `Has agotado tus descargas gratuitas. Mira un anuncio para obtener más.`,
      "warning"
    );
  } else {
    if (originalImage && menuDownloadImageBtn) {
      menuDownloadImageBtn.disabled = false;
    }
    if (watchAdButton) watchAdButton.classList.add("hidden");
    if (
      messageArea &&
      messageArea.textContent.includes("agotado tus descargas")
    ) {
      hideMessage();
    }
  }
}

// Event listener for watchAdButton is moved to DOMContentLoaded

// --- Funciones de Modales de Cookies y Suscripción ---

function showCookieConsent() {
  if (cookieConsent && !localStorage.getItem("cookieAccepted")) {
    cookieConsent.classList.add("show");
  }
}

function acceptCookies() {
  localStorage.setItem("cookieAccepted", "true");
  if (cookieConsent) cookieConsent.classList.remove("show");
  showSubscriptionModal();
}

function showSubscriptionModal() {
  if (
    subscriptionModal &&
    !localStorage.getItem("subscribed") &&
    !localStorage.getItem("noThanksSubscription")
  ) {
    subscriptionModal.classList.add("show");
  }
}

function handleSubscription() {
  if (!emailInput) {
    // Add null check
    console.error("emailInput no encontrado.");
    showMessage("Error interno: no se pudo procesar la suscripción.", "error");
    return;
  }
  const email = emailInput.value.trim();
  if (email) {
    console.log("Correo suscrito:", email);
    localStorage.setItem("subscribed", "true");
    if (subscriptionModal) subscriptionModal.classList.remove("show");
    showMessage("¡Gracias por suscribirte!", "success");
  } else {
    showMessage("Por favor, introduce un correo electrónico válido.", "error");
  }
}

function dismissSubscription() {
  localStorage.setItem("noThanksSubscription", "true");
  if (subscriptionModal) subscriptionModal.classList.remove("show");
}

// --- Lógica del Menú Desplegable ---
function setupDropdown(button, dropdown) {
  if (!button || !dropdown) return; // Add null check for safety
  button.addEventListener("click", (event) => {
    event.stopPropagation(); // Prevent document click from closing immediately
    // Close other open dropdowns
    document.querySelectorAll(".menu-dropdown.show").forEach((openDropdown) => {
      if (openDropdown && openDropdown !== dropdown) {
        // Check openDropdown exists
        openDropdown.classList.remove("show");
      }
    });
    dropdown.classList.toggle("show");
  });
}

// Close dropdowns when clicking outside
document.addEventListener("click", (event) => {
  document.querySelectorAll(".menu-dropdown.show").forEach((openDropdown) => {
    // Ensure openDropdown exists before checking contains
    if (
      openDropdown &&
      !openDropdown.contains(event.target) &&
      openDropdown.previousElementSibling &&
      !openDropdown.previousElementSibling.contains(event.target)
    ) {
      openDropdown.classList.remove("show");
    }
  });
});

// --- Inicialización Principal (DOMContentLoaded) ---

document.addEventListener("DOMContentLoaded", function () {
  // Asignar elementos DOM al inicio de DOMContentLoaded
  imageUpload = document.getElementById("imageUpload");
  fileNameSpan = document.getElementById("fileName");
  imageCanvas = document.getElementById("imageCanvas");
  // Check if imageCanvas is found before getting context
  if (imageCanvas) {
    ctx = imageCanvas.getContext("2d");
  } else {
    console.error("Error: Canvas element not found!");
    return; // Stop execution if canvas is not found
  }
  placeholderText = document.getElementById("placeholderText");
  cropOverlay = document.getElementById("cropOverlay");
  fileUploadLabel = document.getElementById("fileUploadLabel"); // Corrected line
  mainNavbar = document.getElementById("main-navbar"); // Get reference to the main navbar

  // Menu Bar Buttons
  fileMenuBtn = document.getElementById("fileMenuBtn");
  fileMenuDropdown = document.getElementById("fileMenuDropdown");
  editMenuBtn = document.getElementById("editMenuBtn");
  editMenuDropdown = document.getElementById("editMenuDropdown");
  imageMenuBtn = document.getElementById("imageMenuBtn");
  imageMenuDropdown = document.getElementById("imageMenuDropdown");
  filtersMenuBtn = document.getElementById("filtersMenuBtn");
  filtersMenuDropdown = document.getElementById("filtersMenuDropdown");
  toolsMenuBtn = document.getElementById("toolsMenuBtn");
  toolsMenuDropdown = document.getElementById("toolsMenuDropdown");

  // Menu Dropdown Items
  // Re-assigning menu items based on their IDs
  menuLoadImageBtn = document.getElementById("fileUploadLabel"); // This is the LABEL for the input
  menuDownloadImageBtn = document.getElementById("menuDownloadImageBtn");
  menuResetImageBtn = document.getElementById("menuResetImageBtn");
  menuClearCanvasBtn = document.getElementById("menuClearCanvasBtn");
  menuUndoBtn = document.getElementById("menuUndoBtn");
  menuRedoBtn = document.getElementById("menuRedoBtn");
  menuRotateLeftBtn = document.getElementById("menuRotateLeftBtn");
  menuRotateRightBtn = document.getElementById("menuRotateRightBtn");
  menuFlipHorizontalBtn = document.getElementById("menuFlipHorizontalBtn");
  menuFlipVerticalBtn = document.getElementById("menuFlipVerticalBtn");
  menuResizeBtn = document.getElementById("menuResizeBtn");
  menuCropTool = document.getElementById("menuCropTool"); // This is a menu item button
  menuDistortTool = document.getElementById("menuDistortTool");
  menuBrightnessContrastBtn = document.getElementById(
    "menuBrightnessContrastBtn"
  );
  menuSaturationHueBtn = document.getElementById("menuSaturationHueBtn");
  menuExposureGammaBtn = document.getElementById("menuExposureGammaBtn");
  menuLevelsBtn = document.getElementById("menuLevelsBtn");
  menuColorBalanceBtn = document.getElementById("menuColorBalanceBtn");
  menuVibranceBtn = document.getElementById("menuVibranceBtn");
  menuGrayscaleBtn = document.getElementById("menuGrayscaleBtn");
  menuSepiaBtn = document.getElementById("menuSepiaBtn");
  menuInvertBtn = document.getElementById("menuInvertBtn");
  menuBlurBtn = document.getElementById("menuBlurBtn");
  menuSharpenBtn = document.getElementById("menuSharpenBtn");
  menuPixelateBtn = document.getElementById("menuPixelateBtn");
  menuVignetteBtn = document.getElementById("menuVignetteBtn");
  menuNoiseBtn = document.getElementById("menuNoiseBtn");
  menuEmbossBtn = document.getElementById("menuEmbossBtn");
  menuPosterizeBtn = document.getElementById("menuPosterizeBtn");
  menuDuotoneBtn = document.getElementById("menuDuotoneBtn");
  menuBwControlBtn = document.getElementById("menuBwControlBtn");
  menuWarmFilterBtn = document.getElementById("menuWarmFilterBtn");
  menuCoolFilterBtn = document.getElementById("menuCoolFilterBtn");

  // Actual Sidebar tool buttons (these are the ones that actually get 'active' class)
  brushTool = document.getElementById("brushTool");
  eraserTool = document.getElementById("eraserTool");
  lineTool = document.getElementById("lineTool");
  textTool = document.getElementById("textTool");
  rectangleTool = document.getElementById("rectangleTool");
  circleTool = document.getElementById("circleTool");
  triangleTool = document.getElementById("triangleTool");
  eyedropperTool = document.getElementById("eyedropperTool");
  fillTool = document.getElementById("fillTool");
  rectSelectTool = document.getElementById("rectSelectTool");
  lassoTool = document.getElementById("lassoTool");
  magicWandTool = document.getElementById("magicWandTool");
  flattenLayersBtn = document.getElementById("flattenLayersBtn");
  mergeVisibleBtn = document.getElementById("mergeVisibleBtn");

  activeToolDisplay = document.getElementById("activeToolDisplay");
  colorPicker = document.getElementById("colorPicker");
  lineWidthRange = document.getElementById("lineWidthRange");
  lineWidthValue = document.getElementById("lineWidthValue");
  brushHardnessRange = document.getElementById("brushHardnessRange");
  brushHardnessValue = document.getElementById("brushHardnessValue");
  globalOpacityRange = document.getElementById("globalOpacityRange");
  globalOpacityValue = document.getElementById("globalOpacityValue");
  textOptions = document.getElementById("textOptions");
  textInput = document.getElementById("textInput");
  fontFamilySelect = document.getElementById("fontFamilySelect");
  boldTextBtn = document.getElementById("boldTextBtn");
  italicTextBtn = document.getElementById("italicTextBtn");
  fontSizeRange = document.getElementById("fontSizeRange");
  fontSizeValue = document.getElementById("fontSizeValue");
  resizeOptions = document.getElementById("resizeOptions");
  resizeWidthInput = document.getElementById("resizeWidth");
  resizeHeightInput = document.getElementById("resizeHeight");
  resizeBtn = document.getElementById("resizeBtn");
  cropOptions = document.getElementById("cropOptions");
  applyCropBtn = document.getElementById("applyCropBtn");
  cancelCropBtn = document.getElementById("cancelCropBtn");

  brightnessRange = document.getElementById("brightnessRange");
  brightnessValue = document.getElementById("brightnessValue");
  contrastRange = document.getElementById("contrastRange");
  contrastValue = document.getElementById("contrastValue");
  saturationRange = document.getElementById("saturationRange");
  saturationValue = document.getElementById("saturationValue");
  hueRotateRange = document.getElementById("hueRotateRange");
  hueRotateValue = document.getElementById("hueRotateValue");
  exposureRange = document.getElementById("exposureRange");
  exposureValue = document.getElementById("exposureValue");
  gammaRange = document.getElementById("gammaRange");
  gammaValue = document.getElementById("gammaValue");
  blurIntensityRange = document.getElementById("blurIntensityRange"); // New slider
  blurIntensityValue = document.getElementById("blurIntensityValue"); // New value display
  sharpenIntensityRange = document.getElementById("sharpenIntensityRange"); // New slider
  sharpenIntensityValue = document.getElementById("sharpenIntensityValue"); // New value display

  undoBtn = document.getElementById("undoBtn");
  redoBtn = document.getElementById("redoBtn");
  downloadCounter = document.getElementById("downloadCounter");
  watchAdButton = document.getElementById("watchAdButton");

  messageArea = document.getElementById("messageArea");
  loadingSpinner = document.getElementById("loadingSpinner");

  cookieConsent = document.getElementById("cookieConsent");
  acceptCookiesButton = document.getElementById("acceptCookiesButton");
  subscriptionModal = document.getElementById("subscriptionModal");
  emailInput = document.getElementById("emailInput");
  subscribeButton = document.getElementById("subscribeButton");
  noThanksButton = document.getElementById("noThanksButton");

  // Configuración inicial del contexto del canvas
  if (imageCanvas && ctx) {
    // Ensure canvas and context exist before setting properties
    ctx.lineWidth =
      lineWidthRange && lineWidthRange.value
        ? parseInt(lineWidthRange.value)
        : 5; // Default if not found
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle =
      colorPicker && colorPicker.value ? colorPicker.value : "#06b6d4"; // Default if not found
    ctx.fillStyle =
      colorPicker && colorPicker.value ? colorPicker.value : "#06b6d4"; // Default if not found
  }
  if (lineWidthValue && lineWidthRange)
    lineWidthValue.textContent = `${lineWidthRange.value.toString()}px`;
  if (fontSizeValue && fontSizeRange)
    fontSizeValue.textContent = `${fontSizeRange.value.toString()}px`;
  if (brushHardnessValue && brushHardnessRange)
    brushHardnessValue.textContent = `${brushHardnessRange.value.toString()}%`;
  if (globalOpacityValue && globalOpacityRange)
    globalOpacityValue.textContent = `${globalOpacityRange.value.toString()}%`;
  if (exposureValue && exposureRange)
    exposureValue.textContent = exposureRange.value.toString();
  if (gammaValue && gammaRange)
    gammaValue.textContent = (parseInt(gammaRange.value) / 100).toFixed(1);
  if (blurIntensityValue && blurIntensityRange)
    blurIntensityValue.textContent = blurIntensityRange.value.toString(); // Initialize new slider value
  if (sharpenIntensityValue && sharpenIntensityRange)
    sharpenIntensityValue.textContent = sharpenIntensityRange.value.toString(); // Initialize new slider value

  // Cargar el contador de descargas o establecer el valor por defecto
  const storedDownloads = localStorage.getItem("freeDownloadsLeft");
  if (storedDownloads !== null) {
    freeDownloadsLeft = parseInt(storedDownloads, 10);
  } else {
    freeDownloadsLeft = MAX_FREE_DOWNLOADS;
    localStorage.setItem("freeDownloadsLeft", MAX_FREE_DOWNLOADS); // Ensure it's set correctly
  }
  updateDownloadCounterUI();

  // Set up all tool buttons and their listeners
  drawingToolButtons = [
    brushTool,
    eraserTool,
    lineTool,
    textTool,
    rectangleTool,
    circleTool,
    triangleTool,
    eyedropperTool,
    menuCropTool, // Note: menuCropTool is used here as the main click target for crop
  ];
  drawingToolButtons.forEach((toolBtn) => {
    // Ensure toolBtn is not null before adding event listener
    if (toolBtn) {
      toolBtn.addEventListener("click", () => setupToolButtons(toolBtn));
    }
  });

  // Llama a resetEditorState para inicializar el estado de la UI
  // This is crucial: brushTool and other elements must be assigned before this.
  resetEditorState();

  toggleLoading(false); // Make sure loading is off, then state is set

  // Setup menu dropdowns
  setupDropdown(fileMenuBtn, fileMenuDropdown);
  setupDropdown(editMenuBtn, editMenuDropdown);
  setupDropdown(imageMenuBtn, imageMenuDropdown);
  setupDropdown(filtersMenuBtn, filtersMenuDropdown);
  setupDropdown(toolsMenuBtn, toolsMenuDropdown);

  // Manejo de arrastrar y soltar
  try {
    // Get the label element by its ID (this element exists in the HTML)
    // fileUploadLabel is already assigned
    if (fileUploadLabel) {
      // Check if the element exists
      fileUploadLabel.addEventListener("dragover", (e) => {
        e.preventDefault();
        fileUploadLabel.classList.add("border-cyan-500", "bg-gray-700");
      });

      fileUploadLabel.addEventListener("dragleave", (e) => {
        e.preventDefault();
        fileUploadLabel.classList.remove("border-cyan-500", "bg-gray-700");
      });

      fileUploadLabel.addEventListener("drop", (e) => {
        e.preventDefault();
        fileUploadLabel.classList.remove("border-cyan-500", "bg-gray-700");
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          if (imageUpload) imageUpload.files = files; // Ensure imageUpload exists
          if (imageUpload) imageUpload.dispatchEvent(new Event("change"));
        }
      });
    } else {
      console.error(
        "Error: El elemento 'fileUploadLabel' no se encontró en el DOM. La funcionalidad de arrastrar y soltar no funcionará."
      );
    }
  } catch (error) {
    console.error(
      "Error inesperado al configurar la funcionalidad de arrastrar y soltar:",
      error
    );
  }

  // Bind menu item clicks to their corresponding functions
  if (imageUpload) imageUpload.addEventListener("change", handleImageUpload);
  if (menuLoadImageBtn)
    menuLoadImageBtn.addEventListener("click", () => {
      if (imageUpload) imageUpload.click();
    }); // This is now fileUploadLabel

  if (menuDownloadImageBtn)
    menuDownloadImageBtn.addEventListener("click", () => {
      if (!originalImage) {
        showMessage("Por favor, carga una imagen antes de descargar.", "error");
        return;
      }
      if (freeDownloadsLeft <= 0) {
        showMessage(
          "Has agotado tus descargas gratuitas. Mira un anuncio para obtener más.",
          "error"
        );
        return;
      }
      if (imageCanvas && fileNameSpan) {
        // Ensure both elements exist
        const dataURL = imageCanvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataURL;
        const originalFileName = fileNameSpan.textContent.split(".")[0];
        a.download = `${originalFileName}_editado.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      freeDownloadsLeft--;
      localStorage.setItem("freeDownloadsLeft", freeDownloadsLeft);
      updateDownloadCounterUI();
      showMessage("Imagen descargada exitosamente como PNG.", "success");
    });
  if (menuResetImageBtn)
    menuResetImageBtn.addEventListener("click", () => resetEditorState());
  if (menuClearCanvasBtn)
    menuClearCanvasBtn.addEventListener("click", () => {
      if (originalImage && currentImageBuffer && ctx) {
        // Ensure all necessary elements exist
        currentImageBuffer = document.createElement("canvas");
        currentImageBuffer.width = originalImage.width;
        currentImageBuffer.height = originalImage.height;
        if (currentImageBuffer.getContext("2d")) {
          currentImageBuffer.getContext("2d").fillStyle = "#FFFFFF";
          currentImageBuffer
            .getContext("2d")
            .fillRect(
              0,
              0,
              currentImageBuffer.width,
              currentImageBuffer.height
            );
        }

        drawImageOnCanvas(currentImageBuffer);
        history = [];
        historyIndex = -1;
        saveState();
        showMessage("Canvas limpiado.", "success");
      } else {
        showMessage("No hay canvas para limpiar.", "warning");
      }
    });

  if (menuUndoBtn)
    menuUndoBtn.addEventListener("click", () => {
      if (historyIndex > 0) {
        historyIndex--;
        restoreState(history[historyIndex]);
        showMessage("Acción deshecha.", "success");
      } else {
        showMessage("No hay más acciones para deshacer.", "warning");
      }
    });
  if (menuRedoBtn)
    menuRedoBtn.addEventListener("click", () => {
      if (historyIndex < history.length - 1) {
        historyIndex++;
        restoreState(history[historyIndex]);
        showMessage("Acción rehecha.", "success");
      } else {
        showMessage("No hay más acciones para rehacer.", "warning");
      }
    });

  // Link menu filters to applyFilter
  if (menuGrayscaleBtn)
    menuGrayscaleBtn.addEventListener("click", () => applyFilter("grayscale"));
  if (menuSepiaBtn)
    menuSepiaBtn.addEventListener("click", () => applyFilter("sepia"));
  if (menuInvertBtn)
    menuInvertBtn.addEventListener("click", () => applyFilter("invert"));
  if (menuBlurBtn)
    menuBlurBtn.addEventListener("click", () => applyFilter("blur"));
  if (menuSharpenBtn)
    menuSharpenBtn.addEventListener("click", () => applyFilter("sharpen"));
  if (menuPixelateBtn)
    menuPixelateBtn.addEventListener("click", () => applyFilter("pixelate"));
  if (menuVignetteBtn)
    menuVignetteBtn.addEventListener("click", () => applyFilter("vignette"));
  if (menuNoiseBtn)
    menuNoiseBtn.addEventListener("click", () => applyFilter("noise"));
  if (menuEmbossBtn)
    menuEmbossBtn.addEventListener("click", () => applyFilter("emboss"));
  if (menuWarmFilterBtn)
    menuWarmFilterBtn.addEventListener("click", () => applyFilter("warm"));
  if (menuCoolFilterBtn)
    menuCoolFilterBtn.addEventListener("click", () => applyFilter("cool"));

  // Link menu adjustments to open sidebar and (potentially) show options
  if (menuBrightnessContrastBtn)
    menuBrightnessContrastBtn.addEventListener("click", () => {
      showMessage(
        "Ajustes de Brillo/Contraste controlados por sliders en el panel izquierdo.",
        "info"
      );
    });
  if (menuSaturationHueBtn)
    menuSaturationHueBtn.addEventListener("click", () => {
      showMessage(
        "Ajustes de Saturación/Tonalidad controlados por sliders en el panel izquierdo.",
        "info"
      );
    });
  if (menuExposureGammaBtn)
    menuExposureGammaBtn.addEventListener("click", () => {
      showMessage(
        "Ajustes de Exposición/Gamma controlados por sliders en el panel izquierdo.",
        "info"
      );
    });

  // Placeholder functions for menu items
  const placeholderMenuItems = [
    menuDistortTool,
    menuLevelsBtn,
    menuColorBalanceBtn,
    menuVibranceBtn,
    menuPosterizeBtn,
    menuDuotoneBtn,
    menuBwControlBtn,
    fillTool, // Note: fillTool here refers to the actual sidebar element
    rectSelectTool,
    lassoTool,
    magicWandTool, // These are sidebar elements
    flattenLayersBtn,
    mergeVisibleBtn, // These are sidebar elements
  ];
  placeholderMenuItems.forEach((item) => {
    if (item) {
      // Ensure element exists
      item.addEventListener("click", () =>
        showMessage(
          `${item.textContent.trim()}: Funcionalidad no implementada. (Placeholder)`,
          "warning"
        )
      );
    }
  });

  // Listeners for sidebar tool properties
  if (boldTextBtn)
    boldTextBtn.addEventListener("click", () => {
      isBold = !isBold;
      boldTextBtn.classList.toggle("active", isBold);
    });
  if (italicTextBtn)
    italicTextBtn.addEventListener("click", () => {
      isItalic = !isItalic;
      italicTextBtn.classList.toggle("active", isItalic);
    });
  if (fontFamilySelect)
    fontFamilySelect.addEventListener("change", (e) => {
      currentFontFamily = e.target.value;
    });
  if (fontSizeRange && fontSizeValue)
    fontSizeRange.addEventListener("input", (e) => {
      fontSizeValue.textContent = `${e.target.value}px`;
    });

  if (colorPicker && ctx)
    colorPicker.addEventListener("input", (e) => {
      ctx.strokeStyle = e.target.value;
      ctx.fillStyle = e.target.value;
      showMessage(`Color cambiado a ${e.target.value}.`, "success");
    });
  if (lineWidthRange && ctx && lineWidthValue)
    lineWidthRange.addEventListener("input", (e) => {
      ctx.lineWidth = e.target.value;
      lineWidthValue.textContent = `${e.target.value}px`;
    });
  if (brushHardnessRange && brushHardnessValue)
    brushHardnessRange.addEventListener("input", (e) => {
      brushHardnessValue.textContent = `${e.target.value}%`;
    });
  if (globalOpacityRange && ctx && globalOpacityValue)
    globalOpacityRange.addEventListener("input", (e) => {
      ctx.globalAlpha = parseInt(e.target.value) / 100;
      globalOpacityValue.textContent = `${e.target.value}%`;
    });

  if (brightnessRange)
    brightnessRange.addEventListener("input", debouncedApplyAdjustments);
  if (contrastRange)
    contrastRange.addEventListener("input", debouncedApplyAdjustments);
  if (saturationRange)
    saturationRange.addEventListener("input", debouncedApplyAdjustments);
  if (hueRotateRange)
    hueRotateRange.addEventListener("input", debouncedApplyAdjustments);
  if (exposureRange)
    exposureRange.addEventListener("input", debouncedApplyAdjustments);
  if (gammaRange)
    gammaRange.addEventListener("input", debouncedApplyAdjustments);

  // New blur/sharpen intensity sliders
  if (blurIntensityRange && blurIntensityValue)
    blurIntensityRange.addEventListener("input", (e) => {
      blurIntensityValue.textContent = e.target.value.toString();
      debouncedApplyAdjustments(e); // Trigger adjustments
    });
  if (sharpenIntensityRange && sharpenIntensityValue)
    sharpenIntensityRange.addEventListener("input", (e) => {
      sharpenIntensityValue.textContent = e.target.value.toString();
      debouncedApplyAdjustments(e); // Trigger adjustments
    });

  // Bind global action buttons from sidebar
  if (undoBtn)
    undoBtn.addEventListener("click", () => {
      if (menuUndoBtn) menuUndoBtn.click();
    });
  if (redoBtn)
    redoBtn.addEventListener("click", () => {
      if (menuRedoBtn) menuRedoBtn.click();
    });
  if (watchAdButton)
    watchAdButton.addEventListener("click", watchAdForGenerations);

  // Listeners for modals
  if (acceptCookiesButton)
    acceptCookiesButton.addEventListener("click", acceptCookies);
  if (subscribeButton)
    subscribeButton.addEventListener("click", handleSubscription);
  if (noThanksButton)
    noThanksButton.addEventListener("click", dismissSubscription);

  // Show cookie consent on load
  showCookieConsent();

  // Add mouse/touch event listeners for canvas
  if (imageCanvas) {
    imageCanvas.addEventListener("mousedown", (e) => {
      if (!originalImage || isCropping) return;
      const pos = getMousePos(e);
      lastX = pos.x;
      lastY = pos.y;

      if (activeTool === "brush" || activeTool === "eraser") {
        isDrawing = true;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
      } else if (
        activeTool === "line" ||
        activeTool === "rectangle" ||
        activeTool === "circle" ||
        activeTool === "triangle"
      ) {
        isShapeDrawing = true;
        startShapeX = lastX;
        startShapeY = lastY;
      } else if (activeTool === "eyedropper") {
        pickColor(pos.x, pos.y);
      }
    });

    imageCanvas.addEventListener("mouseup", (e) => {
      if (isDrawing) {
        isDrawing = false;
        saveState();
      } else if (isShapeDrawing) {
        isShapeDrawing = false;
        redrawFromBuffer();
        drawShape(startShapeX, startShapeY, lastX, lastY, true);
        saveState();
      } else if (activeTool === "crop" && e.buttons === 0) {
        if (
          cropStartX !== undefined &&
          cropCurrentX !== undefined &&
          Math.abs(cropCurrentX - cropStartX) > 0 &&
          Math.abs(cropCurrentY - cropStartY) > 0
        ) {
          // Valid crop area selected, applyCropBtn click will handle it
        } else {
          // Invalid or zero-area crop, reset overlay
          if (cropOverlay) cropOverlay.classList.add("hidden");
          if (cropOptions) cropOptions.classList.add("hidden");
          isCropping = false;
          imageCanvas.style.cursor = "default";
          if (brushTool) setupToolButtons(brushTool); // Re-activate brush tool
          showMessage(
            "Área de recorte inválida o no seleccionada. Recorte cancelado.",
            "warning"
          );
        }
      }
    });

    imageCanvas.addEventListener("mouseout", () => {
      if (isDrawing) {
        isDrawing = false;
        redrawFromBuffer();
      } else if (isShapeDrawing) {
        isShapeDrawing = false;
        redrawFromBuffer();
      }
    });

    imageCanvas.addEventListener("mousemove", (e) => {
      if (!originalImage) return;
      const pos = getMousePos(e);
      const currentX = pos.x;
      const currentY = pos.y;

      if (isDrawing) {
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        [lastX, lastY] = [currentX, currentY];
      } else if (isShapeDrawing) {
        redrawFromBuffer();
        drawShape(startShapeX, startShapeY, currentX, currentY, false);
      } else if (activeTool === "crop" && e.buttons === 1) {
        if (cropStartX === undefined) {
          cropStartX = currentX;
          cropStartY = currentY;
        }
        cropCurrentX = currentX;
        cropCurrentY = currentY;
        drawCropOverlay();
      }
    });

    // Touch events
    imageCanvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const pos = getMousePos(touch);
      lastX = pos.x;
      lastY = pos.y;

      if (activeTool === "brush" || activeTool === "eraser") {
        isDrawing = true;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
      } else if (
        activeTool === "line" ||
        activeTool === "rectangle" ||
        activeTool === "circle" ||
        activeTool === "triangle"
      ) {
        isShapeDrawing = true;
        startShapeX = lastX;
        startShapeY = lastY;
      } else if (activeTool === "eyedropper") {
        pickColor(pos.x, pos.y);
      } else if (activeTool === "crop") {
        isCropping = true;
        cropStartX = pos.x;
        cropStartY = pos.y;
      }
    });

    imageCanvas.addEventListener("touchend", (e) => {
      if (isDrawing) {
        isDrawing = false;
        saveState();
      } else if (isShapeDrawing) {
        isShapeDrawing = false;
        redrawFromBuffer();
        drawShape(startShapeX, startShapeY, lastX, lastY, true);
        saveState();
      } else if (activeTool === "crop") {
        if (
          cropStartX !== undefined &&
          cropCurrentX !== undefined &&
          Math.abs(cropCurrentX - cropStartX) > 0 &&
          Math.abs(cropCurrentY - cropStartY) > 0
        ) {
          // Valid crop area selected, applyCropBtn click will handle it
        } else {
          if (cropOverlay) cropOverlay.classList.add("hidden");
          if (cropOptions) cropOptions.classList.add("hidden");
          isCropping = false;
          imageCanvas.style.cursor = "default";
          if (brushTool) setupToolButtons(brushTool);
          showMessage(
            "Área de recorte inválida o no seleccionada. Recorte cancelado.",
            "warning"
          );
        }
        cropStartX = undefined;
        cropStartY = undefined;
        cropCurrentX = undefined;
        cropCurrentY = undefined;
      }
    });

    imageCanvas.addEventListener("touchcancel", () => {
      if (isDrawing) {
        isDrawing = false;
        redrawFromBuffer();
      } else if (isShapeDrawing) {
        isShapeDrawing = false;
        redrawFromBuffer();
      } else if (activeTool === "crop") {
        if (cropOverlay) cropOverlay.classList.add("hidden");
        if (cropOptions) cropOptions.classList.add("hidden");
        isCropping = false;
        imageCanvas.style.cursor = "default";
        if (brushTool) setupToolButtons(brushTool);
        showMessage("Recorte cancelado.", "warning");
        cropStartX = undefined;
        cropStartY = undefined;
        cropCurrentX = undefined;
        cropCurrentY = undefined;
      }
    });

    imageCanvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      if (!originalImage) return;
      const touch = e.touches[0];
      const pos = getMousePos(touch);
      const currentX = pos.x;
      const currentY = pos.y;

      if (isDrawing) {
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        [lastX, lastY] = [currentX, currentY];
      } else if (isShapeDrawing) {
        redrawFromBuffer();
        drawShape(startShapeX, startShapeY, currentX, currentY, false);
      } else if (activeTool === "crop") {
        cropCurrentX = currentX;
        cropCurrentY = currentY;
        drawCropOverlay();
      }
    });
  } else {
    console.error(
      "No se pudo adjuntar eventos al canvas. El elemento 'imageCanvas' no está disponible."
    );
  }
});

// Reajustar canvas al cambiar el tamaño de la ventana
window.addEventListener("resize", () => {
  if (originalImage) {
    if (history.length > 0 && historyIndex !== -1) {
      restoreState(history[historyIndex]);
    }
  }
  // Re-draw crop overlay if active
  if (isCropping && cropOverlay && !cropOverlay.classList.contains("hidden")) {
    // Only if cropping and overlay is visible, and cropOverlay exists
    drawCropOverlay();
  }
});
