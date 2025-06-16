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

  // CAMBIO CLAVE AQUÍ: Esperar la propiedad 'contents' directamente del body
  const { contents } = req.body; // El frontend ya envía { contents: chatHistory }

  // Asegurarse de que 'contents' está presente
  if (!contents) {
    console.error(
      "GenerateContentRequest.contents: contents is not specified in request body."
    );
    return res.status(400).json({
      error: "GenerateContentRequest.contents: contents is not specified",
    });
  }

  const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(googleApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: contents }), // Pasar 'contents' directamente
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
