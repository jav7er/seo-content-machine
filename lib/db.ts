import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'content_audit.db');

// Ensure data directory exists
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(DB_PATH);

// Initialize schema
db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
        post_id INTEGER PRIMARY KEY,
        status TEXT,
        priority TEXT,
        score INTEGER,
        rewritten_at TEXT,
        redirection_url TEXT,
        last_audit_at TEXT,
        created_at TEXT,
        modified_at TEXT
    )
`);

export interface AuditRecord {
    post_id: number;
    status: string;
    priority: string;
    score: number;
    rewritten_at?: string;
    redirection_url?: string;
    last_audit_at: string;
    created_at?: string;
    modified_at?: string;
}

export const auditDb = {
    save: (record: AuditRecord) => {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO audit_logs 
            (post_id, status, priority, score, rewritten_at, redirection_url, last_audit_at, created_at, modified_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            record.post_id,
            record.status,
            record.priority,
            record.score,
            record.rewritten_at || null,
            record.redirection_url || null,
            record.last_audit_at,
            record.created_at || null,
            record.modified_at || null
        );
    },

    get: (postId: number): AuditRecord | undefined => {
        const stmt = db.prepare('SELECT * FROM audit_logs WHERE post_id = ?');
        return stmt.get(postId) as AuditRecord | undefined;
    },

    getAll: (): Record<number, AuditRecord> => {
        const stmt = db.prepare('SELECT * FROM audit_logs');
        const rows = stmt.all() as AuditRecord[];
        return rows.reduce((acc, row) => {
            acc[row.post_id] = row;
            return acc;
        }, {} as Record<number, AuditRecord>);
    }
};

export default db;
