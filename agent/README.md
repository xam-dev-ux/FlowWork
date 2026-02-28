# FlowWork Agent

AI agent para monitorear el contrato FlowWork en Base L2 y procesar intents con Claude AI.

## 🚂 Despliegue en Railway

### Opción 1: Desde el Dashboard de Railway (Recomendado)

1. Ve a https://railway.app y crea una cuenta
2. Click en "New Project" → "Deploy from GitHub repo"
3. Selecciona el repositorio `xam-dev-ux/FlowWork`
4. En configuración:
   - **Root Directory:** `agent`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

5. Configura las variables de entorno:

```env
# Base Network
BASE_RPC=https://mainnet.base.org
CONTRACT_ADDRESS=0x6505231B85c760a9DCBE827315431c95e8c12e58

# Claude API (opcional - el agente funciona sin esto usando fallback)
ANTHROPIC_API_KEY=tu_api_key_aqui
CLAUDE_MODEL=claude-3-7-haiku-20250219
CLAUDE_MAX_TOKENS=16000
CLAUDE_TEMPERATURE=0.2

# Private key del agente (IMPORTANTE: usa una wallet dedicada)
PRIVATE_KEY=0xtu_private_key_aqui

# XMTP (opcional)
XMTP_WALLET_KEY=0xtu_private_key_aqui
XMTP_DB_ENCRYPTION_KEY=una_clave_aleatoria_segura
XMTP_ENV=production
```

6. Click en "Deploy"

### Opción 2: Desde CLI

```bash
# Instala Railway CLI
npm install -g @railway/cli

# Login
railway login

# Desde el directorio agent/
cd agent

# Inicializa proyecto
railway init

# Configura variables de entorno
railway variables set BASE_RPC=https://mainnet.base.org
railway variables set CONTRACT_ADDRESS=0x6505231B85c760a9DCBE827315431c95e8c12e58
railway variables set PRIVATE_KEY=tu_private_key

# Despliega
railway up

# Ver logs
railway logs
```

## 📊 Verificar Deployment

Una vez desplegado, puedes ver los logs para confirmar que está corriendo:

```bash
railway logs
```

Deberías ver:
```
FlowWork Agent initialized
Monitoring contract: 0x6505231B85c760a9DCBE827315431c95e8c12e58
✅ Agent is running!
📡 Listening for contract events on Base L2
```

## 🔐 Seguridad

**IMPORTANTE:**
- Nunca uses tu private key principal
- Crea una wallet dedicada solo para el agente
- El agente solo necesita ETH para gas (muy poco)
- No necesita USDC ni otros tokens

## 🎯 Funcionalidades

El agente monitorea estos eventos del contrato:
- ✅ TaskCreated - Nueva tarea creada
- 👤 AgentAssigned - Agente asignado a tarea
- 📦 TaskDelivered - Tarea entregada
- ✅ TaskApproved - Tarea aprobada y pagada
- ⚠️ DisputeOpened - Disputa iniciada

## 🧪 Testing Local

```bash
# Instala dependencias
npm install

# Crea archivo .env con tus variables
cp .env.example .env

# Edita .env con tus claves

# Ejecuta
npm start
```

## 🔧 Troubleshooting

### Error: "Could not resolve authentication method"
- Verifica que ANTHROPIC_API_KEY esté configurado
- El agente funcionará con el fallback parser si no hay API key

### Error: "filter not found"
- Normal con RPC públicos de Base
- Considera usar Alchemy o Infura para mejor estabilidad

### El agente no detecta eventos
- Verifica que CONTRACT_ADDRESS sea correcto
- Confirma que BASE_RPC esté respondiendo
- Revisa los logs para errores de conexión

## 📚 Documentación

- [Railway Docs](https://docs.railway.app)
- [Base RPC](https://docs.base.org/network-information)
- [Claude API](https://docs.anthropic.com)
