#!/bin/bash
# scripts/prepare-cpanel.sh
# Este script organiza los archivos después del build para que funcionen en cPanel

echo "--- Iniciando preparación para cPanel ---"

# Crear carpetas necesarias en standalone
mkdir -p .next/standalone/public
mkdir -p .next/standalone/.next/static

# Copiar activos estáticos
echo "Copiando archivos estáticos..."
cp -r public/* .next/standalone/public/ 2>/dev/null || true
cp -r .next/static/* .next/standalone/.next/static/ 2>/dev/null || true

# Copiar archivos de arranque y base de datos
echo "Copiando archivos de sistema y base de datos..."
cp app.js .next/standalone/
cp -r scripts .next/standalone/ 2>/dev/null || true
mkdir -p .next/standalone/data
cp data/content_audit.db .next/standalone/data/ 2>/dev/null || true

echo "✅ Preparación completada. Ahora cambia el App Root en cPanel a: carpeta_proyecto/.next/standalone"
