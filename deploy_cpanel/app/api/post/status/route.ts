import { NextRequest, NextResponse } from 'next/server';
import { updateManualStatus } from '@/lib/storage';

export async function POST(request: NextRequest) {
    try {
        const { postId, status } = await request.json();

        if (!postId || !status) {
            return NextResponse.json(
                { success: false, error: 'Missing postId or status' },
                { status: 400 }
            );
        }

        await updateManualStatus(postId, status);

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