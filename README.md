ObelisIA/
├── .git/                     # Carpeta de control de versiones de Git
├── .github/                  # (Opcional) Configuraciones de GitHub Actions, etc.
├── .gitignore                # Archivo para Git: ignora 'node_modules/', '.env', '.vercel/'
├── package.json              # Configuración del proyecto Node.js y lista de dependencias
├── package-lock.json         # Bloqueo de versiones de dependencias (generado por npm)
├── node_modules/             # Dependencias de Node.js (ignorada por Git)
├── .env                      # Variables de entorno LOCALES (NO se sube a GitHub para producción)
├── api/                      # Carpeta para funciones Serverless (backend en Vercel)
│   └── gemini.js             # Función proxy para la API de IA (oculta la API Key)
├── img/                      # Recursos de imagen compartidos en todo el sitio
│   └── Pocoyo.gif            # GIF del cargador de Pocoyó
│   └── marca_de_agua.webp    # Imagen de marca de agua personalizada
├── css/                      # Hojas de estilo globales y modulares
│   ├── main.css              # Archivo principal que importa todos los módulos CSS
│   └── styles/               # Carpeta para los módulos CSS
│       ├── _base.css         # Estilos base de HTML y globales
│       ├── _global-ad-banner.css # Estilos para banners de anuncios globales
│       ├── _global-modals.css # Estilos para modales globales (suscripción, cookies, mensajes, carga)
│       ├── _navbar.css       # Estilos para la barra de navegación
│       ├── _editor.css       # Estilos específicos del editor (barra de menú, sidebars, canvas)
│       ├── _about-section.css # Estilos para la sección "Acerca de"
│       ├── _faq-section.css  # Estilos para la sección de preguntas frecuentes
│       ├── _buttons.css      # Estilos para botones globales (ej. .btn-primary)
│       └── _forms.css        # Estilos para elementos de formulario (inputs, textareas, selects, checkboxes, radios)
├── index.html                # Página principal del sitio web (landing page)
├── convert-img/              # Módulo: Herramienta de conversión de imágenes
│   ├── index.html
│   ├── js/
│   │   └── script.js         # (Pendiente de modularización si es necesario)
│   └── css/
│       └── style.css
├── edit-img/                 # Módulo: Herramienta de edición de imágenes
│   ├── index.html            # Página del editor de imágenes
│   ├── js/                   # Carpeta para los scripts del editor (modularizados)
│   │   ├── main.js             # Punto de entrada principal del editor
│   │   ├── ui.js               # Lógica de la interfaz de usuario (mensajes, modales, etc.)
│   │   ├── canvas.js           # Funciones de manipulación del elemento Canvas
│   │   ├── history.js          # Lógica para Deshacer/Rehacer
│   │   ├── tools/              # Lógicas individuales para cada herramienta
│   │   │   ├── toolManager.js  # Gestor de activación de herramientas
│   │   │   ├── brushTool.js    # Lógica del Pincel
│   │   │   ├── eraserTool.js   # Lógica del Borrador
│   │   │   ├── textTool.js     # Lógica de la herramienta de Texto
│   │   │   ├── eyedropperTool.js # Lógica del Cuentagotas
│   │   │   └── cropTool.js     # Lógica de la herramienta de Recorte
│   │   ├── filters/            # Lógicas individuales para cada filtro
│   │   │   ├── filterManager.js # Gestor de aplicación de filtros
│   │   │   ├── grayscaleFilter.js
│   │   │   ├── sepiaFilter.js
│   │   │   ├── invertFilter.js
│   │   │   ├── blurFilter.js
│   │   │   └── sharpenFilter.js
│   │   ├── adjustments/        # Lógicas individuales para cada ajuste de imagen
│   │   │   └── colorAdjustments.js # Brillo, Contraste, Saturación, etc.
│   │   └── utils/
│   │       └── constants.js    # Constantes y configuraciones específicas del editor
│   └── css/
│       └── style.css           # Estilos específicos del editor
├── ia-img/                   # Módulo: Generador de imágenes IA
│   ├── index.html            # La página del generador de imágenes
│   ├── js/                   # Carpeta para los scripts del generador (modularizados)
│   │   ├── main.js             # Punto de entrada principal del módulo ia-img
│   │   ├── config.js           # Constantes de configuración
│   │   ├── state.js            # Variables de estado global del módulo
│   │   ├── imageProcessor.js   # Funciones para procesar imágenes (recorte, marca de agua, optimización)
│   │   ├── galleryManager.js   # Funciones relacionadas con la galería (guardar, cargar, renderizar, lightbox)
│   │   ├── aiService.js        # Funciones para interactuar con la API de IA (generar/mejorar prompt, generar imagen)
│   │   ├── editorManager.js    # Funciones para la gestión del editor de imágenes (usadas por galleryManager)
│   │   └── uiUpdater.js        # Funciones para actualizar la interfaz de usuario
│   └── css/
│       └── style.css           # Estilos específicos del generador de imágenes
└── ia-text/                  # Módulo: Generador de texto IA
    ├── index.html
    ├── js/                   # Carpeta para los scripts del generador de texto (modularizados)
    │   ├── main.js             # Punto de entrada principal del módulo ia-text
    │   ├── config.js           # Constantes de configuración
    │   ├── state.js            # Variables de estado global del módulo
    │   ├── storage.js          # Funciones para guardar/cargar preferencias y estado
    │   ├── voiceManager.js     # Funciones para la carga y gestión de voces
    │   ├── limitManager.js     # Lógica para el límite de generaciones y anuncios
    │   ├── textFormatter.js    # Función para formatear Markdown a HTML
    │   ├── aiService.js        # Lógica principal de generación de contenido (interacción con la API de IA)
    │   ├── audioPlayer.js      # Funciones de reproducción de audio (TTS)
    │   ├── clipboardDownload.js # Funciones de copiar al portapapeles y descargar PDF
    │   └── historyManager.js   # Funciones para la gestión del historial de contenido
    └── css/
        └── style.css           # Estilos específicos del generador de texto
└── (otras_carpetas_o_archivos_en_la_raiz)/


-----------------------------------------------------------------------------------------------


🚀 Configuración y Despliegue
Para poner en marcha el proyecto, tanto localmente como en producción, sigue estos pasos.

1. Pre-requisitos
Asegúrate de tener instalado:

* Node.js y npm (se recomienda usar NVM para gestionar las versiones).
* Git
* Una cuenta en Vercel (para el despliegue y las Serverless Functions).
* Una clave de API de Google Gemini (obtenida de Google AI Studio).

2. Configuración Inicial del Proyecto (en tu máquina local)
Clona el Repositorio:

```bash
git clone [https://github.com/tu_usuario/tu_repositorio.git](https://github.com/tu_usuario/tu_repositorio.git)
cd tu_repositorio_raiz
