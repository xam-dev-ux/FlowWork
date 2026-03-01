# Desplegar Agente XMTP en Railway

Esta guía te ayudará a desplegar el agente XMTP de FlowWork en Railway junto con el agente autónomo existente.

## 📋 Opciones de Despliegue

### Opción 1: Dos Servicios Separados (Recomendado)

Ejecutar el agente autónomo y el agente XMTP como servicios independientes.

**Ventajas:**
- ✅ Logs separados y más fáciles de leer
- ✅ Cada servicio puede reiniciarse independientemente
- ✅ Escalado independiente
- ✅ Si uno falla, el otro sigue funcionando

### Opción 2: Un Solo Servicio

Ejecutar ambos agentes en el mismo servicio.

**Ventajas:**
- ✅ Un solo servicio = menos costo
- ✅ Configuración más simple

## 🚀 Opción 1: Dos Servicios Separados

### 1. Crear Nuevo Servicio en Railway

1. **Ve a tu proyecto de Railway**
   - https://railway.app/dashboard

2. **Agrega un nuevo servicio**
   - Click en "New Service" → "GitHub Repo"
   - Selecciona el mismo repositorio: `FlowWork`

3. **Configura el Root Directory**
   - En Settings → General
   - Root Directory: `/agent`

4. **Cambia el archivo de configuración**
   - En Settings → Deploy
   - Railway Config File: `railway-xmtp.json`

### 2. Configurar Variables de Entorno

En Settings → Variables, agrega las mismas variables que el agente autónomo:

```env
# Required
XMTP_WALLET_KEY=0x4307af80b8827ca5a049209d23e672d2cb6db58a8899c6649ab89959bd0f5da7
XMTP_DB_ENCRYPTION_KEY=a9F3kL2Qm7Zx1CwR5eD8V0S6T4YBHpN9
XMTP_ENV=production

# Contract
CONTRACT_ADDRESS=0x20E2d2E7a116492889BC7F22fb1Eb386F5ed6636
BASE_RPC=https://base-mainnet.public.blastapi.io

# Private Key
PRIVATE_KEY=0x4307af80b8827ca5a049209d23e672d2cb6db58a8899c6649ab89959bd0f5da7

# Optional
NEYNAR_API_KEY=
```

### 3. Desplegar

- Click en "Deploy"
- Railway automáticamente:
  1. Clona el repo
  2. Instala dependencias con nixpacks
  3. Ejecuta `npm run xmtp`
  4. Mantiene el servicio corriendo 24/7

### 4. Verificar

En los logs del servicio deberías ver:

```
╔══════════════════════════════════════════════╗
║     💬 FlowWork XMTP Chat Agent 💬          ║
╚══════════════════════════════════════════════╝

✅ XMTP Agent running!
🎯 Agent Address: 0x3571e1753fD012A26E6fD2eDcFedC39E2425FfE3
```

## 🔧 Opción 2: Un Solo Servicio

Si prefieres ejecutar ambos agentes en un solo servicio:

### 1. Crear script para ejecutar ambos

Ya creé el archivo `src/index-both.ts` que ejecuta ambos agentes.

### 2. Modificar railway.json

Cambia el `startCommand`:

```json
{
  "deploy": {
    "startCommand": "tsx src/index-both.ts"
  }
}
```

### 3. Redesplegar

Railway automáticamente detectará el cambio y redesplegará.

## 📊 Monitoreo

### Ver Logs en Tiempo Real

1. **Railway Dashboard**
   - Ve a tu servicio
   - Click en "View Logs"
   - Verás todos los logs en tiempo real

2. **Filtrar logs**
   ```
   # Solo mensajes recibidos
   📨

   # Solo errores
   ❌
   ```

### Métricas

Railway muestra automáticamente:
- CPU usage
- Memory usage
- Network
- Restart count

## 🔄 Actualizar el Agente

Cuando hagas cambios al código:

1. **Hacer commit y push**
   ```bash
   git add .
   git commit -m "Update XMTP agent"
   git push
   ```

2. **Railway automáticamente redesplegará**
   - Detecta el push a GitHub
   - Rebuild y redeploy automático
   - Zero downtime si usas dos servicios

## 🐛 Troubleshooting

### El agente no arranca

**Error: "Cannot find module"**
```bash
# Verifica que el Root Directory esté en /agent
Settings → General → Root Directory: /agent
```

**Error: "XMTP_WALLET_KEY not found"**
```bash
# Verifica las variables de entorno
Settings → Variables → Agregar todas las variables requeridas
```

### El agente se reinicia constantemente

**Check los logs:**
```bash
# Si ves errores de conexión
❌ Error: Connection timeout

# Solución: Verifica que BASE_RPC esté configurado correctamente
```

### No puedo conectarme al agente

**Verifica la dirección:**
```bash
# En los logs deberías ver
🎯 Agent Address: 0x3571e1753fD012A26E6fD2eDcFedC39E2425FfE3

# Usa esta dirección en Base App para chatear
```

## 💡 Tips

1. **Usa dos servicios** para mejor estabilidad
2. **Configura alertas** en Railway para cuando el servicio se caiga
3. **Revisa logs regularmente** para detectar problemas temprano
4. **Backup de la DB de XMTP**: Railway tiene volúmenes persistentes si los necesitas

## 📞 Soporte

- Railway Docs: https://docs.railway.app
- XMTP Docs: https://docs.xmtp.org
- FlowWork GitHub: Tu repo
