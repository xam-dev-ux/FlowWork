# 🚂 Guía de Deployment en Railway

## Preparación

Antes de empezar, necesitas:
- Una cuenta en Railway (https://railway.app)
- Una wallet dedicada para el agente (NO uses tu wallet principal)
- API key de Claude (opcional, funciona sin esto)

## Paso 1: Crear Proyecto en Railway

### Opción A: Desde el Dashboard (Más fácil)

1. Ve a https://railway.app
2. Click en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Conecta tu cuenta de GitHub si aún no lo has hecho
5. Selecciona el repo `xam-dev-ux/FlowWork`
6. Railway detectará automáticamente que es un proyecto Node.js

### Opción B: Desde CLI

```bash
# Instala Railway CLI
npm install -g @railway/cli

# Login
railway login

# En el directorio del proyecto
cd /home/xabier/basedev/FlowWork

# Crea nuevo proyecto
railway init

# Selecciona "Empty Project"
```

## Paso 2: Configurar el Servicio

### En el Dashboard:

1. Una vez creado el proyecto, click en "New Service"
2. Selecciona "GitHub Repo"
3. Elige `xam-dev-ux/FlowWork`
4. En "Settings" → "Service":
   - **Root Directory:** `agent`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Watch Paths:** `agent/**`

### Desde CLI:

```bash
# Navega al directorio del agente
cd agent

# Despliega
railway up

# Railway detectará automáticamente el package.json
```

## Paso 3: Configurar Variables de Entorno

### Variables Requeridas:

```env
BASE_RPC=https://mainnet.base.org
CONTRACT_ADDRESS=0x6505231B85c760a9DCBE827315431c95e8c12e58
PRIVATE_KEY=0xTU_PRIVATE_KEY_AQUI
```

### Variables Opcionales:

```env
# Claude API (si quieres usar AI, sino usa fallback)
ANTHROPIC_API_KEY=sk-ant-api03-...
CLAUDE_MODEL=claude-3-7-haiku-20250219
CLAUDE_MAX_TOKENS=16000
CLAUDE_TEMPERATURE=0.2

# XMTP (si quieres chat)
XMTP_WALLET_KEY=0xTU_PRIVATE_KEY_AQUI
XMTP_DB_ENCRYPTION_KEY=una_clave_segura_aleatoria
XMTP_ENV=production
```

### Cómo añadir variables:

**Dashboard:**
1. Click en tu servicio
2. Ve a "Variables"
3. Click "New Variable"
4. Añade cada variable

**CLI:**
```bash
railway variables set BASE_RPC=https://mainnet.base.org
railway variables set CONTRACT_ADDRESS=0x6505231B85c760a9DCBE827315431c95e8c12e58
railway variables set PRIVATE_KEY=0xtu_key
```

## Paso 4: Deploy

El deploy es automático una vez configurado. Railway hará:

1. `npm install` (instalar dependencias)
2. `npm start` (iniciar el agente)

## Paso 5: Verificar

### Ver Logs:

**Dashboard:**
- Click en tu servicio
- Ve a la pestaña "Logs"

**CLI:**
```bash
railway logs
```

### Logs esperados:

```
FlowWork Agent initialized
Monitoring contract: 0x6505231B85c760a9DCBE827315431c95e8c12e58
Starting FlowWork contract monitor...

🔍 Watching for events...

✅ Agent is running!
📡 Listening for contract events on Base L2
```

## 🔐 Seguridad - IMPORTANTE

### Private Key:

1. **NUNCA uses tu wallet principal**
2. Crea una wallet nueva solo para el agente:
   ```bash
   # Puedes crear una con cast (foundry)
   cast wallet new

   # O en JavaScript/Node
   node -e "console.log(require('ethers').Wallet.createRandom().privateKey)"
   ```
3. Envía solo un poco de ETH para gas (0.001 ETH es suficiente)
4. El agente NO necesita USDC ni otros tokens

### Claude API Key:

- Si no tienes créditos, el agente usará el fallback parser
- Funciona perfectamente sin Claude API

## 💰 Costos

- **Railway:** $5/mes plan Hobby (incluye $5 de crédito)
- **Gas en Base:** Muy bajo (~$0.01 por transacción)
- **Claude API:** Opcional, pay-as-you-go

## 🐛 Troubleshooting

### "Module not found"
```bash
# Asegúrate de que Root Directory está en "agent"
# Settings → Service → Root Directory: agent
```

### "Error: filter not found"
- Normal con RPC públicos
- Considera Alchemy RPC: https://alchemy.com/?r=base
- Actualiza `BASE_RPC` con tu endpoint de Alchemy

### "Could not resolve authentication method"
- Verifica que `ANTHROPIC_API_KEY` esté bien configurado
- O simplemente deja que use el fallback (funciona sin API)

### El agente se reinicia constantemente
- Revisa los logs para ver el error
- Verifica que `PRIVATE_KEY` sea válido
- Confirma que `CONTRACT_ADDRESS` sea correcto

## 🔄 Redeploy

**Auto-deploy desde GitHub:**
Railway redespliega automáticamente cuando haces push a main.

**Manual desde CLI:**
```bash
cd agent
railway up
```

## 📊 Monitoring

### Health Check:
El agente imprime eventos en los logs cada vez que detecta actividad en el contrato.

### Comandos útiles:
```bash
# Ver logs en tiempo real
railway logs --follow

# Ver estado del servicio
railway status

# Restart servicio
railway restart
```

## 🎯 Próximos Pasos

Una vez el agente esté corriendo:

1. Prueba crear una tarea desde el frontend
2. Verifica que el agente detecte el evento en los logs
3. (Opcional) Configura alertas en Railway
4. (Opcional) Añade un dominio custom

## 📚 Recursos

- [Railway Docs](https://docs.railway.app)
- [Base Network](https://docs.base.org)
- [FlowWork Contract](https://basescan.org/address/0x6505231B85c760a9DCBE827315431c95e8c12e58)
- [Anthropic API](https://docs.anthropic.com)
