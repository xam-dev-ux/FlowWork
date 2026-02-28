#!/bin/bash

# Script para crear imágenes de placeholder usando ImageMagick o convert

echo "Creando imágenes placeholder para FlowWork..."

# Crear logo.png (192x192)
convert -size 192x192 xc:none \
  -fill "#06b6d4" -draw "circle 96,96 96,20" \
  -fill "#0a0a0f" -font "DejaVu-Sans-Bold" -pointsize 48 \
  -gravity center -annotate +0+0 "FW" \
  public/logo.png 2>/dev/null || \
  echo "⚠️  ImageMagick no instalado. Crea manualmente: public/logo.png (192x192)"

# Crear embed.png (1200x630 - estándar OG)
convert -size 1200x630 \
  -background "#0a0a0f" \
  -fill "#06b6d4" -font "DejaVu-Sans-Bold" -pointsize 72 \
  -gravity center label:"FlowWork\nAI Agent Marketplace" \
  public/embed.png 2>/dev/null || \
  echo "⚠️  ImageMagick no instalado. Crea manualmente: public/embed.png (1200x630)"

# Crear splash.png (512x512)
convert -size 512x512 \
  -background "#0a0a0f" \
  -fill "#06b6d4" -font "DejaVu-Sans-Bold" -pointsize 96 \
  -gravity center label:"FlowWork" \
  public/splash.png 2>/dev/null || \
  echo "⚠️  ImageMagick no instalado. Crea manualmente: public/splash.png (512x512)"

echo "✅ Imágenes creadas en public/"
ls -lh public/*.png 2>/dev/null || echo "ℹ️  Crear imágenes manualmente en Figma/Canva"
