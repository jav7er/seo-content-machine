import { NextRequest, NextResponse } from "next/server";
import { fetchPost, updatePost, fetchPostInventory } from "@/lib/wordpress";
import { analyzeContent, rewritePost } from "@/lib/ai";
import { fetchGSCData } from "@/lib/gsc";
import { fetchGA4Data } from "@/lib/ga4";
import { getWordCount } from "@/lib/wordpress";
import { getAudits, saveAudit } from "@/lib/storage";
import { searchTrends } from "@/lib/search";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: idString } = await params;
    const id = parseInt(idString);

    try {
        const body = await req.json().catch(() => ({}));
        const action = body.action || "generate"; // "generate" | "publish"

        // If publishing, update the post directly including Rank Math meta
        if (action === "publish") {
            const { title, slug, content, focus_keyword, rank_math_title, meta_description } = body;
            if (!title || !content) {
                return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
            }

            // Get existing post to compare slug and keep track of previous URL
            const existingPost = await fetchPost(id);
            const previousUrl = existingPost.link;
            const slugChanged = slug && slug !== existingPost.slug;

            const meta: Record<string, string> = {};
            if (focus_keyword) meta.rank_math_focus_keyword = focus_keyword;
            if (rank_math_title) meta.rank_math_title = rank_math_title;
            if (meta_description) meta.rank_math_description = meta_description;

            const updated = await updatePost(id, {
                title,
                slug,
                content,
                meta: Object.keys(meta).length > 0 ? meta : undefined,
            });

            // Update local audit to mark as rewritten and store previous URL if slug changed
            const audits = await getAudits();
            const existing = audits[id];
            if (existing) {
                await saveAudit({
                    ...existing,
                    rewrittenAt: new Date().toISOString(),
                    previousUrl: slugChanged ? previousUrl : existing.previousUrl
                });
            } else {
                // If no audit exists, create a minimal one to track previous URL
                await saveAudit({
                    postId: id,
                    lastAuditDate: new Date().toISOString(),
                    recommendation: 'audited',
                    priority: 'medium',
                    score: 0,
                    rewrittenAt: new Date().toISOString(),
                    previousUrl: slugChanged ? previousUrl : undefined
                });
            }

            return NextResponse.json({
                success: true,
                message: "Post actualizado exitosamente en WordPress (incluyendo Rank Math SEO)",
                post: {
                    id: updated.id,
                    title: updated.title?.rendered || title,
                    slug: updated.slug,
                    link: updated.link,
                }
            });
        }

        // Generate rewritten content
        const { customInstructions } = body;
        const post = await fetchPost(id);
        const endDate = new Date().toISOString().split("T")[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        const [gscData, ga4Data, inventory, searchData, audits] = await Promise.all([
            fetchGSCData(process.env.GSC_SITE_URL || "sc-domain:newemage.com.mx", startDate, endDate, post.link),
            fetchGA4Data(process.env.GA4_PROPERTY_ID || "", startDate, endDate, new URL(post.link).pathname),
            fetchPostInventory(),
            searchTrends(post.title.rendered),
            getAudits()
        ]);

        const audit = audits[id];
        const prevUrl = audit?.previousUrl;

        // Si hay una URL previa, combinar estadísticas para el análisis
        if (prevUrl) {
            try {
                const prevPath = new URL(prevUrl).pathname;
                const [prevGsc, prevGa4] = await Promise.all([
                    fetchGSCData(process.env.GSC_SITE_URL || "sc-domain:newemage.com.mx", startDate, endDate, prevUrl),
                    fetchGA4Data(process.env.GA4_PROPERTY_ID || "", startDate, endDate, prevPath),
                ]);

                gscData.clicks += prevGsc.clicks;
                gscData.impressions += prevGsc.impressions;
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
                console.warn("Error al combinar estadísticas de URL previa en rewrite:", e);
            }
        }

        const analysis = await analyzeContent(
            post.content.rendered,
            post.title.rendered,
            { ...gscData, activeUsers: ga4Data.activeUsers },
            { lastUpdated: post.modified, wordCount: getWordCount(post.content.rendered) }
        );

        const rewritten = await rewritePost(
            post.content.rendered,
            post.title.rendered,
            analysis,
            inventory,
            post.meta ? { rank_math_focus_keyword: post.meta.rank_math_focus_keyword } : undefined,
            customInstructions + (searchData ? `\n\nDATOS ACTUALES DE BÚSQUEDA (USA ESTO PARA ENRIQUECER EL POST):\n${searchData}` : "")
        );

        return NextResponse.json(rewritten);
    } catch (error: any) {
        console.error("Rewrite error:", error);
        return NextResponse.json({ error: error.message || "Failed to rewrite post" }, { status: 500 });
    }
}
