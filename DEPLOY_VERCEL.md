# 🔺 Guía de Deployment en Vercel (Frontend)

## Despliegue del Frontend FlowWork en Vercel

El frontend (React app) se despliega fácilmente en Vercel.

## Método 1: Desde el Dashboard de Vercel (Recomendado)

### Paso 1: Importar Proyecto

1. Ve a https://vercel.com
2. Click en "Add New..." → "Project"
3. Importa el repositorio `xam-dev-ux/FlowWork` desde GitHub
4. Vercel detectará automáticamente que es un proyecto Vite

### Paso 2: Configurar Proyecto

**Framework Preset:** Vite
**Root Directory:** `./` (raíz del proyecto)
**Build Command:** `npm run build`
**Output Directory:** `dist`

### Paso 3: Variables de Entorno

Añade estas variables:

```env
VITE_CONTRACT_ADDRESS=0x6505231B85c760a9DCBE827315431c95e8c12e58
VITE_BASE_RPC=https://mainnet.base.org
VITE_CHAIN_ID=8453
```

**Opcional (si usas Alchemy):**
```env
VITE_BASE_RPC=https://base-mainnet.g.alchemy.com/v2/TU_API_KEY
```

### Paso 4: Deploy

Click en "Deploy" - ¡Listo!

Tu app estará en: `https://flow-work-tu-nombre.vercel.app`

## Método 2: Desde CLI

```bash
# Instala Vercel CLI
npm install -g vercel

# En el directorio raíz del proyecto
cd /home/xabier/basedev/FlowWork

# Login
vercel login

# Deploy
vercel

# Sigue las instrucciones:
# - Set up and deploy? Y
# - Which scope? (tu cuenta)
# - Link to existing project? N
# - Project name? FlowWork
# - In which directory? ./
# - Override settings? N
```

### Configurar Variables desde CLI:

```bash
vercel env add VITE_CONTRACT_ADDRESS
# Pega: 0x6505231B85c760a9DCBE827315431c95e8c12e58

vercel env add VITE_BASE_RPC
# Pega: https://mainnet.base.org

vercel env add VITE_CHAIN_ID
# Pega: 8453
```

### Deploy a Producción:

```bash
vercel --prod
```

## Verificar Deployment

Una vez desplegado:

1. Abre la URL que te dio Vercel
2. Verifica que se vea el frontend correctamente
3. Conecta tu wallet (Coinbase Wallet o compatible)
4. Verifica que puedas ver tareas y crear nuevas

## Configuración de Dominio (Opcional)

### En el Dashboard:

1. Ve a tu proyecto en Vercel
2. Click en "Settings" → "Domains"
3. Añade tu dominio custom
4. Configura los DNS según las instrucciones

### Desde CLI:

```bash
vercel domains add tudominio.com
```

## Auto-Deploy desde GitHub

Vercel automáticamente:
- ✅ Despliega cada push a `main` a producción
- ✅ Crea preview deploys para cada PR
- ✅ Ejecuta builds en cada commit

Para desactivar auto-deploy:
1. Settings → Git
2. Desactiva "Production Branch"

## Optimizaciones

### Performance:

El proyecto ya incluye:
- ✅ Code splitting automático
- ✅ Lazy loading de componentes
- ✅ Minificación de assets
- ✅ Compression (gzip/brotli)

### Farcaster Integration:

El archivo `vercel.json` ya configura:
- ✅ SPA routing con rewrites
- ✅ Headers CORS para Farcaster
- ✅ Content-Type para .well-known/farcaster.json

## Monitoreo

### Ver Analytics:

1. Dashboard → Tu proyecto
2. Click en "Analytics"
3. Ve métricas de:
   - Page views
   - Top pages
   - Countries
   - Devices

### Ver Logs:

1. Dashboard → Tu proyecto
2. Click en "Logs"
3. Filtra por:
   - Runtime logs
   - Build logs
   - Edge logs

## Troubleshooting

### Build falla con "Module not found"

```bash
# Asegúrate de que node_modules esté limpio
rm -rf node_modules package-lock.json
npm install
vercel --prod
```

### Variables de entorno no se aplican

- Vercel require el prefijo `VITE_` para variables de Vite
- Después de cambiar variables, haz un redeploy:
  ```bash
  vercel --prod --force
  ```

### La wallet no se conecta

- Verifica que `VITE_CHAIN_ID=8453` (Base mainnet)
- Confirma que `VITE_CONTRACT_ADDRESS` sea correcto
- Revisa la consola del navegador para errores

### Farcaster frame no funciona

- Verifica que `public/.well-known/farcaster.json` exista
- Confirma que `vercel.json` tenga los headers correctos
- Testea en: https://warpcast.com/~/developers/frames

## 💰 Costos

**Vercel Hobby Plan:**
- ✅ Gratis para proyectos personales
- ✅ Bandwidth ilimitado
- ✅ SSL automático
- ✅ 100GB bandwidth/mes

**Pro Plan ($20/mes):**
- Analytics avanzados
- Más bandwidth
- Prioridad en builds

## 🎯 Resultado Final

Una vez desplegado tendrás:

- 🌐 Frontend en Vercel: `https://tu-proyecto.vercel.app`
- 🤖 Agent en Railway: monitoreando el contrato
- 📱 Farcaster Mini App: funcionando en Warpcast
- 💎 Smart Contract: en Base mainnet

## 📚 Recursos

- [Vercel Docs](https://vercel.com/docs)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)
- [Base Network](https://docs.base.org)
