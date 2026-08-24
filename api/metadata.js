// api/zeno.js
export default async function handler(req, res) {
  // 1. Encabezados CRÍTICOS para evitar el caché de Xat y permitir CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    // 2. Tu servidor Vercel se conecta a Zeno (Server-to-Server, sin bloqueo CSP)
    const response = await fetch('https://api.zeno.fm/mounts/metadata/subscribe/bmv9fcypfa0uv', {
      method: 'GET',
      headers: { 'Accept': 'text/event-stream' }
    });
    
    const text = await response.text();
    
    // 3. Parsear la respuesta SSE (buscamos la última línea 'data:' válida)
    const lines = text.split('\n').filter(line => line.startsWith('data:'));
    
    if (lines.length > 0) {
      const lastData = lines[lines.length - 1].replace('data: ', '').trim();
      const parsedData = JSON.parse(lastData);
      
      // 4. Devolver solo lo que necesita el reproductor
      return res.status(200).json({ 
        streamTitle: parsedData.streamTitle || "En La Disco RG" 
      });
    }
    
    return res.status(200).json({ streamTitle: "En La Disco RG - Transmisión en Vivo" });

  } catch (error) {
    console.error("Error en el puente Zeno:", error);
    return res.status(500).json({ error: "Error obteniendo metadatos" });
  }
}
