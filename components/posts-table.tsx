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
import Link from "next/link";
import { Post } from "@/types/wordpress";

interface PostsTableProps {
    initialPosts: Post[];
    totalCount: number;
    gscData?: Record<string, { clicks: number; impressions: number }>;
    ga4Data?: Record<string, { activeUsers: number; pageViews: number }>;
    storedAudits?: Record<number, any>;
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
}

export function PostsTable({ initialPosts, totalCount, gscData = {}, ga4Data = {}, storedAudits = {} }: PostsTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([]);

    const data = React.useMemo<PostTableItem[]>(() => {
        return initialPosts.map((post) => {
            const url = post.link;
            let path = "/";
            try { path = new URL(url).pathname; } catch { }

            const gsc = gscData[url] || gscData[url.replace(/\/$/, "")] || { clicks: 0, impressions: 0 };
            const ga4 = ga4Data[path] || ga4Data[path.replace(/\/$/, "")] || { activeUsers: 0, pageViews: 0 };
            const audit = storedAudits[post.id];
            const meta = post.meta || {};

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
                auditStatus: audit ? "Audited" : "Pending",
                rewrittenAt: audit?.rewrittenAt,
                recommendation: audit?.recommendation,
                priority: audit?.priority,
                redirectionUrl: audit?.redirectionUrl
            };
        });
    }, [initialPosts, gscData, ga4Data, storedAudits]);

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
                return (
                    <div className="flex flex-col gap-1.5">
                        <div className="flex gap-1">
                            <Badge variant={status === "Audited" ? "default" : "outline"} className="text-[9px] h-4 uppercase px-1">
                                {status === "Audited" ? "Auditado" : "Pendiente"}
                            </Badge>
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
