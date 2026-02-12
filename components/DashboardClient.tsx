"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchPosts } from "@/lib/wordpress";
import { fetchBulkGSCData } from "@/lib/gsc";
import { fetchBulkGA4Data } from "@/lib/ga4";
import { getAudits } from "@/lib/storage";
import { PostsTable } from "@/components/posts-table";
import { DashboardFilters, FilterState } from "./DashboardFilters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, FileText, MousePointerClick, RefreshCcw, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DashboardClient({ 
  initialData, 
  totalCount, 
  gscBulk, 
  ga4Bulk, 
  storedAudits 
}: {
  initialData: any[];
  totalCount: number;
  gscBulk: Record<string, any>;
  ga4Bulk: Record<string, any>;
  storedAudits: Record<number, any>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRange = searchParams.get('range') || '30';

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    auditStatus: 'all',
    hasClicks: 'all',
    minClicks: '',
    hasImpressions: 'all',
    minImpressions: '',
    hasKeyword: 'all',
    sortBy: 'none',
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  const handleRangeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', value);
    router.push(`/?${params.toString()}`);
  };

  const rangeLabels: Record<string, string> = {
    '30': '30 días',
    '60': '60 días',
    '180': '180 días',
    '360': '360 días'
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Panel de Auditoría</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-2 bg-white border rounded-md px-3 py-1 shadow-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-gray-600">Rango:</span>
            <Select value={currentRange} onValueChange={handleRangeChange}>
              <SelectTrigger className="h-8 w-[140px] border-none shadow-none focus:ring-0">
                <SelectValue placeholder="Seleccionar rango" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Últimos 30 días</SelectItem>
                <SelectItem value="60">Últimos 60 días</SelectItem>
                <SelectItem value="180">Últimos 180 días</SelectItem>
                <SelectItem value="360">Últimos 360 días</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refrescando...' : 'Refrescar'}
          </Button>
          <Link href="/post/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <FileText className="mr-2 h-4 w-4" />
              Nuevo Post (IA)
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">Analizados en el sitio</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks Totales ({rangeLabels[currentRange]})</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(gscBulk).reduce((sum: number, item: any) => sum + (item.clicks || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Datos de Search Console</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Blog ({rangeLabels[currentRange]})</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(ga4Bulk).reduce((sum: number, item: any) => sum + (item.activeUsers || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Usuarios activos detectados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auditorías Guardadas</CardTitle>
            <RefreshCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(storedAudits).length}</div>
            <p className="text-xs text-muted-foreground">Revisiones locales persistidas</p>
          </CardContent>
        </Card>
      </div>

      <DashboardFilters
        filters={filters}
        onFiltersChange={setFilters}
        resultCount={0} // Se actualizará después
        totalPosts={totalCount}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-7 border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle>Artículos del Blog</CardTitle>
          </CardHeader>
          <CardContent>
            <PostsTable
              initialPosts={initialData}
              totalCount={totalCount}
              gscData={gscBulk}
              ga4Data={ga4Bulk}
              storedAudits={storedAudits}
              filters={filters}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}