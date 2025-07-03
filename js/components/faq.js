// js/components/faq.js

/**
 * Maneja la lógica para abrir y cerrar una respuesta del FAQ.
 * @param {Event} event - El evento de clic que dispara la función.
 */
function toggleFaqAnswer(event) {
  const question = event.currentTarget;
  const answer = question.nextElementSibling;
  const arrow = question.querySelector(".faq-arrow");

  if (!answer) return;

  const isOpen = answer.classList.contains("open");

  // Opcional: Cerrar todos los demás acordeones abiertos
  const allAnswers = question
    .closest(".faq-container")
    .querySelectorAll(".faq-answer");
  allAnswers.forEach((otherAnswer) => {
    otherAnswer.classList.remove("open");
    otherAnswer.style.maxHeight = null;
    const otherArrow =
      otherAnswer.previousElementSibling.querySelector(".faq-arrow");
    if (otherArrow) otherArrow.classList.remove("rotated");
  });

  // Abrir o cerrar el actual
  if (!isOpen) {
    answer.classList.add("open");
    arrow.classList.add("rotated");
    // Se establece el max-height para la animación de despliegue
    answer.style.maxHeight = answer.scrollHeight + "px";
  }
}

/**
 * Busca todas las preguntas del FAQ en la página y les asigna el evento de clic.
 */
export function initializeFAQ() {
  const faqQuestions = document.querySelectorAll(".faq-question");
  if (faqQuestions.length === 0) {
    return; // No hace nada si no hay FAQs en la página
  }

  faqQuestions.forEach((question) => {
    question.addEventListener("click", toggleFaqAnswer);
    // Asegurarse de que las respuestas estén cerradas al inicio
    const answer = question.nextElementSibling;
    if (answer) {
      answer.classList.remove("open");
      answer.style.maxHeight = null;
    }
  });
}
