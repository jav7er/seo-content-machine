"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Layout, FileText, Check, ArrowLeft, Image as ImageIcon, Search } from "lucide-react";
import Link from "next/link";
import { PostPlan } from "@/lib/ai";

export function NewPostFlow() {
    const router = useRouter();
    const [step, setStep] = useState<"topic" | "plan" | "generate" | "success">("topic");
    const [loading, setLoading] = useState(false);

    // Topic Step
    const [topic, setTopic] = useState("");

    // Plan Step
    const [plan, setPlan] = useState<PostPlan | null>(null);

    // Generate Step
    const [result, setResult] = useState<any>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [media, setMedia] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedMedia, setSelectedMedia] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        if (step === "generate") {
            fetch("/api/wordpress/data")
                .then(res => res.json())
                .then(data => {
                    setCategories(data.categories || []);
                    setMedia(data.media || []);
                });
        }
    }, [step]);

    const handleGeneratePlan = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/post/new", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "plan", topic }),
            });
            const data = await res.json();
            setPlan(data);
            setStep("plan");
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateContent = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/post/new", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "generate", plan }),
            });
            const data = await res.json();
            setResult(data);
            setStep("generate");
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/wordpress/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.id) {
                setMedia([data, ...media]);
                setSelectedMedia(data.id.toString());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setUploadingImage(false);
        }
    };

    const handlePublish = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/post/new", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "publish",
                    ...result,
                    categoryId: selectedCategory,
                    mediaId: selectedMedia
                }),
            });
            const data = await res.json();
            if (data.success) {
                setStep("success");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">Crear Nuevo Post con IA</h1>
            </div>

            {/* Stepper Visual */}
            <div className="flex justify-between items-center px-10">
                <div className={`flex flex-col items-center gap-2 ${step === "topic" ? "text-blue-600" : "text-gray-400"}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step === "topic" ? "border-blue-600 bg-blue-50" : "border-gray-300"}`}>1</div>
                    <span className="text-xs font-bold">Idea</span>
                </div>
                <div className="flex-1 h-px bg-gray-200 mx-4" />
                <div className={`flex flex-col items-center gap-2 ${step === "plan" ? "text-blue-600" : "text-gray-400"}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step === "plan" ? "border-blue-600 bg-blue-50" : "border-gray-300"}`}>2</div>
                    <span className="text-xs font-bold">Plan</span>
                </div>
                <div className="flex-1 h-px bg-gray-200 mx-4" />
                <div className={`flex flex-col items-center gap-2 ${step === "generate" ? "text-blue-600" : "text-gray-400"}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step === "generate" ? "border-blue-600 bg-blue-50" : "border-gray-300"}`}>3</div>
                    <span className="text-xs font-bold">Redacción</span>
                </div>
            </div>

            {step === "topic" && (
                <Card className="border-t-4 border-t-blue-500">
                    <CardHeader>
                        <CardTitle>Generar Nuevo Post (IA SEO)</CardTitle>
                        <CardDescription>Indica la Focus Keyword que quieres atacar. La IA realizará una auditoría contra el contenido actual antes de proceder.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="topic">Focus Keyword / Tema Propuesto</Label>
                            <Textarea
                                id="topic"
                                placeholder="Ej: Las tendencias de diseño web para 2024 en el mercado inmobiliario..."
                                value={topic}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTopic(e.target.value)}
                                className="min-h-[120px]"
                            />
                        </div>
                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            onClick={handleGeneratePlan}
                            disabled={!topic || loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Generar Propuesta SEO
                        </Button>
                    </CardContent>
                </Card>
            )}

            {step === "plan" && plan && (
                <Card className="border-t-4 border-t-purple-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Layout className="h-5 w-5 text-purple-600" />
                            Propuesta de Estructura SEO
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Phase 1 Report */}
                        <div className={`p-4 rounded-lg border-l-4 ${plan.audit.status === "VERDE" ? "bg-green-50 border-green-500" : plan.audit.status === "AMARILLO" ? "bg-yellow-50 border-yellow-500" : "bg-red-50 border-red-500"}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`px-2 py-0.5 rounded text-xs font-bold text-white ${plan.audit.status === "VERDE" ? "bg-green-600" : plan.audit.status === "AMARILLO" ? "bg-yellow-600" : "bg-red-600"}`}>
                                    FASE 1: {plan.audit.status}
                                </div>
                                <span className="text-sm font-bold text-slate-700">{plan.audit.recommendation}</span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{plan.audit.reasoning}</p>
                        </div>

                        {plan.audit.status !== "ROJO" && (
                            <>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-purple-700 font-bold">🎯 Focus Keyword Sugerida</Label>
                                        <Input
                                            value={plan.refined_keyword || plan.focus_keyword}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlan({ ...plan, refined_keyword: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-purple-700 font-bold">📝 Descripción del enfoque</Label>
                                        <Textarea
                                            value={plan.description}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPlan({ ...plan, description: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="font-bold">Jerarquía de Contenido</Label>
                                    <div className="space-y-2 border rounded-lg p-4 bg-gray-50">
                                        {plan.structure.map((item, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <div className="w-10 text-xs font-mono text-gray-500 mt-2 uppercase">{item.tag}</div>
                                                <Input
                                                    value={item.text}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                        const newStruct = [...plan.structure];
                                                        newStruct[idx].text = e.target.value;
                                                        setPlan({ ...plan, structure: newStruct });
                                                    }}
                                                    className="bg-white"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setStep("topic")}>Atrás</Button>
                            <Button
                                className="flex-1 bg-purple-600 hover:bg-purple-700"
                                onClick={handleGenerateContent}
                                disabled={loading || plan.audit.status === "ROJO"}
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                                {plan.audit.status === "ROJO" ? "Post Bloqueado (Riesgo SEO)" : "Redactar Post Completo"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === "generate" && result && (
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Previsualización del Contenido</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Título</Label>
                                    <Input value={result.title} onChange={(e) => setResult({ ...result, title: e.target.value })} />
                                </div>
                                <div className="prose prose-sm max-w-none border rounded-lg p-4 bg-white max-h-[500px] overflow-y-auto">
                                    <div dangerouslySetInnerHTML={{ __html: result.content }} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="h-fit">
                        <CardHeader>
                            <CardTitle className="text-lg">Configuración Final</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs uppercase font-bold text-gray-500">Categoría</Label>
                                <Select onValueChange={setSelectedCategory} value={selectedCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar categoría" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs uppercase font-bold text-gray-500">Imagen Destacada</Label>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleUploadImage}
                                                className="hidden"
                                                id="image-upload"
                                                disabled={uploadingImage}
                                            />
                                            <Label
                                                htmlFor="image-upload"
                                                className="flex items-center justify-center gap-2 h-10 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 text-xs font-medium text-slate-600"
                                            >
                                                {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                                                {uploadingImage ? "Subiendo..." : "Subir Nueva Imagen"}
                                            </Label>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto p-1 border rounded bg-slate-50/50">
                                        {media.map(m => (
                                            <div
                                                key={m.id}
                                                className={`relative cursor-pointer rounded overflow-hidden border-2 h-16 transition-all ${selectedMedia === m.id.toString() ? "border-blue-500 ring-2 ring-blue-500/20" : "border-transparent opacity-70 hover:opacity-100"}`}
                                                onClick={() => setSelectedMedia(m.id.toString())}
                                            >
                                                <img src={m.source_url} alt={m.title.rendered} className="w-full h-full object-cover" />
                                                {selectedMedia === m.id.toString() && (
                                                    <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                                                        <div className="bg-blue-500 rounded-full p-0.5">
                                                            <Check className="text-white h-3 w-3" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 space-y-3">
                                <div className="p-3 bg-purple-50 rounded text-[10px] space-y-1">
                                    <div className="font-bold flex items-center gap-1">
                                        <Search className="h-3 w-3" /> RANK MATH SEO
                                    </div>
                                    <p><strong>Meta Title:</strong> {result.rank_math_title}</p>
                                    <p className="line-clamp-2"><strong>Meta Desc:</strong> {result.meta_description}</p>
                                </div>

                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-bold"
                                    onClick={handlePublish}
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Publicar Ahora"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {step === "success" && (
                <Card className="text-center py-10 border-green-500 border-2">
                    <CardContent className="space-y-4 pt-6">
                        <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                            <Check className="h-10 w-10" />
                        </div>
                        <CardTitle className="text-2xl font-bold">¡Post Publicado con Éxito!</CardTitle>
                        <CardDescription>
                            El artículo ya está disponible en tu WordPress.
                        </CardDescription>
                        <div className="flex gap-4 justify-center pt-4">
                            <Button variant="outline" onClick={() => router.push("/")}>
                                Volver al Dashboard
                            </Button>
                            <Button onClick={() => window.location.reload()}>
                                Crear otro Post
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
