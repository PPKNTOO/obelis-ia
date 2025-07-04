// ia-text/js/historyManager.js

import { CONFIG } from "./config.js";
import { DOMElements, showCustomMessage } from "../../js/global.js";
import { formatGeneratedText } from "./textFormatter.js";
import { stopAudio } from "./audioPlayer.js";

export const saveGeneratedContentToHistory = (prompt, type, text, tone) => {
  let history =
    JSON.parse(localStorage.getItem("generatedContentHistory")) || [];
  const timestamp = new Date().toLocaleString();
  const newItem = { prompt, type, text, tone, timestamp };

  history.unshift(newItem);
  if (history.length > CONFIG.MAX_HISTORY_ITEMS) {
    history = history.slice(0, CONFIG.MAX_HISTORY_ITEMS);
  }
  localStorage.setItem("generatedContentHistory", JSON.stringify(history));
  renderContentHistory();
};

export const loadContentHistory = () => {
  return JSON.parse(localStorage.getItem("generatedContentHistory")) || [];
};

export const renderContentHistory = () => {
  const history = loadContentHistory();
  if (!DOMElements.contentHistoryContainer || !DOMElements.clearHistoryButton)
    return;

  DOMElements.contentHistoryContainer.innerHTML = "";

  if (history.length === 0) {
    DOMElements.contentHistoryContainer.innerHTML =
      '<p class="text-gray-500 text-center">No hay contenido en el historial.</p>';
    DOMElements.clearHistoryButton.classList.add(
      "opacity-50",
      "cursor-not-allowed"
    );
    DOMElements.clearHistoryButton.disabled = true;
    return;
  }

  history.forEach((item, index) => {
    const historyItemDiv = document.createElement("div");
    historyItemDiv.classList.add("history-item");

    const iconClass = CONFIG.CONTENT_TYPE_ICONS[item.type] || "fas fa-file-alt";
    const iconSpan = `<i class="${iconClass} text-cyan-400 mr-2"></i>`;

    const truncatedPrompt =
      item.prompt.substring(0, 50) + (item.prompt.length > 50 ? "..." : "");
    const itemText = document.createElement("span");
    itemText.classList.add("history-item-text");
    itemText.innerHTML = `${iconSpan} ${
      item.type.charAt(0).toUpperCase() + item.type.slice(1)
    }: "${truncatedPrompt}"`;
    itemText.title = `Generado el ${item.timestamp}\nTipo: ${
      item.type
    }\nDescripción: ${item.prompt}\nTono: ${
      item.tone || "Neutro"
    }\n\nHaz clic para ver el contenido.`;

    const regenerateButton = document.createElement("button");
    regenerateButton.classList.add(
      "bg-gray-700",
      "hover:bg-gray-600",
      "text-white",
      "p-1",
      "rounded-full",
      "transition-colors",
      "duration-200",
      "shadow-sm",
      "ml-2"
    );
    regenerateButton.innerHTML = '<i class="fas fa-sync-alt text-sm"></i>';
    regenerateButton.title = "Cargar y Regenerar";
    regenerateButton.addEventListener("click", (e) => {
      e.stopPropagation();
      if (DOMElements.promptInput) DOMElements.promptInput.value = item.prompt;
      const radio = DOMElements.contentTypeOptions
        ? document.querySelector(
            `input[name="contentType"][value="${item.type}"]`
          )
        : null;
      if (radio) {
        radio.checked = true;
        if (DOMElements.promptInput)
          DOMElements.promptInput.placeholder =
            CONFIG.PLACEHOLDERS[item.type] || CONFIG.PLACEHOLDERS.story;
      }
      if (DOMElements.toneSelect)
        DOMElements.toneSelect.value = item.tone || "";
      showCustomMessage(
        "Prompt e historial cargados para regenerar.",
        "info",
        2000
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    historyItemDiv.appendChild(itemText);
    historyItemDiv.appendChild(regenerateButton);

    DOMElements.contentHistoryContainer.appendChild(historyItemDiv);

    itemText.addEventListener("click", () => {
      if (DOMElements.generatedTextDiv)
        DOMElements.generatedTextDiv.innerHTML = formatGeneratedText(item.text);
      if (DOMElements.contentModal)
        DOMElements.contentModal.classList.add("show");
      stopAudio();
    });
  });
  DOMElements.clearHistoryButton.classList.remove(
    "opacity-50",
    "cursor-not-allowed"
  );
  DOMElements.clearHistoryButton.disabled = false;
};

export const clearContentHistory = () => {
  localStorage.removeItem("generatedContentHistory");
  renderContentHistory();
  showCustomMessage("Historial de contenido limpiado.", "success", 2000);
};
