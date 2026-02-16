import { fetchPosts } from "@/lib/wordpress";
import { fetchBulkGSCData } from "@/lib/gsc";
import { fetchBulkGA4Data } from "@/lib/ga4";
import { getAudits } from "@/lib/storage";
import { DashboardClient } from "@/components/DashboardClient";

export const revalidate = 3600;

export default async function DashboardPage(props: { searchParams: Promise<{ range?: string }> }) {
  const searchParams = await props.searchParams;
  const range = searchParams.range || "30";
  const days = parseInt(range);
  
  const gscEndDate = new Date().toISOString().split("T")[0];
  const gscStartDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const siteUrl = process.env.GSC_SITE_URL || "sc-domain:newemage.com.mx";
  const propertyId = process.env.GA4_PROPERTY_ID || "";

  // Map range to GA4 format
  const ga4StartDate = `${range}daysAgo`;

  let initialData: { posts: any[], total: number } = { posts: [], total: 0 };
  let gscBulk: Record<string, any> = {};
  let ga4Bulk: Record<string, any> = {};
  let storedAudits: Record<number, any> = {};

  try {
    const [postsRes, gscRes, ga4Res, auditsRes] = await Promise.all([
      fetchPosts(1, 100),
      fetchBulkGSCData(siteUrl, gscStartDate, gscEndDate),
      fetchBulkGA4Data(propertyId, ga4StartDate, "today"),
      getAudits()
    ]);

    initialData = postsRes;
    gscBulk = gscRes;
    ga4Bulk = ga4Res;
    storedAudits = auditsRes;

    // Si la API de WordPress falla pero tenemos auditorías guardadas, mostrar esos artículos
    if (initialData.posts.length === 0 && Object.keys(storedAudits).length > 0) {
      initialData.posts = Object.values(storedAudits).map(audit => ({
        id: audit.postId,
        title: { rendered: audit.previousUrl ? `Post #${audit.postId} (URL Original: ${audit.previousUrl})` : `Post #${audit.postId}` },
        link: audit.previousUrl || "#",
        date: audit.createdAt || new Date().toISOString(),
        modified: audit.modifiedAt || new Date().toISOString(),
        status: "publish",
        meta: { rank_math_focus_keyword: "" }
      }));
      initialData.total = initialData.posts.length;
    }
  } catch (e) {
    console.error("Error al obtener datos para el dashboard", e);
  }

  return (
    <DashboardClient
      initialData={initialData.posts}
      totalCount={initialData.total}
      gscBulk={gscBulk}
      ga4Bulk={ga4Bulk}
      storedAudits={storedAudits}
    />
  );
}
