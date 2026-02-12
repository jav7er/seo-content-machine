import { NextResponse } from "next/server";
import { fetchCategories, fetchMedia } from "@/lib/wordpress";

export async function GET() {
    try {
        const [categories, media] = await Promise.all([
            fetchCategories(),
            fetchMedia()
        ]);
        return NextResponse.json({ categories, media });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
