import OpenAI from "openai";

export interface AIAnalysisResult {
    semanticScore: number;
    seoScore: number;
    recommendation: "MANTENER" | "ACTUALIZAR" | "REESCRIBIR" | "ELIMINAR_REDIRECCIONAR";
    reasoning: string;
    keywordOptimization: string;
    structureIssues: string[];
    priority: "ALTA" | "MEDIA" | "BAJA";
    cannibalizationRisk: "ALTO" | "MEDIO" | "BAJO" | "NINGUNO";
    cannibalizationReasoning?: string;
    suggestedSlug?: string;
    redirectionTarget?: string;
    wordCount: number;
    isOutdated: boolean;
}

export interface RewriteResult {
    title: string;
    slug: string;
    content: string;
    focus_keyword: string;
    meta_description: string;
    rank_math_title: string;
}

export interface SEOAuditReport {
    status: "VERDE" | "AMARILLO" | "ROJO";
    reasoning: string;
    recommendation: string;
}

export interface PostPlan {
    audit: SEOAuditReport;
    focus_keyword: string;
    refined_keyword?: string;
    description: string;
    structure: Array<{ tag: "h1" | "h2" | "h3"; text: string }>;
    questions: string[];
    internal_links: Array<{ title: string; url: string; context: string }>;
}

function getOpenAIClient() {
    return new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
        defaultHeaders: {
            "HTTP-Referer": "https://newemage.com.mx",
            "X-Title": "NewEmage Content Auditor",
        },
    });
}

function getTodayISO(): string {
    return new Date().toISOString().split("T")[0];
}

export async function analyzeContent(
    content: string,
    title: string,
    metrics: { clicks: number; impressions: number; activeUsers: number; topQueries: any[] },
    metadata: { lastUpdated: string; wordCount: number }
): Promise<AIAnalysisResult> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";

    if (!apiKey) {
        console.warn("OPENROUTER_API_KEY no configurado.");
        return {
            semanticScore: 0,
            seoScore: 0,
            recommendation: "MANTENER",
            reasoning: "Falta API Key",
            keywordOptimization: "N/A",
            structureIssues: [],
            priority: "BAJA",
            cannibalizationRisk: "NINGUNO",
            wordCount: metadata.wordCount,
            isOutdated: false
        };
    }

    const openai = getOpenAIClient();
    const today = getTodayISO();

    const prompt = `
  Eres un experto en SEO y Estrategia de Contenido para blogs de tecnología y diseño web.
  Analiza el siguiente post de WordPress y decide su futuro basado en datos reales.

  FECHA DE HOY: ${today}

  TÍTULO: "${title}"
  ÚLTIMA ACTUALIZACIÓN: ${metadata.lastUpdated}
  LONGITUD: ${metadata.wordCount} palabras
  
  MÉTRICAS (Últimos 30 días):
  - Clicks (GSC): ${metrics.clicks}
  - Impresiones (GSC): ${metrics.impressions}
  - Usuarios Activos (GA4): ${metrics.activeUsers}
  - Términos de búsqueda principales: ${metrics.topQueries.map(q => q.keys?.[0]).filter(Boolean).join(", ") || "Sin datos"}

  CONTENIDO (Fragmento):
  "${content.substring(0, 8000)}"

  CRITERIOS DE ANÁLISIS:
  1. Estructura Semántica: Revisa H1-H6, uso de negritas (bolds), links internos/externos e imágenes.
  2. Optimización: ¿Está realmente optimizado para los términos que traen tráfico?
  3. Relevancia de Negocio: Considera si el tema es actual o si ha quedado obsoleto. Usa la fecha de hoy (${today}) para determinar la antigüedad real.
  4. Canibalización: Si detectas que el tema es muy genérico y podría chocar con otros artículos del mismo blog, indica el nivel de riesgo y razonamiento.
  5. Popularidad: Según impresiones y clicks, ¿hay interés real? Si ambos son 0, el artículo no tiene tracción orgánica.

  RESPONDE EXCLUSIVAMENTE EN FORMATO JSON (en español):
  {
    "semanticScore": (0-100),
    "seoScore": (0-100),
    "recommendation": "MANTENER" | "ACTUALIZAR" | "REESCRIBIR" | "ELIMINAR_REDIRECCIONAR",
    "reasoning": "Explicación detallada de por qué esta decisión",
    "keywordOptimization": "Análisis de términos de búsqueda vs contenido",
    "structureIssues": ["lista de problemas ej: Falta H2", "Párrafos muy largos", "Sin negritas"],
    "priority": "ALTA" | "MEDIA" | "BAJA",
    "cannibalizationRisk": "ALTO" | "MEDIO" | "BAJO" | "NINGUNO",
    "cannibalizationReasoning": "Explicación del riesgo de canibalización",
    "isOutdated": boolean,
    "redirectionTarget": "URL sugerida si la recomendación es ELIMINAR_REDIRECCIONAR"
  }
  `;

    try {
        const completion = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: `Actúa como un auditor SEO senior. La fecha de hoy es ${today}. Devuelve solo JSON válido.` },
                { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(completion.choices[0].message.content || "{}");
        return {
            ...result,
            wordCount: metadata.wordCount
        };
    } catch (error) {
        console.error("Error en análisis de IA:", error);
        throw error;
    }
}

