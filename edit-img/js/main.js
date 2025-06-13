// edit-img/js/main.js
import { CONFIG } from "./utils/constants.js";
import {
  showMessage,
  hideMessage,
  toggleLoading,
  updateDownloadCounterUI,
  updateUndoRedoButtons,
  showCookieConsent,
  acceptCookies,
  showSubscriptionModal,
  handleSubscription,
  dismissSubscription,
  watchAdForGenerations,
  setupDropdown, // Asegúrate de que esta línea esté presente
  setupNavbarResponsive,
  hideMessageModal,
} from "./ui.js";
import {
  drawImageOnCanvas,
  editorCtx,
  imageCanvas,
  clearCanvas,
  redrawFromBuffer,
  getMousePos,
} from "./canvas.js";
import {
  saveState,
  restoreState,
  history,
  historyIndex,
  setHistoryState,
} from "./history.js";
import { activateTool, activeToolState } from "./tools/toolManager.js";
import { applyFilter } from "./filters/filterManager.js";
import {
  applyAdjustments,
  resetAdjustments,
} from "./adjustments/colorAdjustments.js";

// Herramientas específicas importadas para sus manejadores de eventos en main.js
import { startBrush, drawBrush, endBrush } from "./tools/brushTool.js";
import { startEraser, drawEraser, endEraser } from "./tools/eraserTool.js";
import { drawText } from "./tools/textTool.js";
import { pickColor } from "./tools/eyedropperTool.js";
import {
  handleCropStart,
  handleCropMove,
  handleCropEnd,
  applyCrop,
  cancelCrop,
} from "./tools/cropTool.js";

// --- Variables de Estado Globales ---
let originalImage = null; // La imagen original cargada
let currentImageBuffer = null; // Canvas temporal para almacenar el estado actual de la imagen editada
let freeDownloadsLeft = CONFIG.MAX_FREE_DOWNLOADS;

// --- DOMElements (se inicializará en initApp) ---
let DOMElements = {}; // Objeto para almacenar referencias a elementos del DOM

