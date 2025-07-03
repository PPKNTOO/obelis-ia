// api/predictions/[id].js

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  const predictionId = req.nextUrl.searchParams.get("id");

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
