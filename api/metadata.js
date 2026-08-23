export default async function handler(req, res) {
  // Asegurar headers CORS para tu propio dominio
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const response = await fetch("https://stream-179.surfernetwork.com/xk7mncypfa0uv?json=1", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (!response.ok) {
      throw new Error(`Error en el servidor de radio: ${response.status}`);
    }

    const data = await response.json();
    
    // Retornar los datos al reproductor front-end
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "No se pudieron obtener los metadatos", details: error.message });
  }
}