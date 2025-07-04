// js/components/carousel.js

/**
 * La función principal que busca un carrusel en la página y lo inicializa.
 * Si no encuentra el elemento #heroCarousel, no hace nada.
 */
export function initializeCarousel() {
  const carousel = document.querySelector("#heroCarousel");
  if (!carousel) {
    return; // No hay carrusel en esta página, salimos de la función.
  }

  // Búsqueda de elementos internos del carrusel
  const slidesContainer = carousel.querySelector("#carouselSlides");
  const slides = carousel.querySelectorAll(".carousel-slide");
  const prevButton = carousel.querySelector("#prevSlide");
  const nextButton = carousel.querySelector("#nextSlide");
  const indicatorsContainer = carousel.querySelector("#carouselIndicators");

  // Verificación de que todos los componentes necesarios existen
  if (
    !slidesContainer ||
    slides.length === 0 ||
    !prevButton ||
    !nextButton ||
    !indicatorsContainer
  ) {
    console.warn("Faltan elementos HTML para inicializar el carrusel.");
    return;
  }

  let currentIndex = 0;
  const totalSlides = slides.length;
  let slideInterval;

  // --- Crear los puntos indicadores dinámicamente ---
  indicatorsContainer.innerHTML = ""; // Limpiar indicadores previos
  for (let i = 0; i < totalSlides; i++) {
    const indicator = document.createElement("div");
    indicator.classList.add("carousel-indicator");
    indicator.dataset.index = i;
    indicatorsContainer.appendChild(indicator);
  }
  const indicators = indicatorsContainer.querySelectorAll(
    ".carousel-indicator"
  );

  // --- Función principal para cambiar de diapositiva ---
  const goToSlide = (index) => {
    // Lógica para que el carrusel sea cíclico
    if (index >= totalSlides) {
      currentIndex = 0;
    } else if (index < 0) {
      currentIndex = totalSlides - 1;
    } else {
      currentIndex = index;
    }

    // Mueve el contenedor de diapositivas
    slidesContainer.style.transform = `translateX(-${currentIndex * 100}%)`;

    // Actualiza la clase 'active' en los indicadores
    indicators.forEach((indicator, i) => {
      indicator.classList.toggle("active", i === currentIndex);
    });
  };

  // --- Funciones para el carrusel automático ---
  const startCarousel = () => {
    stopCarousel(); // Asegurarse de que no haya intervalos duplicados
    slideInterval = setInterval(() => {
      goToSlide(currentIndex + 1);
    }, 5000); // Cambia cada 5 segundos
  };

  const stopCarousel = () => {
    clearInterval(slideInterval);
  };

  // --- Asignar los eventos a los botones y los indicadores ---
  nextButton.addEventListener("click", () => {
    goToSlide(currentIndex + 1);
    startCarousel(); // Reiniciar el intervalo al navegar manualmente
  });

  prevButton.addEventListener("click", () => {
    goToSlide(currentIndex - 1);
    startCarousel(); // Reiniciar el intervalo
  });

  indicators.forEach((indicator) => {
    indicator.addEventListener("click", (e) => {
      const newIndex = parseInt(e.target.dataset.index);
      goToSlide(newIndex);
      startCarousel(); // Reiniciar el intervalo
    });
  });

  // Iniciar el carrusel al cargar la página
  goToSlide(0);
  startCarousel();
}