export async function rewritePost(
    content: string,
    title: string,
    analysis: AIAnalysisResult,
    inventory: any[],
    currentMeta?: { rank_math_focus_keyword?: string },
    customInstructions?: string
): Promise<RewriteResult> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";

    if (!apiKey) throw new Error("OPENROUTER_API_KEY no configurado");

    const openai = getOpenAIClient();

    const prompt = `
    Actúa como un Redactor Senior y Consultor SEO de élite en el año 2026. 
    Tu objetivo es transformar este post en una pieza 100/100 para RankMath que domine los resultados de búsqueda.

    FECHA ACTUAL: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })} (Año 2026)
    
    ANÁLISIS PREVIO DEL CONTENIDO:
    - Razonamiento: ${analysis.reasoning}
    - Problemas detectados: ${analysis.structureIssues.join(", ")}
    - Score SEO previo: ${analysis.seoScore}/100

    INVENTARIO PARA LINKS INTERNOS (Usa estos enlaces reales para enriquecer el post):
    ${JSON.stringify(inventory.slice(0, 30))}

    KEYWORD OBJETIVO ACTUAL: "${currentMeta?.rank_math_focus_keyword || 'No definido'}"

    ${customInstructions ? `INSTRUCCIONES PERSONALIZADAS (MÁXIMA PRIORIDAD):
    - ${customInstructions}
    ` : ""}

    TÍTULO ORIGINAL: ${title}
    CONTENIDO PARA REESCRIBIR:
    ${content.substring(0, 10000)}

    ---

    REGLAS DE ORO DE REDACCION (ESTRATEGIA 2026):
    1. TONO: Autoritario, experto y útil.
    2. KEYWORD EN FOCO: Debe aparecer en las primeras 100 palabras de forma fluida.
    3. TÍTULO SEO: [Keyword] + Palabra de Poder + [2026/Beneficio]. (Máx 60 caracteres).
    4. META DESCRIPCIÓN: Convincente, incluye keyword y un CTA claro.
    5. ESTRUCTURA: H1 (idéntico al título SEO), H2s y H3s que cubran semánticamente el tema.
    6. SECCIÓN FAQ (OBLIGATORIA): Crea un bloque H2 llamado "Preguntas Frecuentes" al final. Responde 3-4 preguntas críticas en 40-50 palabras cada una (estilo enciclopedia).
    7. LINKS INTERNOS: Sugiere 3 enlaces exactos del inventario. Formato: *Insertar enlace a [Título] en la frase "..."*.
    8. FORMATO: HTML limpio (p, strong, ul, li, h2, h3).
    `;

    const completion = await openai.chat.completions.create({
        model: model,
        messages: [
            { role: "system", content: "Eres un redactor SEO experto. Devuelve SOLO un objeto JSON válido (NO un array). Campos requeridos: title, slug, content, focus_keyword, rank_math_title, meta_description." },
            { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
    });

    const raw = JSON.parse(completion.choices[0].message.content || "{}");

    // Handle if Gemini returns an array instead of object
    const result = Array.isArray(raw) ? raw[0] : raw;

    return {
        title: result.title || "",
        slug: result.slug || "",
        content: result.content || "",
        focus_keyword: result.focus_keyword || "",
        rank_math_title: result.rank_math_title || result.title || "",
        meta_description: result.meta_description || "",
    };
}

export interface PostPlan {
    focus_keyword: string;
    description: string;
    structure: Array<{ tag: "h1" | "h2" | "h3"; text: string }>;
}

/**
 * Generates a plan for a new post with SEO audit
 */
export async function generatePostPlan(
    topic: string,
    inventory: any[],
    performance: any,
    paa?: string[]
): Promise<PostPlan> {
    const openai = getOpenAIClient();
    const model = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";

    const prompt = `
    Actúa como un Consultor SEO Técnico y Redactor Senior. 
    Tu objetivo es crear una estrategia para un nuevo artículo, pero primero debes realizar una auditoría de seguridad para evitar la canibalización.

    **DATOS DE ENTRADA:**
    1. **Tema/Keyword Propuesta:** "${topic}"
    2. **Inventario de Contenidos Existentes:** 
       ${JSON.stringify(inventory.slice(0, 50))}
    3. **Datos de Rendimiento (GSC):**
       ${JSON.stringify(performance)}
    4. **Preguntas "People Also Ask":**
       ${JSON.stringify(paa || [])}

    ---

    **FASE 1: AUDITORÍA DE CANIBALIZACIÓN Y OPORTUNIDAD**
    Analiza la "Keyword Propuesta" contra los datos y determina:
    1. Duplicidad Directa: ¿Ya es Focus Keyword?
    2. Conflicto Semántico: ¿Hay artículos que ya rankean para esto?
    3. Análisis de Oportunidad: ¿Conviene actualizar uno existente?

    **FASE 2: ESTRATEGIA (Solo si Fase 1 es VERDE o AMARILLO)**
    1. Refina a Long Tail.
    2. Selecciona 3-5 preguntas clave.
    3. Propón estructura H1-H3.
    4. Sugiere 3 enlaces internos exactos del inventario proporcionado.

    RESPONDE EXCLUSIVAMENTE EN FORMATO JSON:
    {
      "audit": {
        "status": "VERDE" | "AMARILLO" | "ROJO",
        "reasoning": "Explicación detallada basada en datos",
        "recommendation": "Acción a seguir"
      },
      "focus_keyword": "keyword original",
      "refined_keyword": "keyword long tail refinada",
      "description": "Enfoque estratégico del post",
      "structure": [
        { "tag": "h1", "text": "Título SEO" },
        { "tag": "h2", "text": "Subtítulo" }
      ],
      "questions": ["Pregunta 1", "Pregunta 2"],
      "internal_links": [
        { "title": "Título del post existente", "url": "URL", "context": "Frase donde insertar el link" }
      ]
    }
    `;

    const completion = await openai.chat.completions.create({
        model: model,
        messages: [{ role: "system", content: "Eres un Consultor SEO Senior. Responde estrictamente en JSON." }, { role: "user", content: prompt }],
        response_format: { type: "json_object" },
    });

    return JSON.parse(completion.choices[0].message.content || "{}");
}

/**
 * Generates the full content of a post based on the new SEO audit strategy
 */
export async function generateFullPostContent(plan: PostPlan): Promise<RewriteResult> {
    const openai = getOpenAIClient();
    const model = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";

    const structureStr = plan.structure.map(s => `${s.tag.toUpperCase()}: ${s.text}`).join("\n");
    const linksStr = plan.internal_links.map(l => `- Enlace a [${l.title}](${l.url}) en la frase "${l.context}"`).join("\n");

    const prompt = `
    Redacción del Artículo (RankMath 100/100) basándote en este plan estratégico:

    FOCUS KEYWORD: ${plan.refined_keyword || plan.focus_keyword}
    ESTRUCTURA:
    ${structureStr}

    ENLACES INTERNOS A INCLUIR:
    ${linksStr}

    PREGUNTAS PARA FAQ (OBLIGATORIO):
    ${plan.questions.join(", ")}

    REGLAS DE REDACCIÓN:
    1. Título SEO: [Keyword] + Power Word + [Año/Beneficio]. (Máx 60 chars).
    2. Intro: Focus Keyword en las primeras 100 palabras.
    3. Sección "Preguntas Frecuentes": Bloque H2 final con respuestas de 40-50 palabras estilo enciclopedia.
    4. Enlaces Internos: Inserta los enlaces sugeridos de forma natural.
    5. Tono: Autoridad, confianza y claridad.
    6. Formato: HTML limpio (p, strong, ul, li, h2, h3).

    RESPONDE EXCLUSIVAMENTE EN FORMATO JSON:
    {
      "title": "H1/Título SEO",
      "slug": "slug-exacto",
      "content": "HTML...",
      "focus_keyword": "${plan.refined_keyword || plan.focus_keyword}",
      "rank_math_title": "Meta Title (max 60)",
      "meta_description": "Meta description con keyword y CTA"
    }
    `;

    const completion = await openai.chat.completions.create({
        model: model,
        messages: [{ role: "system", content: "Eres un Redactor Senior SEO. Responde solo con JSON." }, { role: "user", content: prompt }],
        response_format: { type: "json_object" },
    });

    return JSON.parse(completion.choices[0].message.content || "{}");
}
