ObelisIA/
├── .git/                     # Carpeta de control de versiones de Git
├── .github/                  # (Opcional) Configuraciones de GitHub Actions, etc.
├── .gitignore                # Archivo para Git: ignora 'node_modules/', '.env', '.vercel/'
├── package.json              # Configuración del proyecto Node.js y lista de dependencias
├── package-lock.json         # Bloqueo de versiones de dependencias (generado por npm)
├── node_modules/             # Dependencias de Node.js (ignorada por Git)
├── .env                      # Variables de entorno LOCALES (NO se sube a GitHub para producción)
├── api/                      # Carpeta para funciones Serverless (backend en Vercel)
│   └── gemini.js     # Función proxy para la API de IA (oculta la API Key)
├── img/                      # Recursos de imagen compartidos en todo el sitio
│   └── Pocoyo.gif            # GIF del cargador de Pocoyó
│   └── marca_de_agua.webp    # Imagen de marca de agua personalizada
├── css/                      # Hojas de estilo globales (si existieran, ej. para index.html de la raíz)
│   └── style.css
├── index.html                # Página principal del sitio web (landing page)
├── convert-img/              # Módulo: Herramienta de conversión de imágenes
│   ├── index.html
│   ├── js/
│   │   └── script.js
│   └── css/
│       └── style.css
├── edit-img/                 # Módulo: Herramienta de edición de imágenes
│   ├── index.html
│   ├── js/
│   │   └── script.js
│   └── css/
│       └── style.css
├── ia-img/                   # Módulo: Generador de imágenes IA
│   ├── index.html            # La página del generador de imágenes
│   ├── js/
│   │   └── script.js         # Lógica del frontend para el generador de imágenes
│   └── css/
│       └── style.css
└── ia-text/                  # Módulo: Generador de texto IA
    ├── index.html
    ├── js/
    │   └── script.js
    └── css/
        └── style.css
└── (otras_carpetas_o_archivos_en_la_raiz)/




-----------------------------------------------------------------------------------------------



🚀 Configuración y Despliegue
Para poner en marcha el proyecto, tanto localmente como en producción, sigue estos pasos.

1. Pre-requisitos
Asegúrate de tener instalado:

Node.js y npm (se recomienda usar NVM para gestionar las versiones).
Git
Una cuenta en Vercel (para el despliegue y las Serverless Functions).
Una clave de API de Google Gemini (obtenida de Google AI Studio).
2. Configuración Inicial del Proyecto (en tu máquina local)
Clona el Repositorio:

Bash

git clone https://github.com/tu_usuario/tu_repositorio.git
cd tu_repositorio_raiz
Inicializa npm en la RAÍZ del proyecto:

Navega a la raíz de tu proyecto en la terminal.
Bash

  npm init -y
Esto creará el archivo package.json en la raíz.
Instala las Dependencias:

En la raíz de tu proyecto, instala node-fetch. Esta dependencia es para tu Serverless Function.
Bash

  npm install node-fetch
Esto creará la carpeta node_modules/ en la raíz.
Crea el archivo .gitignore:

En la raíz de tu proyecto, crea un archivo llamado .gitignore (si no existe ya).
Abre este archivo y asegúrate de que contenga:
Fragmento de código

# Dependencias de Node.js
node_modules/

# Variables de entorno local
.env

# Archivos de configuración y logs de Vercel (generados localmente)
.vercel/
Guarda y cierra el archivo.
Crea tu Serverless Function (api/generate-image.js):

En la raíz de tu proyecto, crea la carpeta api/.
Dentro de api/, crea el archivo generate-image.js y pega el siguiente código:
JavaScript

// tu_proyecto_raiz/api/generate-image.js

// Esta función se ejecutará en el servidor de Vercel (Serverless Function)
// No necesita importar node-fetch en Vercel, ya que `fetch` es globalmente disponible.

export default async function (req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Accede a la clave de API desde las variables de entorno de Vercel
    // ¡CONFIGURA GEMINI_API_KEY en las "Environment Variables" de tu proyecto en Vercel!
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

    if (!GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY no está configurada en las variables de entorno de Vercel.");
        return res.status(500).json({ error: "Server API Key not configured." });
    }

    // Recibe los datos del frontend (prompt y chatHistory)
    const { prompt, chatHistory } = req.body; 

    // Construye la URL de la API de Google Gemini con la clave de API
    const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    try {
        // Realiza la solicitud a la API de Google Gemini
        const response = await fetch(googleApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: chatHistory }) // Reenvía el historial de chat a la API de Gemini
        });

        // Reenvía la respuesta (y el estado HTTP) de la API de Google al frontend
        const data = await response.json();
        res.status(response.status).json(data);

    } catch (error) {
        console.error("Error calling Google Gemini API from Vercel Function:", error);
        res.status(500).json({ error: "Failed to process AI request through proxy." });
    }
}
Asegura las Rutas en tus Archivos JavaScript del Frontend:

