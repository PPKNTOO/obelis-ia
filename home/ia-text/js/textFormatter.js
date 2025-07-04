// ia-text/js/textFormatter.js

export const formatGeneratedText = (rawText) => {
  let formattedText = rawText;

  // Encabezados (h2, h3, etc.) - Asegurarse de que no haya # sobrantes si ya se procesaron
  formattedText = formattedText.replace(/^### (.*$)/gm, "<h3>$1</h3>");
  formattedText = formattedText.replace(/^## (.*$)/gm, "<h2>$1</h2>");
  formattedText = formattedText.replace(/^# (.*$)/gm, "<h2>$1</h2>"); // Tratar # como h2

  // Negritas y cursivas
  formattedText = formattedText.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );
  formattedText = formattedText.replace(/\*(.*?)\*/g, "<em>$1</em>");
  formattedText = formattedText.replace(/__(.*?)__/g, "<strong>$1</strong>");
  formattedText = formattedText.replace(/_(.*?)_/g, "<em>$1</em>");

  // Listas (antes de los párrafos para evitar que <li> se conviertan en <p> dentro)
  // Listas desordenadas
  formattedText = formattedText.replace(/^[*-] (.*)/gm, "<li>$1</li>");
  formattedText = formattedText.replace(
    /(<li>.*<\/li>(\n<li>.*<\/li>)*)/g,
    "<ul>\n$1\n</ul>"
  );

  // Listas ordenadas
  formattedText = formattedText.replace(/^(\d+)\. (.*)/gm, "<li>$2</li>");
  formattedText = formattedText.replace(
    /(<li>.*<\/li>(\n<li>.*<\/li>)*)/g,
    "<ol>\n$1\n</ol>"
  );

  // Párrafos (solo si la línea no es ya un bloque HTML)
  formattedText = formattedText
    .split("\n")
    .map((line) => {
      // Si la línea ya empieza con una etiqueta de bloque (h, ul, ol, li, p, table, div, pre, blockquote, etc.)
      // o está vacía, la devolvemos tal cual.
      if (
        line.trim() === "" ||
        /^<(h[1-6]|ul|ol|li|p|table|div|pre|blockquote|hr|img|form|button)/.test(
          line.trim()
        )
      ) {
        return line;
      }
      return `<p>${line.trim()}</p>`;
    })
    .join("");

  // Eliminar párrafos vacíos
  formattedText = formattedText.replace(/<p>\s*<\/p>/g, "");

  // Eliminar cualquier marcador Markdown que pueda haber quedado
  formattedText = formattedText.replace(/[#*_~`]/g, "");

  // Convertir saltos de línea dobles a párrafos si no están ya en una estructura
  formattedText = formattedText.replace(/\n\n/g, "</p><p>");
  formattedText = formattedText.replace(/\n/g, "<br>"); // Reemplazar saltos de línea simples por <br>

  return formattedText;
};
