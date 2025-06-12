// api/gemini.js
// Esta función se ejecutará en el servidor de Vercel (Serverless Function)

// En entornos Vercel, `fetch` ya suele estar disponible globalmente,
// por lo que no es necesario importar node-fetch explícitamente en Vercel.
// Si tienes problemas de compatibilidad con 'fetch' en tu Node.js local
// y no usas vercel dev, podrías necesitar un 'npm install node-fetch'
// y luego 'const fetch = require('node-fetch');' aquí.

// api/gemini.js
// Esta función se ejecutará en el servidor de Vercel (Serverless Function)

export default async function (req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    console.error(
      "GEMINI_API_KEY no está configurada en las variables de entorno de Vercel."
    );
    return res.status(500).json({ error: "Server API Key not configured." });
  }

  const { prompt, chatHistory } = req.body;

  const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(googleApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: chatHistory }),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error(
      "Error calling Google Gemini API from Vercel Function:",
      error
    );
    res
      .status(500)
      .json({ error: "Failed to process AI request through proxy." });
  }
}
