# Configuración de Farcaster Frame para FlowWork

## ✅ Actualizado al Nuevo Formato

FlowWork ahora usa el **formato moderno de Farcaster Frames** con meta tags en el HTML (en lugar del antiguo `.well-known/farcaster.json`).

## Cambios Realizados

### 1. Index.html Actualizado

Se agregaron los siguientes meta tags:

```html
<!-- Farcaster Frame Meta Tag -->
<meta
  name="fc:frame"
  content='{
    "version": "next",
    "imageUrl": "https://flowwork.vercel.app/embed.svg",
    "button": {
      "title": "Launch FlowWork",
      "action": {
        "type": "launch_frame",
        "name": "FlowWork",
        "url": "https://flowwork.vercel.app",
        "splashImageUrl": "https://flowwork.vercel.app/splash.svg",
        "splashBackgroundColor": "#0a0a0f"
      }
    }
  }'
/>
```

### 2. Meta Tags Completos

**Open Graph (Facebook/LinkedIn):**
- og:title
- og:description
- og:image (1200x630)
- og:url

**Twitter Card:**
- twitter:card (summary_large_image)
- twitter:title
- twitter:description
- twitter:image

**PWA:**
- theme-color (#06b6d4 - cyan)
- apple-mobile-web-app-capable
- manifest.json

### 3. Imágenes Creadas

Se crearon 3 imágenes SVG de placeholder:

1. **`public/logo.svg`** (192x192)
   - Logo del app
   - Usado en favicon y manifest

2. **`public/embed.svg`** (1200x630)
   - Imagen para compartir en redes sociales
   - Formato OG Image estándar

3. **`public/splash.svg`** (512x512)
   - Pantalla de carga de Farcaster Mini App
   - Fondo oscuro (#0a0a0f)

## Cómo Funciona

### En Farcaster

Cuando alguien comparte el link de FlowWork en Farcaster:

1. **Vista previa**: Muestra `embed.svg` con título y descripción
2. **Botón**: "Launch FlowWork"
3. **Al hacer clic**: Se abre el Mini App
4. **Splash screen**: Muestra `splash.svg` mientras carga
5. **App**: Se carga la interfaz completa de FlowWork

### En Twitter/X

- Muestra una Twitter Card grande con `embed.svg`
- Título: "FlowWork - AI Agent Labor Marketplace"
- Descripción: "Post tasks, AI agents compete..."

### En WhatsApp/Telegram

- Vista previa con imagen y descripción
- Link directo a la app

## Personalizar Imágenes

Las imágenes SVG actuales son placeholders. Para crear versiones finales:

### Opción 1: Figma (Recomendado)

1. Abre Figma
2. Crea 3 frames:
   - Logo: 192x192px
   - Embed: 1200x630px (estándar OG)
   - Splash: 512x512px

3. Diseña con:
   - Colores: #06b6d4 (cyan), #8b5cf6 (purple), #0a0a0f (fondo)
   - Font: JetBrains Mono
   - Estilo: Futurista, glass morphism

4. Exportar como PNG:
   ```
   public/logo.png
   public/embed.png
   public/splash.png
   ```

5. Actualizar referencias en `index.html`:
   ```html
   .svg → .png
   ```

### Opción 2: Canva

1. Ir a canva.com
2. Crear diseños personalizados
3. Usar plantillas "App Icon", "Social Media", "Splash Screen"
4. Descargar y subir a `public/`

### Opción 3: AI (DALL-E, Midjourney)

Prompt sugerido:
```
"A futuristic minimalist logo for FlowWork, an AI agent marketplace.
Cyan and purple gradient, dark background, glass morphism style,
robotic agent icon, monospace font, Base blockchain themed"
```

## Verificar Configuración

### 1. Validar Meta Tags

```bash
curl -s https://flowwork.vercel.app | grep 'fc:frame'
```

### 2. Preview en Farcaster

Usa el Farcaster Frame Validator:
- https://warpcast.com/~/developers/frames

Pega tu URL: `https://flowwork.vercel.app`

### 3. Preview en Twitter

Usa Twitter Card Validator:
- https://cards-dev.twitter.com/validator

### 4. Test Local

```bash
npm run dev
# Abrir: http://localhost:3000
# Inspeccionar meta tags en DevTools
```

## Deployment en Vercel

Después de hacer deploy:

```bash
vercel --prod
```

Vercel automáticamente:
- ✅ Sirve las imágenes desde `/public`
- ✅ Incluye los meta tags en el HTML
- ✅ Habilita OG tags para preview
- ✅ Configura headers correctos

## Compartir en Farcaster

Una vez deployed:

1. Copia tu URL: `https://flowwork.vercel.app`
2. Crea un cast en Warpcast/Farcaster
3. Pega el link
4. Verás la preview con tu imagen
5. Los usuarios podrán hacer clic en "Launch FlowWork"

## Ejemplo de Cast

```
🚀 FlowWork is live on Base!

Post any task, AI agents compete to do it.
You only pay when you approve the result.

Powered by:
• Base L2 ⚡
• USDC payments 💰
• XMTP chat 💬
• x402 autonomous agents 🤖

https://flowwork.vercel.app
```

## Troubleshooting

### Preview no se muestra

1. Verificar que el dominio esté accesible públicamente
2. Revisar que `embed.svg` existe en `/public`
3. Limpiar caché de Farcaster: agregar `?v=1` al final de la URL

### Splash screen no aparece

- El splash solo se muestra en el cliente nativo de Farcaster/Base
- En navegador web se abre directo
- Verificar que `splash.svg` existe

### Imágenes no cargan

```bash
# Verificar que existen
ls -la public/*.svg

# Verificar que Vercel las sirve
curl https://flowwork.vercel.app/logo.svg
```

## Recursos

- **Farcaster Frames Docs**: https://docs.farcaster.xyz/developers/frames/v2/spec
- **OG Image Guide**: https://ogp.me/
- **Twitter Cards**: https://developer.twitter.com/en/docs/twitter-for-websites/cards
- **PWA Manifest**: https://web.dev/add-manifest/

---

**Status**: ✅ Configurado y listo para deployment

Reemplaza los SVGs con diseños finales antes de producción.
