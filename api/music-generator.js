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
        // Este es el identificador del modelo MusicGen en Replicate
        version:
          "b05b1dff1d8c6ac63d424224af995aa363fe5352a73021361957f4da75b34a9d",
        input: {
          model_version: "stereo-large",
          prompt: prompt,
          duration: duration_seconds,
        },
      }),
    });

    if (response.status !== 201) {
      let error = await response.json();
      return new Response(JSON.stringify({ detail: error.detail }), {
        status: 500,
      });
    }

    const prediction = await response.json();

    // Devolvemos la URL para que el frontend pueda consultar el estado
    return new Response(JSON.stringify(prediction), { status: 202 });
  } catch (error) {
    return new Response(JSON.stringify({ detail: error.message }), {
      status: 500,
    });
  }
}
