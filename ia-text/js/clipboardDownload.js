// ia-text/js/clipboardDownload.js

import { DOMElements, showCustomMessage } from "../../js/global.js";

export const copyTextToClipboard = () => {
  if (!DOMElements.generatedTextDiv) {
    showCustomMessage("No hay contenido para copiar.", "info", 2000);
    return;
  }
  const textToCopy = DOMElements.generatedTextDiv.textContent;
  if (!textToCopy) {
    showCustomMessage("No hay contenido para copiar.", "info", 2000);
    return;
  }
  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      showCustomMessage("¡Copiado al portapapeles!", "success", 2000);
    })
    .catch((err) => {
      console.error("Error al intentar copiar al portapapeles:", err);
      showCustomMessage(
        "Error al copiar. Tu navegador podría no soportar esta función o hay restricciones de seguridad.",
        "error",
        3000
      );
    });
};

export const downloadPdf = () => {
  if (!DOMElements.generatedTextDiv) return;
  const text = DOMElements.generatedTextDiv.textContent;
  if (!text) {
    showCustomMessage(
      "No hay contenido para descargar como PDF.",
      "info",
      3000
    );
    return;
  }
  if (typeof window.jspdf === "undefined") {
    showCustomMessage(
      "La librería de PDF (jspdf) no está cargada. Intenta recargar la página.",
      "error",
      5000
    );
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const margin = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const lineHeight = 7;
  let y = margin;

  const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);

  for (let i = 0; i < lines.length; i++) {
    if (y + lineHeight > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(lines[i], margin, y);
    y += lineHeight;
  }

  doc.save("contenido_generado.pdf");
};
