import { NextRequest, NextResponse } from "next/server";
import { generatePostPlan, generateFullPostContent } from "@/lib/ai";
import { createPost, fetchPostInventory } from "@/lib/wordpress";
import { fetchGSCData } from "@/lib/gsc";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action } = body;

        if (action === "plan") {
            const { topic } = body;
            if (!topic) return NextResponse.json({ error: "Focus Keyword / Tema is required" }, { status: 400 });

            // Fetch inventory and performance for Phase 1 Audit
            const [inventory, performance] = await Promise.all([
                fetchPostInventory(),
                fetchGSCData(process.env.GSC_SITE_URL || "", "2024-01-01", "today"),
            ]);

            const plan = await generatePostPlan(topic, inventory, performance);
            return NextResponse.json(plan);
        }

        if (action === "generate") {
            const { plan } = body;
            if (!plan) return NextResponse.json({ error: "Plan is required" }, { status: 400 });
            const content = await generateFullPostContent(plan);
            return NextResponse.json(content);
        }

        if (action === "publish") {
            const { title, content, slug, focus_keyword, rank_math_title, meta_description, categoryId, mediaId } = body;

            const postData: any = {
                title,
                content,
                slug,
                status: "publish",
                categories: categoryId ? [parseInt(categoryId)] : undefined,
                featured_media: mediaId ? parseInt(mediaId) : undefined,
                meta: {
                    rank_math_focus_keyword: focus_keyword,
                    rank_math_title: rank_math_title,
                    rank_math_description: meta_description
                }
            };

            const created = await createPost(postData);
            return NextResponse.json({ success: true, post: created });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error: any) {
        console.error("New post API error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
