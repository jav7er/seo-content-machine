export async function searchTrends(query: string): Promise<string> {
    const apiKey = process.env.SERPER_API_KEY || process.env.TAVILY_API_KEY;

    if (!apiKey) {
        return "Búsqueda web no disponible (Configura SERPER_API_KEY o TAVILY_API_KEY en .env)";
    }

    try {
        // Ejemplo con Serper.dev
        if (process.env.SERPER_API_KEY) {
            const response = await fetch("https://google.serper.dev/search", {
                method: "POST",
                headers: {
                    "X-API-KEY": process.env.SERPER_API_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ q: query, gl: "es", hl: "es" }),
            });
            const data = await response.json();
            return data.organic?.map((s: any) => `${s.title}: ${s.snippet}`).join("\n") || "No se encontraron resultados.";
        }

        return "Servicio de búsqueda no configurado correctamente.";
    } catch (error) {
        console.error("Search Error:", error);
        return "Error al realizar la búsqueda web.";
    }
}
