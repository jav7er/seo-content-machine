import { NextRequest, NextResponse } from "next/server";
import { deletePost } from "@/lib/wordpress";
import { updatePostRedirection } from "@/lib/storage";

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

        // 2. Register redirection in our internal DB
        await updatePostRedirection(id, targetUrl);

        return NextResponse.json({
            success: true,
            message: `Post ${id} eliminado y marcado para redirección a ${targetUrl}`
        });
    } catch (error: any) {
        console.error("Redirection error:", error);
        return NextResponse.json({ error: error.message || "Failed to redirect post" }, { status: 500 });
    }
}
