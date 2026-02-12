"use client";

import * as React from "react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Eye, Search, ExternalLink, Calendar, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { Post } from "@/types/wordpress";
import { FilterState } from "./DashboardFilters";

interface PostsTableProps {
    initialPosts: Post[];
    totalCount: number;
    gscData?: Record<string, { clicks: number; impressions: number }>;
    ga4Data?: Record<string, { activeUsers: number; pageViews: number }>;
    storedAudits?: Record<number, any>;
    filters?: FilterState;
}

interface PostTableItem {
    id: number;
    title: string;
    link: string;
    date: Date;
    modified: Date;
    clicks: number;
    impressions: number;
    pageViews: number;
    focusKeyword: string;
    auditStatus: "Audited" | "Pending";
    rewrittenAt?: string;
    recommendation?: string;
    priority?: string;
    redirectionUrl?: string;
    manualStatus?: string;
}

export function PostsTable({ initialPosts, totalCount, gscData = {}, ga4Data = {}, storedAudits = {}, filters }: PostsTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [localAudits, setLocalAudits] = React.useState(storedAudits);

    const handleStatusChange = async (postId: number, status: string) => {
        try {
            await fetch('/api/post/status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ postId, status }),
            });
            setLocalAudits(prev => ({
                ...prev,
                [postId]: {
                    ...prev[postId],
                    manualStatus: status,
                    modifiedAt: new Date().toISOString()
                }
            }));
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const data = React.useMemo<PostTableItem[]>(() => {
        let filteredPosts = initialPosts.filter(p => p !== null).map((post) => {
            const url = post.link;
            let path = "/";
            try { path = new URL(url).pathname; } catch { }

            const audit = localAudits[post.id] || storedAudits[post.id];
            const meta = post.meta || {};
            const mStatus = audit?.manualStatus;
            const prevUrl = audit?.previousUrl;

            let gsc = { ...(gscData[url] || gscData[url.replace(/\/$/, "")] || { clicks: 0, impressions: 0 }) };
            let ga4 = { ...(ga4Data[path] || ga4Data[path.replace(/\/$/, "")] || { activeUsers: 0, pageViews: 0 }) };

            // Si hay una URL previa, sumar sus datos
            if (prevUrl) {
                const prevGsc = gscData[prevUrl] || gscData[prevUrl.replace(/\/$/, "")] || { clicks: 0, impressions: 0 };
                let prevPath = "/";
                try { prevPath = new URL(prevUrl).pathname; } catch { }
                const prevGa4 = ga4Data[prevPath] || ga4Data[prevPath.replace(/\/$/, "")] || { activeUsers: 0, pageViews: 0 };

                gsc.clicks += prevGsc.clicks;
                gsc.impressions += prevGsc.impressions;
                ga4.pageViews += prevGa4.pageViews;
            }

            const isAudited = mStatus === 'audited' || (audit && !mStatus && audit.recommendation !== 'pending');
            const isRewritten = mStatus === 'rewritten' || audit?.rewrittenAt;
            const isRedirected = mStatus === 'redirected' || audit?.redirectionUrl;

            return {
                id: post.id,
                title: post.title.rendered,
                link: post.link,
                date: new Date(post.date),
                modified: new Date(post.modified),
                clicks: gsc.clicks,
                impressions: gsc.impressions,
                pageViews: ga4.pageViews,
                focusKeyword: meta.rank_math_focus_keyword || "",
                auditStatus: (isAudited || isRewritten || isRedirected) ? "Audited" : "Pending" as "Audited" | "Pending",
                rewrittenAt: isRewritten ? (audit?.rewrittenAt || new Date().toISOString()) : undefined,
                recommendation: audit?.recommendation,
                priority: audit?.priority,
                redirectionUrl: isRedirected ? (audit?.redirectionUrl || '#') : undefined,
                manualStatus: mStatus
            };
        });

        // Aplicar filtros
        if (filters) {
            filteredPosts = filteredPosts.filter((post) => {
                // Búsqueda por título o keyword
                if (filters.search) {
                    const searchLower = filters.search.toLowerCase();
                    const titleMatch = post.title.toLowerCase().includes(searchLower);
                    const keywordMatch = post.focusKeyword.toLowerCase().includes(searchLower);
                    if (!titleMatch && !keywordMatch) return false;
                }

                // Estado de auditoría
                if (filters.auditStatus && filters.auditStatus !== 'all') {
                    switch (filters.auditStatus) {
                        case 'audited':
                            if (post.auditStatus !== "Audited") return false;
                            break;
                        case 'pending':
                            if (post.auditStatus !== "Pending") return false;
                            break;
                        case 'rewritten':
                            if (!post.rewrittenAt) return false;
                            break;
                        case 'redirected':
                            if (!post.redirectionUrl) return false;
                            break;
                    }
                }

                // Tiene clicks
                if (filters.hasClicks && filters.hasClicks !== 'all') {
                    if (filters.hasClicks === 'yes' && post.clicks === 0) return false;
                    if (filters.hasClicks === 'no' && post.clicks > 0) return false;
                }

                // Clicks mínimos
                if (filters.minClicks && post.clicks < parseInt(filters.minClicks)) return false;

                // Tiene impresiones
                if (filters.hasImpressions && filters.hasImpressions !== 'all') {
                    if (filters.hasImpressions === 'yes' && post.impressions === 0) return false;
                    if (filters.hasImpressions === 'no' && post.impressions > 0) return false;
                }

                // Impresiones mínimas
                if (filters.minImpressions && post.impressions < parseInt(filters.minImpressions)) return false;

                // Tiene keyword
                if (filters.hasKeyword && filters.hasKeyword !== 'all') {
                    const hasKeyword = post.focusKeyword && post.focusKeyword.trim() !== '';
                    if (filters.hasKeyword === 'yes' && !hasKeyword) return false;
                    if (filters.hasKeyword === 'no' && hasKeyword) return false;
                }

                return true;
            });

            // Ordenar
            if (filters.sortBy && filters.sortBy !== 'none') {
                filteredPosts.sort((a, b) => {
                    const [field, direction] = filters.sortBy.split('-');
                    const isAsc = direction === 'asc';
                    
                    switch (field) {
                        case 'clicks':
                            return isAsc ? a.clicks - b.clicks : b.clicks - a.clicks;
                        case 'impressions':
                            return isAsc ? a.impressions - b.impressions : b.impressions - a.impressions;
                        case 'pageviews':
                            return isAsc ? a.pageViews - b.pageViews : b.pageViews - a.pageViews;
                        case 'date':
                            return isAsc ? a.date.getTime() - b.date.getTime() : b.date.getTime() - a.date.getTime();
                        case 'modified':
                            return isAsc ? a.modified.getTime() - b.modified.getTime() : b.modified.getTime() - a.modified.getTime();
                        default:
                            return 0;
                    }
                });
            }
        }

        return filteredPosts;
    }, [initialPosts, gscData, ga4Data, storedAudits, filters, localAudits]);

    const columns: ColumnDef<PostTableItem>[] = [
        {
            accessorKey: "title",
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Título <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex flex-col gap-0.5 max-w-[250px]">
                    <div className="font-medium truncate" title={row.getValue("title")}>
                        {row.getValue("title")}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "focusKeyword",
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    <Search className="mr-1 h-3 w-3" /> Keyword <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const kw = row.getValue("focusKeyword") as string;
                return kw ? (
                    <Badge variant="secondary" className="text-[10px] font-mono max-w-[180px] truncate">
                        {kw}
                    </Badge>
                ) : (
                    <span className="text-[10px] text-slate-400 italic">Sin keyword</span>
                );
            },
        },
        {
            accessorKey: "clicks",
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Clicks <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const val = row.getValue("clicks") as number;
                return (
                    <div className={`text-center font-semibold ${val > 0 ? "text-green-700" : "text-slate-400"}`}>
                        {val}
                    </div>
                );
            },
        },
        {
            accessorKey: "impressions",
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Imp. <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const val = row.getValue("impressions") as number;
                return (
                    <div className={`text-center ${val > 0 ? "text-slate-700" : "text-slate-400"}`}>
                        {val.toLocaleString()}
                    </div>
                );
            },
        },
        {
            accessorKey: "pageViews",
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Vistas <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-center text-blue-600 font-medium">{row.getValue("pageViews")}</div>,
        },
        {
            accessorKey: "date",
            header: ({ column }) => (
                <Button variant="ghost" className="p-0" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Creado <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-[11px] font-mono text-slate-500">{(row.getValue("date") as Date).toLocaleDateString()}</div>,
        },
        {
            accessorKey: "modified",
            header: ({ column }) => (
                <Button variant="ghost" className="p-0" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Modificado <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-1 text-[11px] font-mono text-blue-600 font-medium">
                    <RefreshCcw className="h-2 w-2" /> {(row.getValue("modified") as Date).toLocaleDateString()}
                </div>
            ),
        },
        {
            accessorKey: "auditStatus",
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Estado <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const status = row.getValue("auditStatus") as string;
                const rewrittenAt = row.original.rewrittenAt;
                const rec = row.original.recommendation;
                const manualStatus = row.original.manualStatus;
                return (
                    <div className="flex flex-col gap-1.5">
                        <div className="flex gap-1">
                            {manualStatus && manualStatus !== 'none' ? (
                                <Badge variant="default" className="text-[9px] h-4 uppercase px-1 bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
                                    {manualStatus}
                                </Badge>
                            ) : (
                                <Badge variant={status === "Audited" ? "default" : "outline"} className="text-[9px] h-4 uppercase px-1">
                                    {status === "Audited" ? "Auditado" : "Pendiente"}
                                </Badge>
                            )}
                            {rewrittenAt && (
                                <Badge variant="secondary" className="text-[9px] h-4 uppercase px-1 bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                                    Reescrito
                                </Badge>
                            )}
                            {row.original.redirectionUrl && (
                                <Badge variant="destructive" className="text-[9px] h-4 uppercase px-1">
                                    Redirigido
                                </Badge>
                            )}
                        </div>
                        {rec && (
                            <span className="text-[10px] font-bold text-slate-500 leading-none">
                                {rec}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const post = row.original;
                const currentStatus = post.manualStatus || 'none';
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(post.id.toString())}>
                                Copiar ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs text-muted-foreground">Cambiar Estado</DropdownMenuLabel>
                            <div className="p-2">
                                <Select value={currentStatus} onValueChange={(value) => handleStatusChange(post.id, value)}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Sin estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sin estado</SelectItem>
                                        <SelectItem value="pending">Pendiente</SelectItem>
                                        <SelectItem value="audited">Auditado</SelectItem>
                                        <SelectItem value="rewritten">Reescrito</SelectItem>
                                        <SelectItem value="redirected">Redirigido</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DropdownMenuSeparator />
                            <Link href={`/post/${post.id}`}>
                                <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Auditar / Ver Detalle
                                </DropdownMenuItem>
                            </Link>
                            <a href={post.link} target="_blank" rel="noopener noreferrer">
                                <DropdownMenuItem>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Ver en Web
                                </DropdownMenuItem>
                            </a>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 font-bold" onClick={() => {
                                const target = prompt("¿A qué URL quieres redireccionar este post?");
                                if (target) {
                                    if (confirm("¿Estás seguro? Esto eliminará el post de WordPress y registrará la redirección.")) {
                                        fetch(`/api/post/${post.id}/redirect`, {
                                            method: "POST",
                                            body: JSON.stringify({ targetUrl: target })
                                        }).then(() => window.location.reload());
                                    }
                                }
                            }}>
                                <RefreshCcw className="mr-2 h-4 w-4" />
                                Redirigir y Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: { sorting },
        initialState: { pagination: { pageSize: 20 } },
    });

    return (
        <div className="rounded-md">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                Sin resultados disponibles.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <div className="flex items-center justify-between py-4 px-4 bg-slate-50 border-t">
                <div className="text-sm text-muted-foreground italic">
                    Mostrando {table.getRowModel().rows.length} de {data.length} artículos ({totalCount} total)
                </div>
                <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                        Anterior
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                        Siguiente
                    </Button>
                </div>
            </div>
        </div>
    );
}
