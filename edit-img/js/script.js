// js/script.js

(function () {
  // IIFE para encapsular todo el código y asegurar el ámbito y hoisting
  // --- Constantes de Configuración ---
  const CONFIG = {
    MAX_FREE_DOWNLOADS: 5,
    DOWNLOADS_PER_AD_WATCH: 3,
  };

  // --- Variables de Estado Globales ---
  let originalImage = null;
  let currentImageBuffer = null;
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  let activeTool = "brush";
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

  // Límite de descargas
  let freeDownloadsLeft = CONFIG.MAX_FREE_DOWNLOADS;

  // --- DOMElements (se inicializará en initApp) ---
  let DOMElements;

  // --- editorCtx declarado aquí para ser accesible globalmente dentro de la IIFE ---
  let editorCtx;

  // --- FUNCIONES DE UTILIDAD GENERAL Y UI ---

  function downloadImage(imageUrl, filename = "imagen-generada.png") {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function showMessage(text, type) {
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
      }, 4000);
    }
  }

  function hideMessage() {
    if (DOMElements.messageArea) {
      DOMElements.messageArea.classList.add("hidden");
    }
  }

  function updateLocalStorageUsage() {
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      totalBytes += localStorage.getItem(key).length * 2;
    }
    const totalKB = totalBytes / 1024;
    const totalMB = totalKB / 1024;

    let usageText = "";
    if (totalMB >= 1) {
      usageText = `${totalMB.toFixed(2)} MB`;
    } else {
      usageText = `${totalKB.toFixed(2)} KB`;
    }
    if (DOMElements.localStorageUsage) {
      DOMElements.localStorageUsage.textContent = `Uso del Almacenamiento Local: ${usageText}`;
    }

    const QUOTA_WARNING_MB = 4;
    if (totalMB >= QUOTA_WARNING_MB) {
      showMessage(
        `¡Advertencia! El almacenamiento local se está llenando (${usageText}). Considera limpiar la galería.`,
        "info",
        7000
      );
    }
  }

  function toggleLoading(show) {
    if (DOMElements.loadingSpinner)
      DOMElements.loadingSpinner.style.display = show ? "block" : "none";

    const allControls = document.querySelectorAll(
      'button, input[type="file"], input[type="range"], input[type="color"], input[type="text"], select, label[for="imageUpload"]'
    );
    allControls.forEach((control) => {
      if (control.id === "imageUpload" || control.id === "fileUploadLabel") {
        control.disabled = false;
      } else if (
        control.id === "undoBtn" ||
        control.id === "redoBtn" ||
        control.id === "menuUndoBtn" ||
        control.id === "menuRedoBtn"
      ) {
        control.disabled = show;
        control.classList.toggle("disabled-btn", show);
      } else {
        control.disabled = show;
        control.classList.toggle("disabled-btn", show);
      }
    });

    if (!show) {
      updateUndoRedoButtons();
      updateDownloadCounterUI();
    }
  }

  function drawImageOnCanvas(img) {
    if (DOMElements.placeholderText)
      DOMElements.placeholderText.classList.add("hidden");

    if (!DOMElements.imageCanvas || !editorCtx) {
      console.error("Canvas or context not available for drawing.");
      return;
    }

    DOMElements.imageCanvas.width = img.width;
    DOMElements.imageCanvas.height = img.height;

    const parentContainer = DOMElements.imageCanvas.parentElement;
    const parentWidth = parentContainer.clientWidth;
    const parentHeight = parentContainer.clientHeight;

    let ratio = 1;
    if (img.width > parentWidth) {
      ratio = parentWidth / img.width;
    }
    if (img.height * ratio > parentHeight && img.height * ratio !== 0) {
      ratio = parentHeight / img.height;
    }

    DOMElements.imageCanvas.style.width = `${img.width * ratio}px`;
    DOMElements.imageCanvas.style.height = `${img.height * ratio}px`;

    editorCtx.clearRect(
      0,
      0,
      DOMElements.imageCanvas.width,
      DOMElements.imageCanvas.height
    );
    editorCtx.drawImage(img, 0, 0);
  }

  function saveState() {
    if (!DOMElements.imageCanvas) return;

    if (historyIndex < history.length - 1) {
      history = history.slice(0, historyIndex + 1);
    }
    history.push(DOMElements.imageCanvas.toDataURL());
    historyIndex++;
    updateUndoRedoButtons();
  }

  function restoreState(dataURL) {
    const img = new Image();
    img.onload = () => {
      drawImageOnCanvas(img);
      if (currentImageBuffer) {
        currentImageBuffer.width = img.width;
        currentImageBuffer.height = img.height;
        currentImageBuffer.getContext("2d").drawImage(img, 0, 0);
      } else {
        currentImageBuffer = document.createElement("canvas");
        currentImageBuffer.width = img.width;
        currentImageBuffer.height = img.height;
        currentImageBuffer.getContext("2d").drawImage(img, 0, 0);
      }
      updateUndoRedoButtons();
    };
    img.src = dataURL;
  }

  function updateUndoRedoButtons() {
    if (DOMElements.undoBtn) {
      DOMElements.undoBtn.disabled = historyIndex <= 0;
      DOMElements.undoBtn.classList.toggle("disabled-btn", historyIndex <= 0);
    }
    if (DOMElements.redoBtn) {
      DOMElements.redoBtn.disabled = historyIndex >= history.length - 1;
      DOMElements.redoBtn.classList.toggle(
        "disabled-btn",
        historyIndex >= history.length - 1
      );
    }

    if (DOMElements.menuUndoBtn)
      DOMElements.menuUndoBtn.disabled = historyIndex <= 0;
    if (DOMElements.menuRedoBtn)
      DOMElements.menuRedoBtn.disabled = historyIndex >= history.length - 1;
  }

  // --- FUNCIONES DE EDICIÓN Y FILTROS ---

  function applyAdjustments(
    img,
    brightness,
    contrast,
    saturation,
    hueRotate,
    exposure,
    gamma
  ) {
    if (!img || !editorCtx) return;

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
    const gammaFactor = gamma / 100;

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

      r = r * (1 + exposureFactor * 2);
      g = g * (1 + exposureFactor * 2);
      b = b * (1 + exposureFactor * 2);

      r += brightFactor * 255;
      g += brightFactor * 255;
      b += brightFactor * 255;

      r = (r - 128) * contrastFactor + 128;
      g = (g - 128) * contrastFactor + 128;
      b = (b - 128) * contrastFactor + 128;

      const avg = (r + g + b) / 3;
      r = avg + (r - avg) * saturationFactor;
      g = avg + (g - avg) * saturationFactor;
      b = avg + (b - avg) * saturationFactor;

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

      r = 255 * Math.pow(r / 255, 1 / gammaFactor);
      g = 255 * Math.pow(g / 255, 1 / gammaFactor);
      b = 255 * Math.pow(b / 255, 1 / gammaFactor);

      pixels[i] = Math.max(0, Math.min(255, r));
      pixels[i + 1] = Math.max(0, Math.min(255, g));
      pixels[i + 2] = Math.max(0, Math.min(255, b));
    }
    tempCtx.putImageData(imageData, 0, 0);

    if (currentImageBuffer) {
      currentImageBuffer.width = tempCanvas.width;
      currentImageBuffer.height = tempCanvas.height;
      currentImageBuffer.getContext("2d").drawImage(tempCanvas, 0, 0);
    }
    drawImageOnCanvas(currentImageBuffer);
  }

  let adjustmentTimeout;
  const debouncedApplyAdjustments = () => {
    if (!originalImage) {
      showMessage("Carga una imagen para aplicar ajustes.", "warning");
      return;
    }
    if (DOMElements.brightnessRange && DOMElements.brightnessValue)
      DOMElements.brightnessValue.textContent =
        DOMElements.brightnessRange.value.toString();
    if (DOMElements.contrastRange && DOMElements.contrastValue)
      DOMElements.contrastValue.textContent =
        DOMElements.contrastRange.value.toString();
    if (DOMElements.saturationRange && DOMElements.saturationValue)
      DOMElements.saturationValue.textContent = `${DOMElements.saturationRange.value.toString()}%`;
    if (DOMElements.hueRotateRange && DOMElements.hueRotateValue)
      DOMElements.hueRotateValue.textContent = `${DOMElements.hueRotateRange.value.toString()}°`;
    if (DOMElements.exposureRange && DOMElements.exposureValue)
      DOMElements.exposureValue.textContent =
        DOMElements.exposureRange.value.toString();
    if (DOMElements.gammaRange && DOMElements.gammaValue)
      DOMElements.gammaValue.textContent = (
        parseInt(DOMElements.gammaRange.value) / 100
      ).toFixed(1);
    if (DOMElements.blurIntensityRange && DOMElements.blurIntensityValue)
      DOMElements.blurIntensityValue.textContent =
        DOMElements.blurIntensityRange.value.toString();
    if (DOMElements.sharpenIntensityRange && DOMElements.sharpenIntensityValue)
      DOMElements.sharpenIntensityValue.textContent =
        DOMElements.sharpenIntensityRange.value.toString();

    clearTimeout(adjustmentTimeout);
    adjustmentTimeout = setTimeout(() => {
      const tempImageForAdjustments = new Image();
      tempImageForAdjustments.onload = () => {
        applyAdjustments(
          tempImageForAdjustments,
          parseInt(DOMElements.brightnessRange.value),
          parseInt(DOMElements.contrastRange.value),
          parseInt(DOMElements.saturationRange.value),
          parseInt(DOMElements.hueRotateRange.value),
          parseInt(DOMElements.exposureRange.value),
          parseInt(DOMElements.gammaRange.value)
        );
      };
      if (historyIndex >= 0) {
        tempImageForAdjustments.src = history[historyIndex];
      } else if (originalImage) {
        tempImageForAdjustments.src = originalImage.src;
      } else {
        return;
      }
      saveState();
      showMessage("Ajustes aplicados.", "success");
    }, 300);
  };

  const applyFilter = (filterType) => {
    if (!currentImageBuffer || !editorCtx || !DOMElements.imageCanvas) {
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
    } else if (filterType === "blur") {
      const blurRadius = parseFloat(DOMElements.blurIntensityRange.value) * 2;
      if (blurRadius === 0) {
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
          newPixels[pixelIndex + 3] = pixels[pixelIndex + 3];
        }
      }
      pixels.set(newPixels);
    } else if (filterType === "sharpen") {
      const sharpenAmount = parseFloat(DOMElements.sharpenIntensityRange.value);
      if (sharpenAmount === 0) {
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
      ];
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
          newPixels[pixelIndex + 3] = pixels[pixelIndex + 3];
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
            for (
              let px = 0;
              px < pixelSize && x + px < tempCanvas.width;
              px++
            ) {
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
          newPixels[pixelIndex + 3] = pixels[pixelIndex + 3];
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
      currentImageBuffer.width = tempCanvas.width;
      currentImageBuffer.height = tempCanvas.height;
      currentImageBuffer.getContext("2d").drawImage(tempCanvas, 0, 0);
    }

    drawImageOnCanvas(currentImageBuffer);
    saveState();
    toggleLoading(false);
    showMessage(`Filtro ${filterType} aplicado.`, "success");
  };

  // --- Funcionalidad de Dibujo y Formas ---

  function getMousePos(e) {
    if (!DOMElements.imageCanvas) return { x: 0, y: 0 };
    const rect = DOMElements.imageCanvas.getBoundingClientRect();
    const scaleX = DOMElements.imageCanvas.width / rect.width;
    const scaleY = DOMElements.imageCanvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function redrawFromBuffer() {
    if (currentImageBuffer && editorCtx && DOMElements.imageCanvas) {
      editorCtx.clearRect(
        0,
        0,
        DOMElements.imageCanvas.width,
        DOMElements.imageCanvas.height
      );
      editorCtx.drawImage(currentImageBuffer, 0, 0);
    }
  }

  function drawShape(startX, startY, endX, endY, permanent = false) {
    if (
      !editorCtx ||
      !DOMElements.colorPicker ||
      !DOMElements.lineWidthRange ||
      !DOMElements.globalOpacityRange
    )
      return;

    // Guardar el estado actual del canvas para dibujar temporalmente
    if (!permanent) redrawFromBuffer();

    editorCtx.beginPath();
    editorCtx.strokeStyle = DOMElements.colorPicker.value;
    editorCtx.fillStyle = DOMElements.colorPicker.value;
    editorCtx.lineWidth = parseInt(DOMElements.lineWidthRange.value);
    editorCtx.globalAlpha =
      parseInt(DOMElements.globalOpacityRange.value) / 100;

    const width = endX - startX;
    const height = endY - startY;

    if (activeTool === "line") {
      editorCtx.moveTo(startX, startY);
      editorCtx.lineTo(endX, endY);
      editorCtx.stroke();
    } else if (activeTool === "rectangle") {
      editorCtx.rect(startX, startY, width, height);
      editorCtx.fill();
    } else if (activeTool === "circle") {
      const centerX = startX + width / 2;
      const centerY = startY + height / 2;
      const radius = Math.sqrt(width * width + height * height) / 2;
      editorCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      editorCtx.fill();
    } else if (activeTool === "triangle") {
      editorCtx.moveTo(startX, endY); // Bottom-left
      editorCtx.lineTo(startX + width / 2, startY); // Top-middle
      editorCtx.lineTo(endX, endY); // Bottom-right
      editorCtx.closePath(); // Close the path
      editorCtx.fill();
    }
  }

  function pickColor(x, y) {
    if (!editorCtx || !DOMElements.colorPicker || !DOMElements.imageCanvas)
      return;
    try {
      const pixel = editorCtx.getImageData(x, y, 1, 1).data;
      const hexColor = `#${(
        (1 << 24) +
        (pixel[0] << 16) +
        (pixel[1] << 8) +
        pixel[2]
      )
        .toString(16)
        .slice(1)
        .toUpperCase()}`;
      DOMElements.colorPicker.value = hexColor;
      editorCtx.strokeStyle = hexColor;
      editorCtx.fillStyle = hexColor;
      showMessage(`Color seleccionado: ${hexColor}`, "success");
    } catch (e) {
      console.error("Error al obtener el color del píxel:", e);
      showMessage(
        "No se pudo seleccionar el color. Puede ser un problema de CORS con la imagen.",
        "error"
      );
    }
  }

  // --- Funcionalidad de Transformación y Ajustes ---

  function applyTransformation(type) {
    if (!currentImageBuffer || !editorCtx || !DOMElements.imageCanvas) {
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

    currentImageBuffer.width = tempCanvas.width;
    currentImageBuffer.height = tempCanvas.height;
    currentImageBuffer.getContext("2d").drawImage(tempCanvas, 0, 0);

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

  // Redimensionar Imagen (desde el menú)
  function applyResize() {
    if (
      !currentImageBuffer ||
      !DOMElements.resizeWidthInput ||
      !DOMElements.resizeHeightInput
    ) {
      showMessage(
        "Carga una imagen y proporciona nuevas dimensiones.",
        "warning"
      );
      return;
    }
    const newWidth = parseInt(DOMElements.resizeWidthInput.value);
    const newHeight = parseInt(DOMElements.resizeHeightInput.value);

    if (
      isNaN(newWidth) ||
      isNaN(newHeight) ||
      newWidth <= 0 ||
      newHeight <= 0
    ) {
      showMessage(
        "Por favor, introduce dimensiones válidas (números positivos).",
        "error"
      );
      return;
    }

    toggleLoading(true);
    hideMessage();

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;
    tempCtx.drawImage(currentImageBuffer, 0, 0, newWidth, newHeight);

    currentImageBuffer.width = tempCanvas.width;
    currentImageBuffer.height = tempCanvas.height;
    currentImageBuffer.getContext("2d").drawImage(tempCanvas, 0, 0);

    drawImageOnCanvas(currentImageBuffer);
    saveState();
    toggleLoading(false);
    showMessage("Imagen redimensionada con éxito.", "success");
    DOMElements.resizeOptions.classList.add("hidden"); // Ocultar opciones de redimensionamiento
  }

  // Recortar Imagen (desde el menú)
  function applyCrop() {
    if (!currentImageBuffer || !editorCtx || !DOMElements.cropOverlay) {
      showMessage(
        "No hay área de recorte seleccionada o imagen cargada.",
        "warning"
      );
      return;
    }

    const x = Math.min(cropStartX, cropCurrentX);
    const y = Math.min(cropStartY, cropCurrentY);
    const width = Math.abs(cropCurrentX - cropStartX);
    const height = Math.abs(cropCurrentY - cropStartY);

    if (width === 0 || height === 0) {
      showMessage("Selecciona un área de recorte válida.", "warning");
      return;
    }

    toggleLoading(true);
    hideMessage();

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCtx.drawImage(
      currentImageBuffer,
      x,
      y,
      width,
      height,
      0,
      0,
      width,
      height
    );

    originalImage.src = tempCanvas.toDataURL(); // Actualiza la imagen original
    originalImage.onload = () => {
      currentImageBuffer.width = originalImage.width;
      currentImageBuffer.height = originalImage.height;
      currentImageBuffer.getContext("2d").drawImage(originalImage, 0, 0);

      drawImageOnCanvas(currentImageBuffer);
      saveState();
      toggleLoading(false);
      showMessage("Imagen recortada con éxito.", "success");
      DOMElements.cropOptions.classList.add("hidden");
      DOMElements.cropOverlay.classList.add("hidden");
      isCropping = false;
      DOMElements.imageCanvas.style.cursor = "default";
      if (DOMElements.brushTool) setupToolButtons(DOMElements.brushTool); // Volver al pincel
    };
  }

  function cancelCrop() {
    isCropping = false;
    if (DOMElements.cropOverlay)
      DOMElements.cropOverlay.classList.add("hidden");
    if (DOMElements.cropOptions)
      DOMElements.cropOptions.classList.add("hidden");
    if (DOMElements.imageCanvas)
      DOMElements.imageCanvas.style.cursor = "default";
    if (DOMElements.brushTool) setupToolButtons(DOMElements.brushTool); // Volver al pincel
    showMessage("Recorte cancelado.", "info");
  }

  function drawCropOverlay() {
    if (
      isCropping &&
      cropStartX !== undefined &&
      DOMElements.imageCanvas &&
      DOMElements.imageCanvas.getBoundingClientRect().width > 0 &&
      DOMElements.cropOverlay
    ) {
      const x = Math.min(cropStartX, cropCurrentX);
      const y = Math.min(cropStartY, cropCurrentY);
      const width = Math.abs(cropCurrentX - cropStartX);
      const height = Math.abs(cropCurrentY - cropStartY);

      const canvasRect = DOMElements.imageCanvas.getBoundingClientRect();
      const scaleX = canvasRect.width / DOMElements.imageCanvas.width;
      const scaleY = canvasRect.height / DOMElements.imageCanvas.height;

      DOMElements.cropOverlay.style.left = `${canvasRect.left + x * scaleX}px`;
      DOMElements.cropOverlay.style.top = `${canvasRect.top + y * scaleY}px`;
      DOMElements.cropOverlay.style.width = `${width * scaleX}px`;
      DOMElements.cropOverlay.style.height = `${height * scaleY}px`;
      DOMElements.cropOverlay.classList.remove("hidden");
    }
  }

  // --- Funcionalidad de Límite de Descargas y Anuncios ---
  function updateDownloadCounterUI() {
    if (DOMElements.downloadCounter)
      DOMElements.downloadCounter.textContent = `Descargas gratuitas restantes: ${freeDownloadsLeft}`;

    // Habilitar/Deshabilitar el botón de descarga principal del menú
    if (DOMElements.menuDownloadImageBtn) {
      DOMElements.menuDownloadImageBtn.disabled =
        !originalImage || freeDownloadsLeft <= 0;
      DOMElements.menuDownloadImageBtn.classList.toggle(
        "disabled-btn",
        !originalImage || freeDownloadsLeft <= 0
      );
    }

    if (freeDownloadsLeft <= 0) {
      if (DOMElements.watchAdButton)
        DOMElements.watchAdButton.classList.remove("hidden");
      showMessage(
        `Has agotado tus descargas gratuitas. Mira un anuncio para obtener más.`,
        "warning"
      );
    } else {
      if (DOMElements.watchAdButton)
        DOMElements.watchAdButton.classList.add("hidden");
      if (
        DOMElements.messageArea &&
        DOMElements.messageArea.textContent.includes("agotado tus descargas")
      ) {
        hideMessage();
      }
    }
  }

  function watchAdForGenerations() {
    showMessage("Simulando anuncio... por favor espera.", "info", 3000);
    if (DOMElements.watchAdButton) DOMElements.watchAdButton.disabled = true;

    setTimeout(() => {
      freeDownloadsLeft += CONFIG.DOWNLOADS_PER_AD_WATCH;
      localStorage.setItem("freeDownloadsLeft", freeDownloadsLeft);
      updateDownloadCounterUI();
      if (DOMElements.watchAdButton) DOMElements.watchAdButton.disabled = false;
      showMessage(
        `¡Has obtenido +${CONFIG.DOWNLOADS_PER_AD_WATCH} descargas!`,
        "success",
        3000
      );
    }, 3000); // Simular 3 segundos de anuncio
  }

  // --- Funciones de Modales de Cookies y Suscripción ---

  function showCookieConsent() {
    // Asegurarse de que el elemento existe antes de manipularlo
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
    // Asegurarse de que el elemento existe antes de manipularlo
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

  // --- Lógica del Menú Desplegable ---
  function setupDropdown(button, dropdown) {
    if (!button || !dropdown) return;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      // Close other open dropdowns
      document
        .querySelectorAll(".menu-dropdown.show")
        .forEach((openDropdown) => {
          if (openDropdown && openDropdown !== dropdown) {
            openDropdown.classList.remove("show");
          }
        });
      dropdown.classList.toggle("show");
    });
  }

  // --- Manejo de la barra de navegación responsive (de ia-img) ---
  function updateActiveClass() {
    // Asegurarse de que DOMElements.mainNavbar exista antes de buscar elementos dentro
    if (!DOMElements.mainNavbar) {
      console.warn(
        "Navbar principal no encontrada para actualizar la clase activa. Asegúrate de que tenga id='main-navbar'."
      );
      return;
    }

    // Usar DOMElements.mainNavbar como contenedor para los selectores
    const navLinks = DOMElements.mainNavbar.querySelectorAll(".nav-item a");
    const submenuItems =
      DOMElements.mainNavbar.querySelectorAll(".submenu-item");
    const navItemGroups =
      DOMElements.mainNavbar.querySelectorAll(".nav-item.group");

    const currentPath = window.location.pathname;

    // Limpiar todas las clases 'active-link' y 'aria-current'
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

    // Iterar sobre todos los enlaces principales y de submenú para aplicar la clase activa
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
      imageUpload: document.getElementById("imageUpload"),
      fileNameSpan: document.getElementById("fileName"),
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
      menuRotateLeftBtn: document.getElementById("menuRotateLeftBtn"),
      menuRotateRightBtn: document.getElementById("menuRotateRightBtn"), // CORRECCIÓN
      menuFlipHorizontalBtn: document.getElementById("menuFlipHorizontalBtn"),
      menuFlipVerticalBtn: document.getElementById("menuFlipVerticalBtn"),
      menuResizeBtn: document.getElementById("menuResizeBtn"),
      menuCropTool: document.getElementById("menuCropTool"),
      menuDistortTool: document.getElementById("menuDistortTool"),
      menuBrightnessContrastBtn: document.getElementById(
        "menuBrightnessContrastBtn"
      ),
      menuSaturationHueBtn: document.getElementById("menuSaturationHueBtn"),
      menuExposureGammaBtn: document.getElementById("menuExposureGammaBtn"),
      menuLevelsBtn: document.getElementById("menuLevelsBtn"),
      menuColorBalanceBtn: document.getElementById("menuColorBalanceBtn"),
      menuVibranceBtn: document.getElementById("menuVibranceBtn"),
      menuGrayscaleBtn: document.getElementById("menuGrayscaleBtn"),
      menuSepiaBtn: document.getElementById("menuSepiaBtn"),
      menuInvertBtn: document.getElementById("menuInvertBtn"),
      menuBlurBtn: document.getElementById("menuBlurBtn"),
      menuSharpenBtn: document.getElementById("menuSharpenBtn"),
      menuPixelateBtn: document.getElementById("menuPixelateBtn"),
      menuVignetteBtn: document.getElementById("menuVignetteBtn"),
      menuNoiseBtn: document.getElementById("menuNoiseBtn"),
      menuEmbossBtn: document.getElementById("menuEmbossBtn"),
      menuPosterizeBtn: document.getElementById("menuPosterizeBtn"),
      menuDuotoneBtn: document.getElementById("menuDuotoneBtn"),
      menuBwControlBtn: document.getElementById("menuBwControlBtn"),
      menuWarmFilterBtn: document.getElementById("menuWarmFilterBtn"),
      menuCoolFilterBtn: document.getElementById("menuCoolFilterBtn"),

      // Actual Sidebar tool buttons (these are the ones that actually get 'active' class)
      brushTool: document.getElementById("brushTool"),
      eraserTool: document.getElementById("eraserTool"),
      lineTool: document.getElementById("lineTool"),
      textTool: document.getElementById("textTool"),
      rectangleTool: document.getElementById("rectangleTool"),
      circleTool: document.getElementById("circleTool"),
      triangleTool: document.getElementById("triangleTool"),
      eyedropperTool: document.getElementById("eyedropperTool"),
      fillTool: document.getElementById("fillTool"),
      rectSelectTool: document.getElementById("rectSelectTool"),
      lassoTool: document.getElementById("lassoTool"),
      magicWandTool: document.getElementById("magicWandTool"),
      flattenLayersBtn: document.getElementById("flattenLayersBtn"),
      mergeVisibleBtn: document.getElementById("mergeVisibleBtn"),

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
      resizeOptions: document.getElementById("resizeOptions"),
      resizeWidthInput: document.getElementById("resizeWidth"),
      resizeHeightInput: document.getElementById("resizeHeight"),
      resizeBtn: document.getElementById("resizeBtn"),
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

      menuToggle: document.getElementById("menuToggle"),
      navLinksContainer: document.querySelector(
        ".navbar-inner-content .flex-wrap"
      ),
    };

    // Configuración inicial del contexto del canvas
    if (DOMElements.imageCanvas) {
      editorCtx = DOMElements.imageCanvas.getContext("2d");
      editorCtx.lineWidth = parseInt(DOMElements.lineWidthRange.value);
      editorCtx.lineCap = "round";
      editorCtx.lineJoin = "round";
      editorCtx.strokeStyle = DOMElements.colorPicker.value;
      editorCtx.fillStyle = DOMElements.colorPicker.value;
    } else {
      console.error("Error: Canvas element not found!");
      return; // Detener la ejecución si el canvas no se encuentra
    }

    // Inicializar valores de sliders y textos asociados
    if (DOMElements.lineWidthValue && DOMElements.lineWidthRange)
      DOMElements.lineWidthValue.textContent = `${DOMElements.lineWidthRange.value.toString()}px`;
    if (DOMElements.fontSizeValue && DOMElements.fontSizeRange)
      DOMElements.fontSizeValue.textContent = `${DOMElements.fontSizeRange.value.toString()}px`;
    if (DOMElements.brushHardnessValue && DOMElements.brushHardnessRange)
      DOMElements.brushHardnessValue.textContent = `${DOMElements.brushHardnessRange.value.toString()}%`;
    if (DOMElements.globalOpacityValue && DOMElements.globalOpacityRange)
      DOMElements.globalOpacityValue.textContent = `${DOMElements.globalOpacityRange.value.toString()}%`;
    if (DOMElements.exposureValue && DOMElements.exposureRange)
      DOMElements.exposureValue.textContent =
        DOMElements.exposureRange.value.toString();
    if (DOMElements.gammaValue && DOMElements.gammaRange)
      DOMElements.gammaValue.textContent = (
        parseInt(DOMElements.gammaRange.value) / 100
      ).toFixed(1);
    if (DOMElements.blurIntensityValue && DOMElements.blurIntensityRange)
      DOMElements.blurIntensityValue.textContent =
        DOMElements.blurIntensityRange.value.toString();
    if (DOMElements.sharpenIntensityValue && DOMElements.sharpenIntensityRange)
      DOMElements.sharpenIntensityValue.textContent =
        DOMElements.sharpenIntensityRange.value.toString();

    // Cargar el contador de descargas o establecer el valor por defecto
    const storedDownloads = localStorage.getItem("freeDownloadsLeft");
    if (storedDownloads !== null) {
      freeDownloadsLeft = parseInt(storedDownloads, 10);
    } else {
      freeDownloadsLeft = CONFIG.MAX_FREE_DOWNLOADS;
      localStorage.setItem("freeDownloadsLeft", CONFIG.MAX_FREE_DOWNLOADS);
    }
    updateDownloadCounterUI();

    // Set up all tool buttons and their listeners
    drawingToolButtons = [
      DOMElements.brushTool,
      DOMElements.eraserTool,
      DOMElements.lineTool,
      DOMElements.textTool,
      DOMElements.rectangleTool,
      DOMElements.circleTool,
      DOMElements.triangleTool,
      DOMElements.eyedropperTool,
      DOMElements.menuCropTool, // Como una herramienta del menú que activa el modo de recorte
    ];
    drawingToolButtons.forEach((toolBtn) => {
      if (toolBtn) {
        // Asegurarse de que el elemento existe
        toolBtn.addEventListener("click", () => setupToolButtons(toolBtn));
      }
    });

    // Llama a resetEditorState para inicializar el estado de la UI
    resetEditorState();

    toggleLoading(false); // Make sure loading is off, then state is set

    // Setup menu dropdowns
    setupDropdown(DOMElements.fileMenuBtn, DOMElements.fileMenuDropdown);
    setupDropdown(DOMElements.editMenuBtn, DOMElements.editMenuDropdown);
    setupDropdown(DOMElements.imageMenuBtn, DOMElements.imageMenuDropdown);
    setupDropdown(DOMElements.filtersMenuBtn, DOMElements.filtersMenuDropdown);
    setupDropdown(DOMElements.toolsMenuBtn, DOMElements.toolsMenuDropdown);

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
          if (DOMElements.imageUpload) DOMElements.imageUpload.files = files; // Asegurarse que imageUpload existe
          if (DOMElements.imageUpload)
            DOMElements.imageUpload.dispatchEvent(new Event("change"));
        }
      });
    }

    // Bind menu item clicks to their corresponding functions
    if (DOMElements.imageUpload)
      DOMElements.imageUpload.addEventListener("change", handleImageUpload);
    if (DOMElements.menuLoadImageBtn)
      DOMElements.menuLoadImageBtn.addEventListener("click", () => {
        if (DOMElements.imageUpload) DOMElements.imageUpload.click();
      });

    if (DOMElements.menuDownloadImageBtn)
      DOMElements.menuDownloadImageBtn.addEventListener("click", () => {
        if (!originalImage) {
          showMessage(
            "Por favor, carga una imagen antes de descargar.",
            "error"
          );
          return;
        }
        if (freeDownloadsLeft <= 0) {
          showMessage(
            "Has agotado tus descargas gratuitas. Mira un anuncio para obtener más.",
            "error"
          );
          return;
        }
        if (DOMElements.imageCanvas) {
          // fileNameSpan puede ser null, no es crítico para la descarga
          const dataURL = DOMElements.imageCanvas.toDataURL("image/png");
          const a = document.createElement("a");
          a.href = dataURL;
          const originalFileName =
            DOMElements.fileNameSpan && DOMElements.fileNameSpan.textContent
              ? DOMElements.fileNameSpan.textContent.split(".")[0]
              : "imagen"; // Uso seguro
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

    if (DOMElements.menuResetImageBtn)
      DOMElements.menuResetImageBtn.addEventListener("click", () =>
        resetEditorState()
      );
    if (DOMElements.menuClearCanvasBtn)
      DOMElements.menuClearCanvasBtn.addEventListener("click", () => {
        if (originalImage && currentImageBuffer && editorCtx) {
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

    if (DOMElements.menuUndoBtn)
      DOMElements.menuUndoBtn.addEventListener("click", () => {
        if (historyIndex > 0) {
          historyIndex--;
          restoreState(history[historyIndex]);
          showMessage("Acción deshecha.", "success");
        } else {
          showMessage("No hay más acciones para deshacer.", "warning");
        }
      });
    if (DOMElements.menuRedoBtn)
      DOMElements.menuRedoBtn.addEventListener("click", () => {
        if (historyIndex < history.length - 1) {
          historyIndex++;
          restoreState(history[historyIndex]);
          showMessage("Acción rehecha.", "success");
        } else {
          showMessage("No hay más acciones para rehacer.", "warning");
        }
      });

    // Transformaciones
    if (DOMElements.menuRotateLeftBtn)
      DOMElements.menuRotateLeftBtn.addEventListener("click", () =>
        applyTransformation("rotateLeft")
      );
    if (DOMElements.menuRotateRightBtn)
      DOMElements.menuRotateRightBtn.addEventListener("click", () =>
        applyTransformation("rotateRight")
      );
    if (DOMElements.menuFlipHorizontalBtn)
      DOMElements.menuFlipHorizontalBtn.addEventListener("click", () =>
        applyTransformation("flipHorizontal")
      );
    if (DOMElements.menuFlipVerticalBtn)
      DOMElements.menuFlipVerticalBtn.addEventListener("click", () =>
        applyTransformation("flipVertical")
      );
    if (DOMElements.menuResizeBtn)
      DOMElements.menuResizeBtn.addEventListener("click", () => {
        if (!originalImage) {
          showMessage("Carga una imagen para cambiar su tamaño.", "warning");
          return;
        }
        if (DOMElements.resizeOptions)
          DOMElements.resizeOptions.classList.remove("hidden");
        // Inicializar los inputs de redimensionamiento con el tamaño actual
        if (currentImageBuffer) {
          // Asegurarse que el buffer existe
          DOMElements.resizeWidthInput.value = currentImageBuffer.width;
          DOMElements.resizeHeightInput.value = currentImageBuffer.height;
        }
        showMessage("Cambiar tamaño: Ingresa nuevas dimensiones.", "info");
      });
    if (DOMElements.resizeBtn)
      DOMElements.resizeBtn.addEventListener("click", applyResize);

    if (DOMElements.menuCropTool)
      DOMElements.menuCropTool.addEventListener("click", () =>
        setupToolButtons(DOMElements.menuCropTool)
      );
    if (DOMElements.applyCropBtn)
      DOMElements.applyCropBtn.addEventListener("click", applyCrop);
    if (DOMElements.cancelCropBtn)
      DOMElements.cancelCropBtn.addEventListener("click", cancelCrop);

    // Link menu filters to applyFilter
    if (DOMElements.menuGrayscaleBtn)
      DOMElements.menuGrayscaleBtn.addEventListener("click", () =>
        applyFilter("grayscale")
      );
    if (DOMElements.menuSepiaBtn)
      DOMElements.menuSepiaBtn.addEventListener("click", () =>
        applyFilter("sepia")
      );
    if (DOMElements.menuInvertBtn)
      DOMElements.menuInvertBtn.addEventListener("click", () =>
        applyFilter("invert")
      );
    if (DOMElements.menuBlurBtn)
      DOMElements.menuBlurBtn.addEventListener("click", () =>
        applyFilter("blur")
      );
    if (DOMElements.menuSharpenBtn)
      DOMElements.menuSharpenBtn.addEventListener("click", () =>
        applyFilter("sharpen")
      );
    if (DOMElements.menuPixelateBtn)
      DOMElements.menuPixelateBtn.addEventListener("click", () =>
        applyFilter("pixelate")
      );
    if (DOMElements.menuVignetteBtn)
      DOMElements.menuVignetteBtn.addEventListener("click", () =>
        applyFilter("vignette")
      );
    if (DOMElements.menuNoiseBtn)
      DOMElements.menuNoiseBtn.addEventListener("click", () =>
        applyFilter("noise")
      );
    if (DOMElements.menuEmbossBtn)
      DOMElements.menuEmbossBtn.addEventListener("click", () =>
        applyFilter("emboss")
      );
    if (DOMElements.menuWarmFilterBtn)
      DOMElements.menuWarmFilterBtn.addEventListener("click", () =>
        applyFilter("warm")
      );
    if (DOMElements.menuCoolFilterBtn)
      DOMElements.menuCoolFilterBtn.addEventListener("click", () =>
        applyFilter("cool")
      );

    // Link menu adjustments to open sidebar and (potentially) show options
    if (DOMElements.menuBrightnessContrastBtn)
      DOMElements.menuBrightnessContrastBtn.addEventListener("click", () => {
        showMessage(
          "Ajustes de Brillo/Contraste controlados por sliders en el panel izquierdo.",
          "info"
        );
      });
    if (DOMElements.menuSaturationHueBtn)
      DOMElements.menuSaturationHueBtn.addEventListener("click", () => {
        showMessage(
          "Ajustes de Saturación/Tonalidad controlados por sliders en el panel izquierdo.",
          "info"
        );
      });
    if (DOMElements.menuExposureGammaBtn)
      DOMElements.menuExposureGammaBtn.addEventListener("click", () => {
        showMessage(
          "Ajustes de Exposición/Gamma controlados por sliders en el panel izquierdo.",
          "info"
        );
      });

    // Placeholder functions for menu items
    const placeholderMenuItems = [
      DOMElements.menuDistortTool,
      DOMElements.menuLevelsBtn,
      DOMElements.menuColorBalanceBtn,
      DOMElements.menuVibranceBtn,
      DOMElements.menuPosterizeBtn,
      DOMElements.menuDuotoneBtn,
      DOMElements.menuBwControlBtn,
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
            `${item.textContent.trim()}: Funcionalidad no implementada. (Placeholder)`,
            "warning"
          )
        );
      }
    });

    // Listeners for sidebar tool properties
    if (DOMElements.boldTextBtn)
      DOMElements.boldTextBtn.addEventListener("click", () => {
        isBold = !isBold;
        DOMElements.boldTextBtn.classList.toggle("active", isBold);
      });
    if (DOMElements.italicTextBtn)
      DOMElements.italicTextBtn.addEventListener("click", () => {
        isItalic = !isItalic;
        DOMElements.italicTextBtn.classList.toggle("active", isItalic);
      });
    if (DOMElements.fontFamilySelect)
      DOMElements.fontFamilySelect.addEventListener("change", (e) => {
        currentFontFamily = e.target.value;
      });
    if (DOMElements.fontSizeRange && DOMElements.fontSizeValue)
      DOMElements.fontSizeRange.addEventListener("input", (e) => {
        DOMElements.fontSizeValue.textContent = `${e.target.value}px`;
      });

    if (DOMElements.colorPicker && editorCtx)
      DOMElements.colorPicker.addEventListener("input", (e) => {
        editorCtx.strokeStyle = e.target.value;
        editorCtx.fillStyle = e.target.value;
        showMessage(`Color cambiado a ${e.target.value}.`, "success");
      });
    if (DOMElements.lineWidthRange && editorCtx && DOMElements.lineWidthValue)
      DOMElements.lineWidthRange.addEventListener("input", (e) => {
        editorCtx.lineWidth = e.target.value;
        DOMElements.lineWidthValue.textContent = `${e.target.value}px`;
      });
    if (DOMElements.brushHardnessRange && DOMElements.brushHardnessValue)
      DOMElements.brushHardnessRange.addEventListener("input", (e) => {
        DOMElements.brushHardnessValue.textContent = `${e.target.value}%`;
      });
    if (
      DOMElements.globalOpacityRange &&
      editorCtx &&
      DOMElements.globalOpacityValue
    )
      DOMElements.globalOpacityRange.addEventListener("input", (e) => {
        editorCtx.globalAlpha = parseInt(e.target.value) / 100;
        DOMElements.globalOpacityValue.textContent = `${e.target.value}%`;
      });

    // Sliders de ajuste (Brillo, Contraste, etc.)
    if (DOMElements.brightnessRange)
      DOMElements.brightnessRange.addEventListener(
        "input",
        debouncedApplyAdjustments
      );
    if (DOMElements.contrastRange)
      DOMElements.contrastRange.addEventListener(
        "input",
        debouncedApplyAdjustments
      );
    if (DOMElements.saturationRange)
      DOMElements.saturationRange.addEventListener(
        "input",
        debouncedApplyAdjustments
      );
    if (DOMElements.hueRotateRange)
      DOMElements.hueRotateRange.addEventListener(
        "input",
        debouncedApplyAdjustments
      );
    if (DOMElements.exposureRange)
      DOMElements.exposureRange.addEventListener(
        "input",
        debouncedApplyAdjustments
      );
    if (DOMElements.gammaRange)
      DOMElements.gammaRange.addEventListener(
        "input",
        debouncedApplyAdjustments
      );

    // Sliders de filtros de intensidad (Blur, Sharpen)
    if (DOMElements.blurIntensityRange)
      DOMElements.blurIntensityRange.addEventListener("input", (e) => {
        DOMElements.blurIntensityValue.textContent = e.target.value.toString();
        // Cuando cambias blur/sharpen, necesitas volver a aplicar el filtro
        if (activeTool === "blur")
          applyFilter("blur"); // Asumimos que activeTool ya está configurado
        else if (activeTool === "sharpen") applyFilter("sharpen");
      });
    if (DOMElements.sharpenIntensityRange)
      DOMElements.sharpenIntensityRange.addEventListener("input", (e) => {
        DOMElements.sharpenIntensityValue.textContent =
          e.target.value.toString();
        if (activeTool === "sharpen")
          applyFilter("sharpen"); // Asumimos que activeTool ya está configurado
        else if (activeTool === "blur") applyFilter("blur");
      });

    // Bind global action buttons from sidebar
    if (DOMElements.undoBtn)
      DOMElements.undoBtn.addEventListener("click", () => {
        if (DOMElements.menuUndoBtn) DOMElements.menuUndoBtn.click();
      });
    if (DOMElements.redoBtn)
      DOMElements.redoBtn.addEventListener("click", () => {
        if (DOMElements.menuRedoBtn) DOMElements.menuRedoBtn.click();
      });
    if (DOMElements.watchAdButton)
      DOMElements.watchAdButton.addEventListener(
        "click",
        watchAdForGenerations
      );

    // Listeners for modals
    if (DOMElements.acceptCookiesButton)
      DOMElements.acceptCookiesButton.addEventListener("click", acceptCookies);
    if (DOMElements.subscribeButton)
      DOMElements.subscribeButton.addEventListener("click", handleSubscription);
    if (DOMElements.noThanksButton)
      DOMElements.noThanksButton.addEventListener("click", dismissSubscription);

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

    // Navigation responsive
    if (DOMElements.menuToggle && DOMElements.navLinksContainer) {
      DOMElements.menuToggle.addEventListener("click", () => {
        DOMElements.navLinksContainer.classList.toggle("active");
        DOMElements.menuToggle.querySelector("i").classList.toggle("fa-bars");
        DOMElements.menuToggle.querySelector("i").classList.toggle("fa-times");
      });
      // Click fuera para cerrar el menú responsive
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
      // Cierra el menú responsive al hacer clic en un enlace
      DOMElements.navLinksContainer.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          if (window.innerWidth <= 768) {
            // Only if is mobile view
            DOMElements.navLinksContainer.classList.remove("active");
            DOMElements.menuToggle
              .querySelector("i")
              .classList.remove("fa-times");
            DOMElements.menuToggle.querySelector("i").classList.add("fa-bars");
          }
        });
      });
    }

    // Inicializar estado de la barra de navegación activa
    updateActiveClass();
  });

  // Reajustar canvas al cambiar el tamaño de la ventana
  window.addEventListener("resize", () => {
    if (originalImage) {
      if (history.length > 0 && historyIndex !== -1) {
        restoreState(history[historyIndex]);
      }
    }
    // Re-draw crop overlay if active
    if (
      isCropping &&
      DOMElements.cropOverlay &&
      !DOMElements.cropOverlay.classList.contains("hidden")
    ) {
      drawCropOverlay();
    }
  });
})(document); // Cierre de la IIFE y se le pasa 'document' como argumento
