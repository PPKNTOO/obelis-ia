// api/get-prediction.js

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  // Ahora leemos el 'id' como un parámetro de búsqueda en la URL (ej: ?id=xxxx)
  const predictionId = new URL(req.url).searchParams.get("id");

  if (!predictionId) {
    return new Response(
      JSON.stringify({ detail: "Falta el ID de la predicción" }),
      { status: 400 }
    );
  }

  const response = await fetch(
    `https://api.replicate.com/v1/predictions/${predictionId}`,
    {
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (response.status !== 200) {
    let error = await response.json();
    return new Response(JSON.stringify({ detail: error.detail }), {
      status: 500,
    });
  }

  const prediction = await response.json();
  return new Response(JSON.stringify(prediction));
}
