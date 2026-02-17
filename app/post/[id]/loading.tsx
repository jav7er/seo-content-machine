import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-6 bg-slate-50">
      <div className="relative">
        <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
        <div className="absolute inset-0 h-16 w-16 rounded-full border-8 border-blue-100 -z-10"></div>
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-slate-900">Analizando con IA</h2>
        <p className="text-slate-500 animate-pulse">
          Consultando Search Console, GA4 y procesando contenido...
        </p>
      </div>
    </div>
  );
}