// Function to initialize DOM elements and main setup
function initDOMElements() {
  DOMElements = {
    imageUpload: document.getElementById("imageUpload"),
    imageCanvas: document.getElementById("imageCanvas"),
    placeholderText: document.getElementById("placeholderText"),
    cropOverlay: document.getElementById("cropOverlay"),
    fileUploadLabel: document.getElementById("fileUploadLabel"),
    mainNavbar: document.getElementById("main-navbar"),

    // Menu Bar Buttons
    fileMenuBtn: document.getElementById("fileMenuBtn"),
    fileMenuDropdown: document.getElementById("fileMenuDropdown"),
    editMenuBtn: document.getElementById("editMenuBtn"),
    editMenuDropdown: document.getElementById("editMenuDropdown"),
    imageMenuBtn: document.getElementById("imageMenuBtn"),
    imageMenuDropdown: document.getElementById("imageMenuDropdown"),
    filtersMenuBtn: document.getElementById("filtersMenuBtn"),
    filtersMenuDropdown: document.getElementById("filtersMenuDropdown"),
    toolsMenuBtn: document.getElementById("toolsMenuBtn"),
    toolsMenuDropdown: document.getElementById("toolsMenuDropdown"),

    // Menu Dropdown Items
    menuLoadImageBtn: document.getElementById("fileUploadLabel"),
    menuDownloadImageBtn: document.getElementById("menuDownloadImageBtn"),
    menuResetImageBtn: document.getElementById("menuResetImageBtn"),
    menuClearCanvasBtn: document.getElementById("menuClearCanvasBtn"),
    menuUndoBtn: document.getElementById("menuUndoBtn"),
    menuRedoBtn: document.getElementById("menuRedoBtn"),

    // Ajustes de imagen (placeholder en HTML original, pero mantienen sus IDs)
    menuBrightnessContrastBtn: document.getElementById(
      "menuBrightnessContrastBtn"
    ),
    menuSaturationHueBtn: document.getElementById("menuSaturationHueBtn"),
    menuExposureGammaBtn: document.getElementById("menuExposureGammaBtn"),
    // Filtros
    menuGrayscaleBtn: document.getElementById("menuGrayscaleBtn"),
    menuSepiaBtn: document.getElementById("menuSepiaBtn"),
    menuInvertBtn: document.getElementById("menuInvertBtn"),
    menuBlurBtn: document.getElementById("menuBlurBtn"),
    menuSharpenBtn: document.getElementById("menuSharpenBtn"),
    // Herramientas
    brushTool: document.getElementById("brushTool"),
    eraserTool: document.getElementById("eraserTool"),
    textTool: document.getElementById("textTool"),
    eyedropperTool: document.getElementById("eyedropperTool"),
    menuCropTool: document.getElementById("menuCropTool"),

    activeToolDisplay: document.getElementById("activeToolDisplay"),
    colorPicker: document.getElementById("colorPicker"),
    lineWidthRange: document.getElementById("lineWidthRange"),
    lineWidthValue: document.getElementById("lineWidthValue"),
    brushHardnessRange: document.getElementById("brushHardnessRange"),
    brushHardnessValue: document.getElementById("brushHardnessValue"),
    globalOpacityRange: document.getElementById("globalOpacityRange"),
    globalOpacityValue: document.getElementById("globalOpacityValue"),
    textOptions: document.getElementById("textOptions"),
    textInput: document.getElementById("textInput"),
    fontFamilySelect: document.getElementById("fontFamilySelect"),
    boldTextBtn: document.getElementById("boldTextBtn"),
    italicTextBtn: document.getElementById("italicTextBtn"),
    fontSizeRange: document.getElementById("fontSizeRange"),
    fontSizeValue: document.getElementById("fontSizeValue"),
    cropOptions: document.getElementById("cropOptions"),
    applyCropBtn: document.getElementById("applyCropBtn"),
    cancelCropBtn: document.getElementById("cancelCropBtn"),

    brightnessRange: document.getElementById("brightnessRange"),
    brightnessValue: document.getElementById("brightnessValue"),
    contrastRange: document.getElementById("contrastRange"),
    contrastValue: document.getElementById("contrastValue"),
    saturationRange: document.getElementById("saturationRange"),
    saturationValue: document.getElementById("saturationValue"),
    hueRotateRange: document.getElementById("hueRotateRange"),
    hueRotateValue: document.getElementById("hueRotateValue"),
    exposureRange: document.getElementById("exposureRange"),
    exposureValue: document.getElementById("exposureValue"),
    gammaRange: document.getElementById("gammaRange"),
    gammaValue: document.getElementById("gammaValue"),
    blurIntensityRange: document.getElementById("blurIntensityRange"),
    blurIntensityValue: document.getElementById("blurIntensityValue"),
    sharpenIntensityRange: document.getElementById("sharpenIntensityRange"),
    sharpenIntensityValue: document.getElementById("sharpenIntensityValue"),

    undoBtn: document.getElementById("undoBtn"),
    redoBtn: document.getElementById("redoBtn"),
    downloadCounter: document.getElementById("downloadCounter"),
    watchAdButton: document.getElementById("watchAdButton"),

    messageArea: document.getElementById("messageArea"),
    loadingSpinner: document.getElementById("loadingSpinner"),

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
  };

  // Asignar contexto y elementos a canvas.js (exportados como objetos { current: null })
  if (DOMElements.imageCanvas) {
    editorCtx.current = DOMElements.imageCanvas.getContext("2d");
    imageCanvas.current = DOMElements.imageCanvas;
  } else {
    console.error("Error: Canvas element not found!");
    return; // Detener la ejecución si el canvas no se encuentra
  }

  // Inicializar propiedades del contexto
  editorCtx.current.lineWidth = parseInt(DOMElements.lineWidthRange.value);
  editorCtx.current.lineCap = "round";
  editorCtx.current.lineJoin = "round";
  editorCtx.current.strokeStyle = DOMElements.colorPicker.value;
  editorCtx.current.fillStyle = DOMElements.colorPicker.value;

  // Inicializar valores de sliders y textos asociados
  if (DOMElements.lineWidthValue)
    DOMElements.lineWidthValue.textContent = `${DOMElements.lineWidthRange.value}px`;
  if (DOMElements.fontSizeValue)
    DOMElements.fontSizeValue.textContent = `${DOMElements.fontSizeRange.value}px`;
  if (DOMElements.brushHardnessValue)
    DOMElements.brushHardnessValue.textContent = `${DOMElements.brushHardnessRange.value}%`;
  if (DOMElements.globalOpacityValue)
    DOMElements.globalOpacityValue.textContent = `${DOMElements.globalOpacityRange.value}%`;
  if (DOMElements.exposureValue)
    DOMElements.exposureValue.textContent = `${DOMElements.exposureRange.value}`;
  if (DOMElements.gammaValue)
    DOMElements.gammaValue.textContent = (
      parseInt(DOMElements.gammaRange.value) / 100
    ).toFixed(1);
  if (DOMElements.blurIntensityValue)
    DOMElements.blurIntensityValue.textContent = `${DOMElements.blurIntensityRange.value}`;
  if (DOMElements.sharpenIntensityValue)
    DOMElements.sharpenIntensityValue.textContent = `${DOMElements.sharpenIntensityRange.value}`;

  // Cargar el contador de descargas o establecer el valor por defecto
  const storedDownloads = localStorage.getItem("freeDownloadsLeft");
  if (storedDownloads !== null) {
    freeDownloadsLeft = parseInt(storedDownloads, 10);
  } else {
    freeDownloadsLeft = CONFIG.MAX_FREE_DOWNLOADS;
    localStorage.setItem("freeDownloadsLeft", CONFIG.MAX_FREE_DOWNLOADS);
  }
  updateDownloadCounterUI(
    DOMElements.downloadCounter,
    DOMElements.menuDownloadImageBtn,
    DOMElements.watchAdButton,
    freeDownloadsLeft,
    showMessage
  );

  toggleLoading(false, DOMElements.loadingSpinner, DOMElements); // Inicializar con carga desactivada
  updateUndoRedoButtons(
    DOMElements.undoBtn,
    DOMElements.redoBtn,
    historyIndex.current,
    history.current.length
  );
}

