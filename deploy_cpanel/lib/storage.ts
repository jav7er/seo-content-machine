import { auditDb, AuditRecord } from './db';

export interface AuditLog {
    postId: number;
    lastAuditDate: string;
    recommendation: string;
    priority: string;
    score: number;
    rewrittenAt?: string;
    redirectionUrl?: string;
    createdAt?: string;
    modifiedAt?: string;
    manualStatus?: string;
    previousUrl?: string;
}

export async function saveAudit(audit: AuditLog) {
    auditDb.save({
        post_id: audit.postId,
        status: audit.recommendation,
        priority: audit.priority,
        score: audit.score,
        rewritten_at: audit.rewrittenAt,
        redirection_url: audit.redirectionUrl,
        last_audit_at: audit.lastAuditDate,
        created_at: audit.createdAt,
        modified_at: audit.modifiedAt,
        manual_status: audit.manualStatus,
        previous_url: audit.previousUrl
    });
}

export async function getAudits(): Promise<Record<number, AuditLog>> {
    const records = auditDb.getAll();
    const result: Record<number, AuditLog> = {};

    for (const [id, record] of Object.entries(records)) {
        result[Number(id)] = {
            postId: record.post_id,
            lastAuditDate: record.last_audit_at,
            recommendation: record.status,
            priority: record.priority,
            score: record.score,
            rewrittenAt: record.rewritten_at,
            redirectionUrl: record.redirection_url,
            createdAt: record.created_at,
            modifiedAt: record.modified_at,
            manualStatus: record.manual_status,
            previousUrl: record.previous_url
        };
    }

    return result;
}

export async function updatePostRedirection(postId: number, redirectionUrl: string) {
    const existing = auditDb.get(postId);
    if (existing) {
        auditDb.save({
            ...existing,
            redirection_url: redirectionUrl
        });
    }
}

export async function updateManualStatus(postId: number, status: string) {
    const existing = auditDb.get(postId);
    if (existing) {
        auditDb.save({
            ...existing,
            manual_status: status,
            modified_at: new Date().toISOString()
        });
    } else {
        auditDb.save({
            post_id: postId,
            status: 'pending',
            priority: 'medium',
            score: 0,
            last_audit_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            modified_at: new Date().toISOString(),
            manual_status: status
        });
    }
}
