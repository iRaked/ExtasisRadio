// api/zeno.js

export default async function handler(req, res) {
  // Encabezados para evitar caché y permitir CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');

  try {
    // 1. Conectamos al stream de Zeno
    const response = await fetch('https://api.zeno.fm/mounts/metadata/subscribe/bmv9fcypfa0uv');
    
    // 2. Usamos un lector de streams para no esperar a que "termine" (porque nunca termina)
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // 3. Leemos el stream chunk por chunk
    while (true) {
      const { done, value } = await reader.read();
      if (done) break; // Si Zeno cierra, salimos
      
      // Decodificamos el texto y lo añadimos al buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Separamos por líneas
      const lines = buffer.split('\n');
      
      // Guardamos la última línea (que puede estar incompleta) para el siguiente ciclo
      buffer = lines.pop() || '';

      // 4. Buscamos la primera línea válida que empiece con "data: "
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            // Quitamos "data: " y parseamos el JSON
            const jsonData = JSON.parse(line.substring(6));
            
            if (jsonData && jsonData.streamTitle) {
              // ¡ÉXITO! Devolvemos el dato y CERRAMOS la conexión con Zeno inmediatamente
              return res.status(200).json({ streamTitle: jsonData.streamTitle });
            }
          } catch (e) {
            // Si el JSON está mal formado, ignoramos y seguimos leyendo la siguiente línea
          }
        }
      }
    }

    // Si por alguna razón el stream se cierra sin dar datos, devolvemos un fallback
    return res.status(200).json({ streamTitle: "En La Disco RG - Transmisión en Vivo" });

  } catch (error) {
    console.error("Error en el puente Zeno:", error);
    return res.status(500).json({ error: "Error obteniendo metadatos" });
  }
}
