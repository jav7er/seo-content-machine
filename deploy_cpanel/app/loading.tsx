import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-slate-50">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      <p className="text-sm font-medium text-slate-500 animate-pulse">
        Cargando datos del sitio...
      </p>
    </div>
  );
}
