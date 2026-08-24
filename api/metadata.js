export default async function handler(req, res) {
  // Permitir CORS para desarrollo local o producción
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    // Apuntamos al endpoint exacto que descubrimos en la red
    const targetUrl = "https://stream-179.surfernetwork.com/xk7mncypfa0uv/stats?sid=1&json=1";
    
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/javascript, application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`SurferNetwork respondió con estado ${response.status}`);
    }

    const text = await response.text();

    // Como SurferNetwork devuelve JSONP (ej: jQuery3000...\n({ ... })) 
    // limpiamos el wrapper para extraer únicamente el objeto JSON real:
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No se pudo parsear el formato JSONP del servidor");
    }

    const data = JSON.parse(jsonMatch[0]);

    // Retornamos los datos limpios al frontend de Repro54.js
    return res.status(200).json(data);

  } catch (error) {
    console.error("Error al obtener metadatos de radio:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
