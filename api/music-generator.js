// api/music-generator.js

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ message: "Solo se permiten solicitudes POST" }),
      { status: 405 }
    );
  }

  try {
    const { prompt, duration_seconds } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ message: "El prompt es requerido" }),
        { status: 400 }
      );
    }

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version:
          "7a76a8258b23fae65c5a22debb8841d1d7e816b75c2f24218cd2bd8573787906",
        input: {
          // ✅ CAMBIO REALIZADO AQUÍ
          model_version: "large", // Usamos 'large' en lugar de 'stereo-large'
          prompt: prompt,
          duration: duration_seconds,
        },
      }),
    });

    if (response.status !== 201) {
      let error = await response.json();
      return new Response(
        JSON.stringify({
          detail: error.detail || "Error al iniciar la predicción.",
        }),
        { status: 500 }
      );
    }

    const prediction = await response.json();
    return new Response(JSON.stringify(prediction), { status: 202 });
  } catch (error) {
    return new Response(JSON.stringify({ detail: error.message }), {
      status: 500,
    });
  }
}
