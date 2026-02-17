"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PenTool, Loader2, Check, Upload, Pencil, Globe, AlertTriangle, Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";

interface RewriteButtonProps {
    postId: number;
}

interface RewriteResult {
    title: string;
    slug: string;
    content: string;
    focus_keyword: string;
    meta_description: string;
    rank_math_title: string;
}

export function RewriteButton({ postId }: RewriteButtonProps) {
    const [loading, setLoading] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [published, setPublished] = useState(false);
    const [publishResult, setPublishResult] = useState<{ link?: string; message?: string; post?: any } | null>(null);
    const [result, setResult] = useState<RewriteResult | null>(null);
    const [editedTitle, setEditedTitle] = useState("");
    const [editedSlug, setEditedSlug] = useState("");
    const [editedContent, setEditedContent] = useState("");
    const [editedKeyword, setEditedKeyword] = useState("");
    const [editedMetaTitle, setEditedMetaTitle] = useState("");
    const [editedMetaDesc, setEditedMetaDesc] = useState("");
    const [customInstructions, setCustomInstructions] = useState("");

    const handleRewrite = async () => {
        setLoading(true);
        setPublished(false);
        setPublishResult(null);
        try {
            const res = await fetch(`/api/post/${postId}/rewrite`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "generate", customInstructions }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setResult(data);
            setEditedTitle(data.title || "");
            setEditedSlug(data.slug || "");
            setEditedContent(data.content || "");
            setEditedKeyword(data.focus_keyword || "");
            setEditedMetaTitle(data.rank_math_title || data.title || "");
            setEditedMetaDesc(data.meta_description || "");
        } catch (error: any) {
            console.error("Error rewriting:", error);
            alert("Error al reescribir: " + (error.message || "Error desconocido"));
        } finally {
            setLoading(false);
        }
    };

    const [showConfirm, setShowConfirm] = useState(false);

    const handlePublish = async () => {
        setPublishing(true);
        try {
            const res = await fetch(`/api/post/${postId}/rewrite`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "publish",
                    title: editedTitle,
                    slug: editedSlug,
                    content: editedContent,
                    focus_keyword: editedKeyword,
                    rank_math_title: editedMetaTitle,
                    meta_description: editedMetaDesc,
                }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setPublished(true);
            setPublishResult(data);
        } catch (error: any) {
            console.error("Error publishing:", error);
            alert("Error al publicar: " + (error.message || "Error desconocido"));
        } finally {
            setPublishing(false);
            setShowConfirm(false);
        }
    };

    const generateSlugFromTitle = (title: string) => {
        return title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="flex-1 bg-orange-600 hover:bg-orange-700">
                    <PenTool className="mr-2 h-4 w-4" />
                    Reescribir con IA
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <PenTool className="h-5 w-5 text-orange-600" />
                        Reescritura con IA + Rank Math SEO
                    </DialogTitle>
                    <DialogDescription>
                        La IA generará contenido optimizado incluyendo Focus Keyword, Meta Title y Meta Description para Rank Math.
                    </DialogDescription>
                </DialogHeader>

                {!result ? (
                    <div className="flex flex-col items-center justify-center p-12 space-y-4">
                        {loading ? (
                            <>
                                <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
                                <p className="text-sm text-slate-500 italic">
                                    Analizando métricas SEO y reescribiendo contenido...
                                </p>
                                <p className="text-xs text-slate-400">
                                    Esto puede tomar 30-60 segundos
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="space-y-4 w-full">
                                    <div className="text-center space-y-2 mb-4">
                                        <Pencil className="h-12 w-12 text-orange-300 mx-auto" />
                                        <p className="text-sm text-slate-600">
                                            La IA analizará el rendimiento actual y generará una versión optimizada con campos de Rank Math.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Instrucciones adicionales para la IA (opcional)</Label>
                                        <textarea
                                            value={customInstructions}
                                            onChange={(e) => setCustomInstructions(e.target.value)}
                                            className="w-full p-3 text-sm border rounded-lg bg-slate-50 min-h-[80px]"
                                            placeholder="Ej: 'Usa un tono más informal', 'Enfócate más en los beneficios del producto X'..."
                                        />
                                    </div>
                                    <Button
                                        onClick={handleRewrite}
                                        size="lg"
                                        className="bg-orange-600 hover:bg-orange-700 w-full"
                                    >
                                        <PenTool className="mr-2 h-4 w-4" />
                                        Generar Reescritura
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                ) : published ? (
                    <div className="flex flex-col items-center justify-center p-12 space-y-4">
                        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                            <Check className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-green-700">¡Publicado Exitosamente!</h3>
                        <p className="text-sm text-slate-600 text-center">
                            {publishResult?.message || "El artículo ha sido actualizado en WordPress."}
                        </p>
                        {publishResult?.post?.link && (
                            <a
                                href={publishResult.post.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
                            >
                                <Globe className="h-4 w-4" />
                                Ver artículo actualizado
                            </a>
                        )}
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* Rank Math SEO Section */}
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 space-y-4">
                            <h4 className="text-sm font-bold text-purple-800 flex items-center gap-2">
                                <Search className="h-4 w-4" />
                                Rank Math SEO
                            </h4>

                            {/* Focus Keyword */}
                            <div className="space-y-1">
                                <Label htmlFor="focus-kw" className="text-xs font-semibold text-purple-700">
                                    🎯 Focus Keyword (Long-tail)
                                </Label>
                                <Input
                                    id="focus-kw"
                                    value={editedKeyword}
                                    onChange={(e) => setEditedKeyword(e.target.value)}
                                    className="bg-white border-purple-200 font-medium text-purple-900"
                                    placeholder="keyword long tail principal"
                                />
                            </div>

                            {/* Meta Title */}
                            <div className="space-y-1">
                                <Label htmlFor="meta-title" className="text-xs font-semibold text-purple-700">
                                    Meta Title
                                </Label>
                                <Input
                                    id="meta-title"
                                    value={editedMetaTitle}
                                    onChange={(e) => setEditedMetaTitle(e.target.value)}
                                    className="bg-white border-purple-200"
                                />
                                <p className="text-[10px] text-purple-500">
                                    {editedMetaTitle.length}/60 caracteres
                                    {editedMetaTitle.length > 60 && <span className="text-red-500 font-bold"> ⚠ Demasiado largo</span>}
                                </p>
                            </div>

                            {/* Meta Description */}
                            <div className="space-y-1">
                                <Label htmlFor="meta-desc" className="text-xs font-semibold text-purple-700">
                                    Meta Description
                                </Label>
                                <textarea
                                    id="meta-desc"
                                    value={editedMetaDesc}
                                    onChange={(e) => setEditedMetaDesc(e.target.value)}
                                    className="w-full p-2 text-sm border border-purple-200 rounded bg-white resize-none"
                                    rows={2}
                                />
                                <p className="text-[10px] text-purple-500">
                                    {editedMetaDesc.length}/160 caracteres
                                    {editedMetaDesc.length > 160 && <span className="text-red-500 font-bold"> ⚠ Demasiado largo</span>}
                                </p>
                            </div>
                        </div>

                        <Separator />

                        {/* Editable Title */}
                        <div className="space-y-2">
                            <Label htmlFor="rewrite-title" className="text-sm font-semibold flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px]">H1</Badge>
                                Título del Artículo
                            </Label>
                            <Input
                                id="rewrite-title"
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                                className="text-base font-medium"
                            />
                            <p className="text-[11px] text-slate-400">{editedTitle.length} caracteres</p>
                        </div>

                        {/* Editable Slug */}
                        <div className="space-y-2">
                            <Label htmlFor="rewrite-slug" className="text-sm font-semibold flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px]">URL</Badge>
                                Slug
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    id="rewrite-slug"
                                    value={editedSlug}
                                    onChange={(e) => setEditedSlug(e.target.value)}
                                    className="font-mono text-sm"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditedSlug(generateSlugFromTitle(editedTitle))}
                                    title="Generar slug desde título"
                                >
                                    Auto
                                </Button>
                            </div>
                            <p className="text-[11px] text-slate-400">
                                URL final: /{editedSlug}/
                            </p>
                        </div>

                        <Separator />

                        {/* Content Preview */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Vista previa del contenido
                            </Label>
                            <div
                                className="prose prose-sm max-w-none text-slate-700 p-4 bg-white border rounded-lg max-h-[400px] overflow-y-auto"
                                dangerouslySetInnerHTML={{ __html: editedContent }}
                            />
                        </div>

                        {/* Raw HTML Editor */}
                        <details className="border rounded-lg">
                            <summary className="p-3 cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-900">
                                ✏️ Editar HTML directamente
                            </summary>
                            <div className="p-3 pt-0">
                                <textarea
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    className="w-full h-64 font-mono text-xs p-3 border rounded bg-slate-50 resize-y"
                                    spellCheck={false}
                                />
                            </div>
                        </details>

                        <Separator />

                        {/* Actions */}
                        <Alert className="border-orange-200 bg-orange-50">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <AlertTitle className="text-sm font-medium text-orange-800">Antes de publicar</AlertTitle>
                            <AlertDescription className="text-xs text-orange-700">
                                Se actualizará directamente en WordPress: Título, Slug, Contenido, Focus Keyword, Meta Title y Meta Description de Rank Math.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2 px-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">Ajustes tras la reescritura</Label>
                            <textarea
                                value={customInstructions}
                                onChange={(e) => setCustomInstructions(e.target.value)}
                                className="w-full p-3 text-sm border rounded-lg bg-orange-50/50 min-h-[60px]"
                                placeholder="¿Quieres cambios específicos? Indícalos aquí y pulsa Regenerar..."
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 bg-white"
                                onClick={handleRewrite}
                                disabled={loading || publishing}
                            >
                                {loading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <PenTool className="mr-2 h-4 w-4" />
                                )}
                                Regenerar con cambios
                            </Button>

                            {!showConfirm ? (
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={() => setShowConfirm(true)}
                                    disabled={publishing}
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Publicar en WordPress
                                </Button>
                            ) : (
                                <div className="flex-1 flex gap-2">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setShowConfirm(false)}
                                        disabled={publishing}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        className="flex-1 bg-green-700 hover:bg-green-800"
                                        onClick={handlePublish}
                                        disabled={publishing}
                                    >
                                        {publishing ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Check className="mr-2 h-4 w-4" />
                                        )}
                                        Confirmar Publicación
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog >
    );
}