Para cada script.js en tus módulos (ej. ia-img/js/script.js, ia-text/js/script.js, convert-img/js/script.js, edit-img/js/script.js):
Asegúrate de que las llamadas a la Serverless Function utilicen la ruta absoluta desde la raíz del dominio:
JavaScript

// tu_proyecto_raiz/ia-img/js/script.js (y los demás scripts de módulos)

// ... (dentro de generatePromptSuggestion, improvePrompt, o donde hagas la llamada a la API) ...

const response = await fetch('/api/generate-image', { // <-- ¡Siempre con /api/...!
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        prompt: promptForLLM, // O el prompt específico de tu función
        chatHistory: chatHistory 
    }) 
});
// ...
Asegúrate de que las rutas a recursos compartidos desde tus módulos anidados sean correctas.
Por ejemplo, en ia-img/js/script.js, si Pocoyo.gif está en tu_proyecto_raiz/img/Pocoyo.gif, entonces la constante en CONFIG debe ser:
JavaScript

// Dentro de js/script.js
const CONFIG = {
    // ...
    OBELISAI_LOGO_URL: '../img/marca_de_agua.webp', // Asume que img/ está en la raíz, un nivel arriba de ia-img/
    // ...
};
Y en el HTML para Pocoyo: <img id="pocoyoGif" src="../img/Pocoyo.gif" ...>
3. Prueba Localmente (en tu máquina MX Linux)
Crea el archivo .env para pruebas locales:

En la raíz de tu proyecto (tu_proyecto_raiz/), crea un archivo llamado .env.
Dentro de .env, pega tu clave de API:
GEMINI_API_KEY="TU_CLAVE_DE_API_REAL_AQUI"
¡Reemplaza TU_CLAVE_DE_API_REAL_AQUI con tu clave de API real!
Guarda y cierra el archivo. Recuerda que este archivo NO se sube a GitHub.
Inicia Sesión en Vercel CLI:

En tu terminal (en la raíz de tu proyecto):
Bash

vercel login
Sigue las instrucciones.
Inicia el Servidor de Desarrollo Local de Vercel:

En tu terminal (en la raíz de tu proyecto):
Bash

vercel dev
Vercel levantará un servidor local (ej. http://localhost:3000).
Navega a tu Aplicación en el Navegador:

Abre tu navegador y ve a la URL local de Vercel, pero añade la ruta a tu módulo específico.
Para el generador de imágenes: http://localhost:3000/ia-img/
Para el editor de imágenes: http://localhost:3000/edit-img/
...y así para cada módulo.
Prueba todas las funcionalidades (generar, mejorar prompt, galería, etc.).
4. Despliegue en Vercel (Producción)
Sube los Cambios a GitHub:

En tu terminal (en la raíz de tu proyecto):
Bash

git add .
git commit -m "feat: Completa serverless proxy y configuración de rutas"
git push
Verifica en GitHub que api/, package.json, package-lock.json estén en la raíz, pero que node_modules/ y .env NO estén.
Despliega el Proyecto en Vercel:

Vercel detectará los nuevos commits en GitHub y comenzará un despliegue automático.
Configura la Variable de Entorno en Vercel Dashboard (¡Obligatorio para producción!):

Ve a tu Vercel Dashboard (en la web).
Haz clic en tu Proyecto.
Ve a Settings -> Environment Variables.
Añade la variable:
Name: GEMINI_API_KEY
Value: Pega tu clave de API real de Google Gemini.
Haz clic en "Add".
Redepliega el Proyecto en Vercel:

Ve a la pestaña Deployments de tu proyecto en Vercel.
Haz clic en el botón "Redeploy" junto al despliegue más reciente.
Con estos pasos, tu proyecto modular se desplegará correctamente, tus serverless functions funcionarán como proxy seguro, y todas las rutas deberían resolverse bien en el entorno de producción de Vercel.
