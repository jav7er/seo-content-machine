import { NextRequest, NextResponse } from "next/server";
import { deletePost } from "@/lib/wordpress";
import { getAudit, saveAudit } from "@/lib/storage";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: idString } = await params;
    const id = parseInt(idString);

    try {
        const { targetUrl } = await req.json();

        if (!targetUrl) {
            return NextResponse.json({ error: "Target URL is required for redirection" }, { status: 400 });
        }

        // 1. Delete post from WordPress (trashed)
        await deletePost(id);

        // 2. Register redirection in our internal DB (Supabase)
        const existingAudit = await getAudit(id);

        if (!existingAudit) {
            // Si no existe, creamos una auditoría mínima con la redirección
            return NextResponse.json(
                { success: false, error: "Audit not found for postId, cannot set redirection" },
                { status: 404 }
            );
        }

        await saveAudit({
            ...existingAudit,
            redirectionUrl: targetUrl,
            status: "redirected",
            modifiedAt: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            message: `Post ${id} eliminado y marcado para redirección a ${targetUrl}`
        });
    } catch (error: any) {
        console.error("Redirection error:", error);
        return NextResponse.json({ error: error.message || "Failed to redirect post" }, { status: 500 });
    }
}
