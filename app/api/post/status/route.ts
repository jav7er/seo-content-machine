import { NextRequest, NextResponse } from 'next/server';
import { getAudit, saveAudit } from '@/lib/storage';

export async function POST(request: NextRequest) {
    try {
        const { postId, status } = await request.json();

        if (!postId || !status) {
            return NextResponse.json(
                { success: false, error: 'Missing postId or status' },
                { status: 400 }
            );
        }

        const existingAudit = await getAudit(postId);

        if (!existingAudit) {
            return NextResponse.json(
                { success: false, error: 'Audit not found for postId' },
                { status: 404 }
            );
        }

        await saveAudit({
            ...existingAudit,
            status: status,
            modifiedAt: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            message: 'Status updated successfully',
            postId,
            status
        });
    } catch (error) {
        console.error('Error updating manual status:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update status' },
            { status: 500 }
        );
    }
}
