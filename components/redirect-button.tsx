"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface RedirectButtonProps {
    postId: number;
    suggestedTarget?: string;
}

export function RedirectButton({ postId, suggestedTarget }: RedirectButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleRedirect = async () => {
        const target = suggestedTarget || prompt("¿A qué URL quieres redireccionar este post?");
        if (!target) return;

        if (confirm("¿Estás seguro? Esto eliminará el post de WordPress y registrará la redirección en la base de datos local.")) {
            setLoading(true);
            try {
                const res = await fetch(`/api/post/${postId}/redirect`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ targetUrl: target }),
                });

                if (!res.ok) throw new Error("Error en la redirección");

                window.location.href = "/";
            } catch (error) {
                console.error(error);
                alert("Error al procesar la redirección");
                setLoading(false);
            }
        }
    };

    return (
        <div className="flex-1 flex flex-col gap-2">
            <Button
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={handleRedirect}
                disabled={loading}
            >
                {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <AlertTriangle className="mr-2 h-4 w-4" />
                )}
                Redirigir a {suggestedTarget ? "Sugerido" : "..."}
            </Button>
            {suggestedTarget && (
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest text-center">
                    Sugerido: {suggestedTarget}
                </p>
            )}
        </div>
    );
}