function handleImageUpload(event) {
  toggleLoading(true, DOMElements.loadingSpinner, DOMElements);
  hideMessage(DOMElements.messageArea);
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      originalImage = new Image();
      originalImage.onload = function () {
        // Crear un buffer de canvas para almacenar el estado actual de la imagen
        currentImageBuffer = document.createElement("canvas");
        currentImageBuffer.width = originalImage.width;
        currentImageBuffer.height = originalImage.height;
        currentImageBuffer.getContext("2d").drawImage(originalImage, 0, 0);

        drawImageOnCanvas(
          originalImage,
          DOMElements.imageCanvas,
          editorCtx.current,
          DOMElements.placeholderText
        );
        setHistoryState([]); // Reiniciar historial
        saveState(DOMElements.imageCanvas, setHistoryState); // Guardar el estado inicial
        showMessage(
          "Imagen cargada exitosamente.",
          "success",
          DOMElements.messageArea
        );
        toggleLoading(false, DOMElements.loadingSpinner, DOMElements);
      };
      originalImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    showMessage(
      "No se seleccionó ninguna imagen.",
      "warning",
      DOMElements.messageArea
    );
    toggleLoading(false, DOMElements.loadingSpinner, DOMElements);
  }
}

function resetEditorState() {
  if (originalImage) {
    currentImageBuffer = document.createElement("canvas");
    currentImageBuffer.width = originalImage.width;
    currentImageBuffer.height = originalImage.height;
    currentImageBuffer.getContext("2d").drawImage(originalImage, 0, 0);
    drawImageOnCanvas(
      originalImage,
      DOMElements.imageCanvas,
      editorCtx.current,
      DOMElements.placeholderText
    );
    setHistoryState([]);
    saveState(DOMElements.imageCanvas, setHistoryState);
    showMessage(
      "Editor reiniciado al estado inicial de la imagen.",
      "info",
      DOMElements.messageArea
    );
  } else {
    // Limpiar completamente el canvas si no hay imagen original
    editorCtx.current.clearRect(
      0,
      0,
      DOMElements.imageCanvas.width,
      DOMElements.imageCanvas.height
    );
    DOMElements.imageCanvas.width = 0;
    DOMElements.imageCanvas.height = 0;
    DOMElements.placeholderText.classList.remove("hidden");
    setHistoryState([]);
    saveState(DOMElements.imageCanvas, setHistoryState); // Guarda un estado vacío
    showMessage(
      "Canvas y editor reiniciados.",
      "info",
      DOMElements.messageArea
    );
  }
  resetAdjustments(DOMElements); // Reinicia los sliders de ajuste
}

