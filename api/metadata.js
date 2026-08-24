export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const targetUrl = "https://api.zeno.fm/mounts/metadata/subscribe/bmv9fcypfa0uv";
    
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/event-stream, application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Zeno API respondió con estado ${response.status}`);
    }

    const text = await response.text();

    // Como Zeno responde mediante Server-Sent Events (SSE), capturamos la línea de datos
    const lines = text.split('\n');
    let streamTitle = "En La Disco RG — Transmisión en Vivo 24/7";

    for (const line of lines) {
      if (line.startsWith('data:')) {
        try {
          const jsonD = JSON.parse(line.replace('data:', '').trim());
          if (jsonD.streamTitle) {
            streamTitle = jsonD.streamTitle;
          }
        } catch (e) {
          // Ignorar líneas de ping o malformadas
        }
      }
    }

    // Retornamos estandarizado para que el reproductor lo lea sin problema
    return res.status(200).json({ songtitle: streamTitle });

  } catch (error) {
    console.error("Error al obtener metadatos de Zeno:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
