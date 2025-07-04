// ia-img/js/config.js

export const CONFIG = {
  API_BASE_URL: "https://image.pollinations.ai/prompt/",
  MAX_RETRIES: 2,
  RETRY_DELAY_MS: 1500,
  TIMEOUT_MS: 30000, // Aumentado el timeout para generación de imágenes (30 segundos)
  MAX_GALLERY_IMAGES: 12,
  PROMPT_SUGGESTION_DELAY_SECONDS: 10,
  OBELISAI_LOGO_URL: "../img/marca_de_agua.webp",
  IMAGE_CROP_BOTTOM_PX: 60,
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
  GALLERY_MAX_WIDTH: 600, // Ancho máximo para optimización de galería
  GALLERY_JPEG_QUALITY: 0.85,
  // Dimensiones predeterminadas para generación de imágenes
  DEFAULT_IMAGE_WIDTH: 768,
  DEFAULT_IMAGE_HEIGHT: 768,
};
