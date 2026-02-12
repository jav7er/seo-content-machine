import { Suspense } from "react";
import { fetchPosts } from "@/lib/wordpress";
import { fetchBulkGSCData } from "@/lib/gsc";
import { fetchBulkGA4Data } from "@/lib/ga4";
import { getAudits } from "@/lib/storage";
import { PostsTable } from "@/components/posts-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, FileText, MousePointerClick, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const revalidate = 3600;

async function DashboardStats() {
  // Estos podrían ser sumatorios reales de los datos bulk en el futuro
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Posts</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">124</div>
          <p className="text-xs text-muted-foreground">Analizados en el sitio</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clicks Totales (30d)</CardTitle>
          <MousePointerClick className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">--</div>
          <p className="text-xs text-muted-foreground">Datos de Search Console</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Usuarios Blog (30d)</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">--</div>
          <p className="text-xs text-muted-foreground">Usuarios activos detectados</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Auditorías Guardadas</CardTitle>
          <RefreshCcw className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Real</div>
          <p className="text-xs text-muted-foreground">Revisiones locales persistidas</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function DashboardPage() {
  const gscEndDate = new Date().toISOString().split("T")[0];
  const gscStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const siteUrl = process.env.GSC_SITE_URL || "sc-domain:newemage.com.mx";
  const propertyId = process.env.GA4_PROPERTY_ID || "";

  let initialData: { posts: any[], total: number } = { posts: [], total: 0 };
  let gscBulk: Record<string, any> = {};
  let ga4Bulk: Record<string, any> = {};
  let storedAudits: Record<number, any> = {};

  try {
    const [postsRes, gscRes, ga4Res, auditsRes] = await Promise.all([
      fetchPosts(1, 100),
      fetchBulkGSCData(siteUrl, gscStartDate, gscEndDate),
      fetchBulkGA4Data(propertyId, "30daysAgo", "today"),
      getAudits()
    ]);

    initialData = postsRes;
    gscBulk = gscRes;
    ga4Bulk = ga4Res;
    storedAudits = auditsRes;
  } catch (e) {
    console.error("Error al obtener datos para el dashboard", e);
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Panel de Auditoría</h2>
        <div className="flex items-center space-x-4">
          <Link href="/post/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <FileText className="mr-2 h-4 w-4" />
              Nuevo Post (IA)
            </Button>
          </Link>
        </div>
      </div>
      <Suspense fallback={<div>Cargando estadísticas...</div>}>
        <DashboardStats />
      </Suspense>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-7 border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle>Artículos del Blog</CardTitle>
          </CardHeader>
          <CardContent>
            <PostsTable
              initialPosts={initialData.posts}
              totalCount={initialData.total}
              gscData={gscBulk}
              ga4Data={ga4Bulk}
              storedAudits={storedAudits}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
