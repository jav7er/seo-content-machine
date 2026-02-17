import { supabase } from "./db";

export interface AuditRecord {
  id?: number;
  postId: number;
  lastAuditDate: string;
  recommendation: string;
  priority: string;
  score: number;
  createdAt: string;
  modifiedAt: string;
  redirectionUrl?: string;
  previousUrl?: string;
  status?: string;
  keywords?: string[];
  title?: string;
  link?: string;
}

export async function saveAudit(record: AuditRecord): Promise<AuditRecord> {
  const { data, error } = await supabase
    .from("audits")
    .upsert({ ...record, id: record.postId }, { onConflict: "postId" })
    .select();

  if (error) {
    console.error("Error saving audit:", error);
    throw error;
  }
  return data[0];
}

export async function getAudits(): Promise<Record<number, AuditRecord>> {
  const { data, error } = await supabase.from("audits").select("*");

  if (error) {
    console.error("Error fetching audits:", error);
    throw error;
  }

  const audits: Record<number, AuditRecord> = {};
  for (const record of data) {
    audits[record.postId] = record;
  }
  return audits;
}

export async function getAudit(postId: number): Promise<AuditRecord | null> {
  const { data, error } = await supabase
    .from("audits")
    .select("*")
    .eq("postId", postId)
    .single();

  if (error && error.code !== "PGRST116") { // PGRST116 means no rows found
    console.error("Error fetching single audit:", error);
    throw error;
  }

  return data || null;
}

export async function deleteAudit(postId: number): Promise<void> {
  const { error } = await supabase
    .from("audits")
    .delete()
    .eq("postId", postId);

  if (error) {
    console.error("Error deleting audit:", error);
    throw error;
  }
}
