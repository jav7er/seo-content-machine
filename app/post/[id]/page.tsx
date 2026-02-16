import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPost, getWordCount } from "@/lib/wordpress";
import { fetchGSCData } from "@/lib/gsc";
import { fetchGA4Data } from "@/lib/ga4";
import { analyzeContent } from "@/lib/ai";
import { saveAudit, getAudits } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash, AlertTriangle, CheckCircle, ArrowLeft, ExternalLink, RefreshCw, PenTool } from "lucide-react";
import { RewriteButton } from "@/components/rewrite-button";
import { RedirectButton } from "@/components/redirect-button";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PageProps) {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) notFound();

    try {
        const post = await fetchPost(id);
        const endDate = new Date().toISOString().split("T")[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        // Obtener auditoría previa para ver si hay una URL anterior
        const audits = await getAudits();
        const audit = audits[id];
        const prevUrl = audit?.previousUrl;

        const [gscData, ga4Data] = await Promise.all([
            fetchGSCData(process.env.GSC_SITE_URL || "sc-domain:newemage.com.mx", startDate, endDate, post.link),
            fetchGA4Data(process.env.GA4_PROPERTY_ID || "", startDate, endDate, new URL(post.link).pathname),
        ]);

        // Si hay una URL previa, combinar estadísticas
        if (prevUrl) {
            try {
                const prevPath = new URL(prevUrl).pathname;
                const [prevGsc, prevGa4] = await Promise.all([
                    fetchGSCData(process.env.GSC_SITE_URL || "sc-domain:newemage.com.mx", startDate, endDate, prevUrl),
                    fetchGA4Data(process.env.GA4_PROPERTY_ID || "", startDate, endDate, prevPath),
                ]);

                gscData.clicks += prevGsc.clicks;
                gscData.impressions += prevGsc.impressions;
                // Recalcular CTR y Posición (aproximado)
                const totalImpressions = gscData.impressions;
                if (totalImpressions > 0) {
                    gscData.ctr = gscData.clicks / totalImpressions;
                }
                // Posición media ponderada por impresiones
                const weight1 = gscData.impressions - prevGsc.impressions;
                const weight2 = prevGsc.impressions;
                if (totalImpressions > 0) {
                    gscData.position = ((gscData.position * weight1) + (prevGsc.position * weight2)) / totalImpressions;
                }
                
                ga4Data.activeUsers += prevGa4.activeUsers;
                // Combinar top queries
                const queryMap = new Map();
                [...gscData.topQueries, ...prevGsc.topQueries].forEach(q => {
                    const key = q.keys[0];
                    if (queryMap.has(key)) {
                        const existing = queryMap.get(key);
                        existing.clicks += q.clicks;
                        existing.impressions += q.impressions;
                    } else {
                        queryMap.set(key, { ...q });
                    }
                });
                gscData.topQueries = Array.from(queryMap.values()).sort((a, b) => b.clicks - a.clicks);
            } catch (e) {
                console.warn("Error al combinar estadísticas de URL previa:", e);
            }
        }

        const analysis = await analyzeContent(
            post.content.rendered,
            post.title.rendered,
            { ...gscData, activeUsers: ga4Data.activeUsers },
            { lastUpdated: post.modified, wordCount: getWordCount(post.content.rendered) }
        );

        // Guardar resultado localmente
        await saveAudit({
            postId: id,
            lastAuditDate: new Date().toISOString(),
            recommendation: analysis.recommendation,
            priority: analysis.priority,
            score: analysis.seoScore,
            createdAt: post.date,
            modifiedAt: post.modified,
            redirectionUrl: analysis.redirectionTarget,
            previousUrl: prevUrl // Preservar la URL previa
        });

        const getStatusIcon = (rec: string) => {
            if (rec === "MANTENER") return <CheckCircle className="text-green-500 h-5 w-5" />;
            if (rec === "ACTUALIZAR") return <AlertTriangle className="text-yellow-500 h-5 w-5" />;
            if (rec === "REESCRIBIR") return <PenTool className="text-orange-500 h-5 w-5" />;
            return <Trash className="text-red-500 h-5 w-5" />;
        };

        return (
            <div className="flex-1 space-y-4 p-8 pt-6 bg-slate-50 min-h-screen">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Link href="/">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver al Panel
                            </Button>
                        </Link>
                        <h2 className="text-3xl font-bold tracking-tight">Resultado de Auditoría</h2>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Link href={post.link} target="_blank">
                            <Button variant="outline" size="sm">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Ver en el Sitio
                            </Button>
                        </Link>
                        <Button size="sm">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Re-analizar
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    {/* Columna Principal */}
                    <div className="col-span-4 space-y-4">
                        <Card className="border-t-4 border-t-primary">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-2xl">{post.title.rendered}</CardTitle>
                                        <CardDescription>
                                            Actualizado por última vez el {new Date(post.modified).toLocaleDateString()}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline" className="text-xs uppercase px-2 py-0.5">
                                        Prioridad {analysis.priority}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center p-4 bg-white rounded-lg border mb-6">
                                    <div className="mr-4 p-2 bg-slate-100 rounded-full">
                                        {getStatusIcon(analysis.recommendation)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recomendación de IA</p>
                                        <p className="text-lg font-bold text-slate-900">{analysis.recommendation.replace(/_/g, " ")}</p>
                                    </div>
                                    <Badge className="text-sm px-4 py-1">
                                        {analysis.seoScore}/100 SEO
                                    </Badge>
                                </div>

                                {post.meta?.rank_math_focus_keyword && (
                                    <div className="mb-6 p-3 bg-purple-50 border border-purple-100 rounded-lg flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Keyword Actual Rank Math</p>
                                            <p className="text-sm font-semibold text-purple-900 font-mono">{post.meta.rank_math_focus_keyword}</p>
                                        </div>
                                        <Badge variant="outline" className="bg-white text-purple-700 border-purple-200">
                                            {post.meta.rank_math_seo_score || "N/A"} Score
                                        </Badge>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    <div>
                                        <h4 className="font-bold text-slate-800 mb-1">Razonamiento Táctico:</h4>
                                        <p className="text-sm text-slate-600 leading-relaxed italic">{analysis.reasoning}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <h4 className="font-bold text-slate-800 mb-1">Análisis de Palabras Clave:</h4>
                                        <p className="text-sm text-slate-600 leading-relaxed">{analysis.keywordOptimization}</p>
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <RewriteButton postId={id} />
                                    {analysis.recommendation === "ELIMINAR_REDIRECCIONAR" && (
                                        <RedirectButton postId={id} suggestedTarget={analysis.redirectionTarget} />
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Riesgo de Canibalización</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center mb-4">
                                    <Badge variant={analysis.cannibalizationRisk === "ALTO" ? "destructive" : analysis.cannibalizationRisk === "MEDIO" ? "secondary" : "default"}>
                                        Riesgo {analysis.cannibalizationRisk}
                                    </Badge>
                                </div>
                                <p className="text-sm text-slate-600 italic">
                                    {analysis.cannibalizationReasoning || "No se detectaron conflictos directos con otros temas genéricos del sitio."}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Estructura Semántica y Calidad</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-3 bg-slate-50 rounded-md">
                                        <p className="text-xs text-slate-500 font-bold uppercase">Longitud</p>
                                        <p className="text-xl font-bold">{analysis.wordCount} Palabras</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-md">
                                        <p className="text-xs text-slate-500 font-bold uppercase">Estado</p>
                                        <p className="text-xl font-bold text-orange-600">{analysis.isOutdated ? "Anticuado" : "Actualizado"}</p>
                                    </div>
                                </div>
                                <h4 className="font-semibold text-sm mb-2">Hallazgos estructurales:</h4>
                                {analysis.structureIssues.length > 0 ? (
                                    <ul className="space-y-2">
                                        {analysis.structureIssues.map((issue, i) => (
                                            <li key={i} className="flex items-start text-sm text-slate-600">
                                                <span className="text-red-500 mr-2">•</span> {issue}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-green-600 font-medium flex items-center">
                                        <CheckCircle className="mr-2 h-4 w-4" /> Estructura semántica óptima.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Columna Lateral */}
                    <div className="col-span-3 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500">Puntaje Semántico</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{analysis.semanticScore}/100</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500">Puntaje SEO</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{analysis.seoScore}/100</div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Rendimiento (GSC/GA4)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span>Clicks (GSC)</span>
                                    <span className="font-bold">{gscData.clicks}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center text-sm">
                                    <span>Impresiones (GSC)</span>
                                    <span className="font-bold">{gscData.impressions}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center text-sm">
                                    <span>CTR Promedio</span>
                                    <span className="font-bold">{(gscData.ctr * 100).toFixed(2)}%</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center text-sm">
                                    <span>Posición Media</span>
                                    <span className="font-bold">{gscData.position.toFixed(1)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center text-sm">
                                    <span>Usuarios Activos (GA4)</span>
                                    <span className="font-bold font-mono">{ga4Data.activeUsers}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Top Consultas de Search Console</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {gscData.topQueries.slice(0, 8).map((q, i) => (
                                        <li key={i} className="flex justify-between text-xs border-b pb-2 last:border-0">
                                            <span className="text-slate-700 font-medium truncate max-w-[170px]">{q.keys[0]}</span>
                                            <div className="text-right">
                                                <span className="font-bold text-slate-900">{q.clicks} clicks</span>
                                                <p className="text-[10px] text-slate-400">Pos. {q.position.toFixed(1)}</p>
                                            </div>
                                        </li>
                                    ))}
                                    {gscData.topQueries.length === 0 && <li className="text-muted-foreground text-sm">Sin datos de búsqueda.</li>}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div >
        );
    } catch (error) {
        console.error("Error en PostPage:", error);
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold text-red-500 uppercase tracking-tighter">Error en el Análisis</h1>
                <p className="text-slate-600 mb-6 mt-2 max-w-md"> No pudimos procesar la auditoría. Verifica que tus credenciales de Google y OpenRouter en el archivo .env sean correctas.</p>
                <div className="bg-slate-900 text-slate-200 p-6 rounded-lg overflow-auto max-h-64 text-xs font-mono border-2 border-red-200">
                    {String(error)}
                </div>
                <Link href="/">
                    <Button className="mt-8 bg-black text-white hover:bg-slate-800">Regresar al Inicio</Button>
                </Link>
            </div>
        );
    }
}
