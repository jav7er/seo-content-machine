#!/bin/bash
# scripts/prepare-cpanel.sh
# Este script organiza los archivos después del build para que funcionen en cPanel

echo "--- Iniciando preparación para cPanel ---"

# Crear carpeta de producción fuera de la carpeta de construcción para evitar errores de cPanel
PROD_DIR="$HOME/seo_production"
mkdir -p "$PROD_DIR"

echo "--- Iniciando preparación en $PROD_DIR ---"

# Copiar contenido de standalone
cp -r .next/standalone/* "$PROD_DIR/"
cp -r .next/standalone/.next "$PROD_DIR/"

# Copiar activos estáticos
echo "Copiando archivos estáticos..."
cp -r public "$PROD_DIR/" 2>/dev/null || true
mkdir -p "$PROD_DIR/.next/static"
cp -r .next/static/* "$PROD_DIR/.next/static/" 2>/dev/null || true

# Asegurar persistencia de datos
mkdir -p "$PROD_DIR/data"
if [ -f "data/content_audit.db" ]; then
    cp data/content_audit.db "$PROD_DIR/data/"
fi

echo "✅ Preparación completada. Configura el App Root en cPanel como: seo_production"
echo "Y el Startup file como: server.js"
