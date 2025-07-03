// convert-img/js/downloadManager.js

import { convertedBlob, setConvertedBlob } from "./state.js";
import { DOMElements, showCustomMessage } from "../../js/global.js";

export function downloadImageFromBlob() {
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
  URL.revokeObjectURL(url); // Libera el objeto URL

  // Una vez descargado, opcionalmente puedes resetear el blob y deshabilitar el botón
  setConvertedBlob(null);
  if (DOMElements.downloadBtn) {
    DOMElements.downloadBtn.disabled = true;
    DOMElements.downloadBtn.classList.add("disabled-btn");
  }
}