function setupEventListeners() {
  // Carga de imagen
  if (DOMElements.imageUpload)
    DOMElements.imageUpload.addEventListener("change", handleImageUpload);
  if (DOMElements.fileUploadLabel)
    DOMElements.fileUploadLabel.addEventListener("click", () =>
      DOMElements.imageUpload.click()
    );

  // Manejo de arrastrar y soltar
  if (DOMElements.fileUploadLabel) {
    DOMElements.fileUploadLabel.addEventListener("dragover", (e) => {
      e.preventDefault();
      DOMElements.fileUploadLabel.classList.add(
        "border-cyan-500",
        "bg-gray-700"
      );
    });
    DOMElements.fileUploadLabel.addEventListener("dragleave", (e) => {
      e.preventDefault();
      DOMElements.fileUploadLabel.classList.remove(
        "border-cyan-500",
        "bg-gray-700"
      );
    });
    DOMElements.fileUploadLabel.addEventListener("drop", (e) => {
      e.preventDefault();
      DOMElements.fileUploadLabel.classList.remove(
        "border-cyan-500",
        "bg-gray-700"
      );
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        if (DOMElements.imageUpload) DOMElements.imageUpload.files = files;
        if (DOMElements.imageUpload)
          DOMElements.imageUpload.dispatchEvent(new Event("change"));
      }
    });
  }

  // --- Lógica para la barra de menú superior con la función setupDropdown de ui.js ---
  // Asegúrate de que los elementos existen antes de intentar configurar los listeners
  if (DOMElements.fileMenuBtn && DOMElements.fileMenuDropdown) {
    setupDropdown(DOMElements.fileMenuBtn, DOMElements.fileMenuDropdown);
  }
  if (DOMElements.editMenuBtn && DOMElements.editMenuDropdown) {
    setupDropdown(DOMElements.editMenuBtn, DOMElements.editMenuDropdown);
  }
  if (DOMElements.imageMenuBtn && DOMElements.imageMenuDropdown) {
    setupDropdown(DOMElements.imageMenuBtn, DOMElements.imageMenuDropdown);
  }
  if (DOMElements.filtersMenuBtn && DOMElements.filtersMenuDropdown) {
    setupDropdown(DOMElements.filtersMenuBtn, DOMElements.filtersMenuDropdown);
  }
  if (DOMElements.toolsMenuBtn && DOMElements.toolsMenuDropdown) {
    setupDropdown(DOMElements.toolsMenuBtn, DOMElements.toolsMenuDropdown);
  }

  // Descarga y reset
  if (DOMElements.menuDownloadImageBtn)
    DOMElements.menuDownloadImageBtn.addEventListener("click", () => {
      if (!currentImageBuffer) {
        showMessage(
          "Por favor, carga una imagen antes de descargar.",
          "error",
          DOMElements.messageArea
        );
        return;
      }
      if (freeDownloadsLeft <= 0) {
        showMessage(
          "Has agotado tus descargas gratuitas. Mira un anuncio para obtener más.",
          "error",
          DOMElements.messageArea
        );
        return;
      }
      if (DOMElements.imageCanvas) {
        const dataURL = DOMElements.imageCanvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataURL;
        a.download = `imagen_editada.png`; // Puedes personalizar el nombre aquí
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      freeDownloadsLeft--;
      localStorage.setItem("freeDownloadsLeft", freeDownloadsLeft);
      updateDownloadCounterUI(
        DOMElements.downloadCounter,
        DOMElements.menuDownloadImageBtn,
        DOMElements.watchAdButton,
        freeDownloadsLeft,
        showMessage
      );
      showMessage(
        "Imagen descargada exitosamente como PNG.",
        "success",
        DOMElements.messageArea
      );
    });

  if (DOMElements.menuResetImageBtn)
    DOMElements.menuResetImageBtn.addEventListener("click", resetEditorState);
  if (DOMElements.menuClearCanvasBtn)
    DOMElements.menuClearCanvasBtn.addEventListener("click", () => {
      if (editorCtx.current) {
        clearCanvas(
          DOMElements.imageCanvas,
          editorCtx.current,
          DOMElements.placeholderText
        );
        setHistoryState([]); // Reiniciar historial
        saveState(DOMElements.imageCanvas, setHistoryState); // Guardar un estado vacío
        showMessage("Canvas limpiado.", "success", DOMElements.messageArea);
      } else {
        showMessage(
          "No hay canvas para limpiar.",
          "warning",
          DOMElements.messageArea
        );
      }
    });

  // Deshacer/Rehacer
  if (DOMElements.menuUndoBtn)
    DOMElements.menuUndoBtn.addEventListener("click", () => {
      if (historyIndex.current > 0) {
        restoreState(
          history.current[historyIndex.current - 1],
          DOMElements.imageCanvas,
          editorCtx.current,
          DOMElements.placeholderText,
          currentImageBuffer,
          historyIndex,
          updateUndoRedoButtons,
          DOMElements.undoBtn,
          DOMElements.redoBtn,
          history.current
        );
        showMessage("Acción deshecha.", "success", DOMElements.messageArea);
      } else {
        showMessage(
          "No hay más acciones para deshacer.",
          "warning",
          DOMElements.messageArea
        );
      }
    });
  if (DOMElements.menuRedoBtn)
    DOMElements.menuRedoBtn.addEventListener("click", () => {
      if (historyIndex.current < history.current.length - 1) {
        restoreState(
          history.current[historyIndex.current + 1],
          DOMElements.imageCanvas,
          editorCtx.current,
          DOMElements.placeholderText,
          currentImageBuffer,
          historyIndex,
          updateUndoRedoButtons,
          DOMElements.undoBtn,
          DOMElements.redoBtn,
          history.current
        );
        showMessage("Acción rehecha.", "success", DOMElements.messageArea);
      } else {
        showMessage(
          "No hay más acciones para rehacer.",
          "warning",
          DOMElements.messageArea
        );
      }
    });
  if (DOMElements.undoBtn)
    DOMElements.undoBtn.addEventListener("click", () =>
      DOMElements.menuUndoBtn.click()
    );
  if (DOMElements.redoBtn)
    DOMElements.redoBtn.addEventListener("click", () =>
      DOMElements.menuRedoBtn.click()
    );

  // Herramientas de dibujo y ajuste
  const toolButtons = [
    DOMElements.brushTool,
    DOMElements.eraserTool,
    DOMElements.textTool,
    DOMElements.eyedropperTool,
    DOMElements.menuCropTool,
  ];
  toolButtons.forEach((btn) => {
    if (btn)
      btn.addEventListener("click", () => {
        let toolName = btn.id
          .replace("Tool", "")
          .replace("menu", "")
          .toLowerCase();
        if (toolName === "croptool") toolName = "crop"; // Normalizar nombre para crop
        activateTool(toolName, DOMElements); // Activa la herramienta a través del manager
      });
  });

  // Event listeners para ajustes de imagen (Brillo, Contraste, etc.)
  const adjustmentSliders = [
    "brightnessRange",
    "contrastRange",
    "saturationRange",
    "hueRotateRange",
    "exposureRange",
    "gammaRange",
  ];
  let adjustmentTimeout;
  adjustmentSliders.forEach((id) => {
    if (DOMElements[id]) {
      DOMElements[id].addEventListener("input", () => {
        // Actualiza el valor mostrado inmediatamente
        if (DOMElements[`${id.replace("Range", "Value")}`]) {
          let value = DOMElements[id].value;
          if (id === "saturationRange") value += "%";
          if (id === "hueRotateRange") value += "°";
          if (id === "gammaRange") value = (parseInt(value) / 100).toFixed(1);
          DOMElements[`${id.replace("Range", "Value")}`].textContent = value;
        }

        clearTimeout(adjustmentTimeout);
        adjustmentTimeout = setTimeout(() => {
          if (originalImage) {
            applyAdjustments(
              originalImage,
              currentImageBuffer,
              editorCtx.current,
              drawImageOnCanvas,
              saveState,
              DOMElements.imageCanvas,
              setHistoryState,
              DOMElements.messageArea,
              DOMElements.brightnessRange.value,
              DOMElements.contrastRange.value,
              DOMElements.saturationRange.value,
              DOMElements.hueRotateRange.value,
              DOMElements.exposureRange.value,
              DOMElements.gammaRange.value
            );
          } else {
            showMessage(
              "Carga una imagen para aplicar ajustes.",
              "warning",
              DOMElements.messageArea
            );
          }
        }, 300); // Debounce para evitar muchas llamadas
      });
    }
  });

  // Event listeners para filtros directos (Escala de Grises, Sepia, etc.)
  const filterButtons = [
    "menuGrayscaleBtn",
    "menuSepiaBtn",
    "menuInvertBtn",
    "menuBlurBtn",
    "menuSharpenBtn",
  ];
  filterButtons.forEach((id) => {
    if (DOMElements[id]) {
      DOMElements[id].addEventListener("click", () => {
        const filterName = id
          .replace("menu", "")
          .replace("Btn", "")
          .toLowerCase();
        if (!currentImageBuffer) {
          showMessage(
            "Carga una imagen antes de aplicar filtros.",
            "warning",
            DOMElements.messageArea
          );
          return;
        }
        toggleLoading(true, DOMElements.loadingSpinner, DOMElements);
        applyFilter(
          filterName,
          currentImageBuffer,
          editorCtx.current,
          drawImageOnCanvas,
          saveState,
          DOMElements.imageCanvas,
          setHistoryState,
          showMessage,
          DOMElements.messageArea,
          DOMElements.blurIntensityRange, // Pasa los rangos de intensidad si son necesarios para el filtro
          DOMElements.sharpenIntensityRange,
          toggleLoading,
          DOMElements.loadingSpinner,
          DOMElements
        );
      });
    }
  });

  // Slider para desenfoque y enfoque (necesitan disparar el filtro al cambiar)
  if (DOMElements.blurIntensityRange) {
    DOMElements.blurIntensityRange.addEventListener("input", (e) => {
      DOMElements.blurIntensityValue.textContent = e.target.value;
      if (currentImageBuffer && editorCtx.current) {
        // Vuelve a aplicar el filtro de desenfoque al mover el slider
        applyFilter(
          "blur",
          currentImageBuffer,
          editorCtx.current,
          drawImageOnCanvas,
          saveState,
          DOMElements.imageCanvas,
          setHistoryState,
          showMessage,
          DOMElements.messageArea,
          DOMElements.blurIntensityRange,
          DOMElements.sharpenIntensityRange,
          toggleLoading,
          DOMElements.loadingSpinner,
          DOMElements
        );
      }
    });
  }
  if (DOMElements.sharpenIntensityRange) {
    DOMElements.sharpenIntensityRange.addEventListener("input", (e) => {
      DOMElements.sharpenIntensityValue.textContent = e.target.value;
      if (currentImageBuffer && editorCtx.current) {
        // Vuelve a aplicar el filtro de enfoque al mover el slider
        applyFilter(
          "sharpen",
          currentImageBuffer,
          editorCtx.current,
          drawImageOnCanvas,
          saveState,
          setHistoryState,
          showMessage,
          DOMElements.messageArea,
          DOMElements.blurIntensityRange,
          DOMElements.sharpenIntensityRange,
          toggleLoading,
          DOMElements.loadingSpinner,
          DOMElements
        );
      }
    });
  }

  // Placeholder functions for menu items (que no se implementarán ahora)
  const placeholderMenuItems = [
    DOMElements.menuLevelsBtn,
    DOMElements.menuColorBalanceBtn,
    DOMElements.menuVibranceBtn,
    DOMElements.menuPixelateBtn,
    DOMElements.menuVignetteBtn,
    DOMElements.menuNoiseBtn,
    DOMElements.menuEmbossBtn,
    DOMElements.menuWarmFilterBtn,
    DOMElements.menuCoolFilterBtn,
    DOMElements.menuPosterizeBtn,
    DOMElements.menuDuotoneBtn,
    DOMElements.menuBwControlBtn,
    DOMElements.lineTool, // Si no se implementan líneas y formas ahora
    DOMElements.rectangleTool,
    DOMElements.circleTool,
    DOMElements.triangleTool,
    DOMElements.fillTool,
    DOMElements.rectSelectTool,
    DOMElements.lassoTool,
    DOMElements.magicWandTool,
    DOMElements.flattenLayersBtn,
    DOMElements.mergeVisibleBtn,
  ];
  placeholderMenuItems.forEach((item) => {
    if (item) {
      item.addEventListener("click", () =>
        showMessage(
          `${item.textContent
            .trim()
            .replace("(Placeholder)", "")
            .trim()}: Funcionalidad no implementada.`,
          "warning",
          DOMElements.messageArea
        )
      );
    }
  });

  // Listeners for sidebar tool properties
  if (DOMElements.boldTextBtn)
    DOMElements.boldTextBtn.addEventListener("click", () => {
      DOMElements.boldTextBtn.classList.toggle("active");
    });
  if (DOMElements.italicTextBtn)
    DOMElements.italicTextBtn.addEventListener("click", () => {
      DOMElements.italicTextBtn.classList.toggle("active");
    });
  if (DOMElements.fontFamilySelect)
    DOMElements.fontFamilySelect.addEventListener("change", (e) => {
      // Logic handled by textTool.js during drawText
    });
  if (DOMElements.fontSizeRange && DOMElements.fontSizeValue)
    DOMElements.fontSizeRange.addEventListener("input", (e) => {
      DOMElements.fontSizeValue.textContent = `${e.target.value}px`;
    });

  if (DOMElements.colorPicker && editorCtx.current)
    DOMElements.colorPicker.addEventListener("input", (e) => {
      editorCtx.current.strokeStyle = e.target.value;
      editorCtx.current.fillStyle = e.target.value;
      showMessage(
        `Color cambiado a ${e.target.value}.`,
        "success",
        DOMElements.messageArea
      );
    });
  if (
    DOMElements.lineWidthRange &&
    editorCtx.current &&
    DOMElements.lineWidthValue
  )
    DOMElements.lineWidthRange.addEventListener("input", (e) => {
      editorCtx.current.lineWidth = e.target.value;
      DOMElements.lineWidthValue.textContent = `${e.target.value}px`;
    });
  if (DOMElements.brushHardnessRange && DOMElements.brushHardnessValue)
    DOMElements.brushHardnessRange.addEventListener("input", (e) => {
      DOMElements.brushHardnessValue.textContent = `${e.target.value}%`;
      // Lógica de dureza de pincel/borrador iría aquí si se aplica en tiempo real
    });
  if (
    DOMElements.globalOpacityRange &&
    editorCtx.current &&
    DOMElements.globalOpacityValue
  )
    DOMElements.globalOpacityRange.addEventListener("input", (e) => {
      editorCtx.current.globalAlpha = parseInt(e.target.value) / 100;
      DOMElements.globalOpacityValue.textContent = `${e.target.value}%`;
    });

  // Bind global action buttons from sidebar
  if (DOMElements.watchAdButton)
    DOMElements.watchAdButton.addEventListener("click", () =>
      watchAdForGenerations(
        freeDownloadsLeft,
        CONFIG.DOWNLOADS_PER_AD_WATCH,
        DOMElements.watchAdButton,
        updateDownloadCounterUI,
        DOMElements.downloadCounter,
        DOMElements.menuDownloadImageBtn,
        showMessage,
        DOMElements.messageArea
      )
    );

  // Listeners for modals
  if (DOMElements.acceptCookiesButton)
    DOMElements.acceptCookiesButton.addEventListener("click", () =>
      acceptCookies(
        DOMElements.cookieConsent,
        showSubscriptionModal,
        DOMElements.subscriptionModal
      )
    );
  if (DOMElements.subscribeButton)
    DOMElements.subscribeButton.addEventListener("click", () =>
      handleSubscription(
        DOMElements.emailInput,
        DOMElements.subscriptionModal,
        showMessage,
        DOMElements.messageArea
      )
    );
  if (DOMElements.noThanksButton)
    DOMElements.noThanksButton.addEventListener("click", () =>
      dismissSubscription(DOMElements.subscriptionModal)
    );

  // Generic Message Modal
  if (DOMElements.messageModalCloseButton)
    DOMElements.messageModalCloseButton.addEventListener("click", () =>
      hideMessageModal(DOMElements.messageModal)
    );
  if (DOMElements.messageModal)
    DOMElements.messageModal.addEventListener("click", (event) => {
      if (event.target === DOMElements.messageModal) {
        hideMessageModal(DOMElements.messageModal);
      }
    });

  // Navigation responsive
  // NOTA: 'menuToggle' y 'navLinksContainer' no están en DOMElements para este editor.
  // Si deseas que la navegación principal también sea responsive,
  // asegúrate de que estos elementos existan en tu HTML y se incluyan en DOMElements.
  // Por ahora, asumimos que 'setupNavbarResponsive' está relacionado con la navegación global si existe.
  // Si no tienes un menú hamburguesa en este editor, esta sección puede no ser relevante.
  // El código actual de DOMElements no incluye 'menuToggle' ni 'navLinksContainer'.
  // Si existen en el HTML de la navegación principal, deberías añadirlos a DOMElements.
  // Ejemplo:
  // menuToggle: document.getElementById("menuToggle"),
  // navLinksContainer: document.getElementById("main-navbar").querySelector(".flex-wrap"), // O el ID real de tu contenedor de enlaces
  // Esto es para la navegación principal, no para la menu-bar del editor.
  if (DOMElements.mainNavbar && document.getElementById("menuToggle")) {
    // Check for global navbar toggle
    const menuToggleElement = document.getElementById("menuToggle");
    const navLinksContainerElement =
      DOMElements.mainNavbar.querySelector(".flex-wrap"); // Assuming this is your container for responsive links
    if (menuToggleElement && navLinksContainerElement) {
      setupNavbarResponsive(
        menuToggleElement,
        navLinksContainerElement,
        DOMElements.mainNavbar
      );
    }
  }

  // Eventos de ratón para el canvas
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  DOMElements.imageCanvas.addEventListener("mousedown", (e) => {
    if (!currentImageBuffer) return;
    const { x, y } = getMousePos(e, DOMElements.imageCanvas);

    if (activeToolState.current === "brush") {
      isDrawing = true;
      lastX = x;
      lastY = y;
      startBrush({ offsetX: x, offsetY: y }, DOMElements, currentImageBuffer);
    } else if (activeToolState.current === "eraser") {
      isDrawing = true;
      lastX = x;
      lastY = y;
      startEraser({ offsetX: x, offsetY: y }, DOMElements, currentImageBuffer);
    } else if (activeToolState.current === "crop") {
      handleCropStart(x, y);
    } else if (activeToolState.current === "eyedropper") {
      pickColor(
        x,
        y,
        editorCtx.current,
        DOMElements.colorPicker,
        DOMElements.messageArea,
        showMessage
      );
      activateTool("brush", DOMElements); // Vuelve al pincel después de seleccionar
    }
  });

  DOMElements.imageCanvas.addEventListener("mousemove", (e) => {
    if (!currentImageBuffer) return;
    const { x, y } = getMousePos(e, DOMElements.imageCanvas);

    if (
      isDrawing &&
      (activeToolState.current === "brush" ||
        activeToolState.current === "eraser")
    ) {
      if (activeToolState.current === "brush") {
        drawBrush({ offsetX: x, offsetY: y }, DOMElements, currentImageBuffer);
      } else if (activeToolState.current === "eraser") {
        drawEraser({ offsetX: x, offsetY: y }, DOMElements, currentImageBuffer);
      }
    } else if (activeToolState.current === "crop") {
      handleCropMove(x, y, DOMElements.cropOverlay);
    }
  });

  DOMElements.imageCanvas.addEventListener("mouseup", () => {
    if (!currentImageBuffer) return;

    if (isDrawing) {
      isDrawing = false;
      if (activeToolState.current === "brush") {
        endBrush(DOMElements, currentImageBuffer);
      } else if (activeToolState.current === "eraser") {
        endEraser(DOMElements, currentImageBuffer);
      }
    } else if (activeToolState.current === "crop") {
      handleCropEnd(DOMElements.cropOverlay); // Solo finaliza el arrastre del overlay, no aplica el recorte
    }
  });

  DOMElements.imageCanvas.addEventListener("click", (e) => {
    if (!currentImageBuffer) return;
    const { x, y } = getMousePos(e, DOMElements.imageCanvas);

    if (activeToolState.current === "text" && DOMElements.textInput.value) {
      drawText(
        x,
        y,
        DOMElements.textInput.value,
        DOMElements.fontSizeRange.value,
        DOMElements.fontFamilySelect.value,
        DOMElements.colorPicker.value,
        DOMElements.boldTextBtn.classList.contains("active"),
        DOMElements.italicTextBtn.classList.contains("active"),
        DOMElements.globalOpacityRange.value,
        currentImageBuffer,
        editorCtx.current,
        DOMElements.imageCanvas,
        redrawFromBuffer,
        saveState,
        setHistoryState,
        showMessage,
        DOMElements.messageArea
      );
      DOMElements.textInput.value = ""; // Limpiar input después de añadir texto
      activateTool("brush", DOMElements); // Volver al pincel
    }
  });

  // Eventos para el modal de recorte
  if (DOMElements.applyCropBtn)
    DOMElements.applyCropBtn.addEventListener("click", () => {
      if (!currentImageBuffer) {
        showMessage(
          "No hay imagen cargada para recortar.",
          "warning",
          DOMElements.messageArea
        );
        return;
      }
      applyCrop(
        currentImageBuffer,
        editorCtx.current,
        DOMElements.cropOverlay,
        DOMElements.imageCanvas,
        originalImage, // Pasamos originalImage para que se actualice al recortar
        drawImageOnCanvas,
        saveState,
        setHistoryState,
        toggleLoading,
        DOMElements.loadingSpinner,
        DOMElements.messageArea,
        showMessage,
        DOMElements.cropOptions
      );
      activateTool("brush", DOMElements); // Volver al pincel después de aplicar recorte
    });
  if (DOMElements.cancelCropBtn)
    DOMElements.cancelCropBtn.addEventListener("click", () =>
      cancelCrop(
        DOMElements.cropOverlay,
        DOMElements.cropOptions,
        DOMElements.imageCanvas,
        activateTool,
        showMessage,
        DOMElements.messageArea,
        DOMElements
      )
    );
}

document.addEventListener("DOMContentLoaded", function () {
  initDOMElements(); // Primero inicializa los elementos del DOM
  setupEventListeners(); // Luego configura los event listeners

  // Inicializar la herramienta por defecto (pincel)
  if (DOMElements.brushTool) {
    // activa la herramienta para que el cursor y propiedades se muestren correctamente
    activateTool("brush", DOMElements);
  }

  // Mostrar el consentimiento de cookies y luego el modal de suscripción
  showCookieConsent(DOMElements.cookieConsent);
});

// Reajustar canvas al cambiar el tamaño de la ventana
window.addEventListener("resize", () => {
  if (currentImageBuffer) {
    // Redibuja la imagen del buffer al canvas visible, ajustando el tamaño
    drawImageOnCanvas(
      currentImageBuffer,
      DOMElements.imageCanvas,
      editorCtx.current,
      DOMElements.placeholderText
    );
  }
  // Re-draw crop overlay if active
  if (
    activeToolState.current === "crop" &&
    DOMElements.cropOverlay &&
    !DOMElements.cropOverlay.classList.contains("hidden")
  ) {
    // Necesita repintar el overlay de recorte si estaba visible
    handleCropMove(
      DOMElements.imageCanvas.width,
      DOMElements.imageCanvas.height,
      DOMElements.cropOverlay
    ); // Forzar repintado con dimensiones actuales
  }
});
