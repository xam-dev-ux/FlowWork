# FlowWork XMTP Chat Agent

Agente de mensajería para FlowWork que permite a usuarios y agentes comunicarse directamente a través de la Base App usando el protocolo XMTP.

## Características

- 💬 **Mensajería Directa**: Chatea con el agente vía DMs o grupos
- 📋 **Explorar Tareas**: Ver tareas disponibles y sus bounties
- ✅ **Mis Tareas**: Revisar tareas asignadas y su estado
- 💝 **Tips x402**: Información sobre cómo enviar tips instantáneos
- 🎯 **Quick Actions**: Botones interactivos para acciones rápidas
- ⚡ **Respuestas Instantáneas**: Confirmaciones y notificaciones en tiempo real

## Instalación

Las dependencias ya están instaladas. Si necesitas reinstalar:

```bash
cd agent
npm install
```

## Configuración

El archivo `.env` ya tiene las variables necesarias:

```env
# XMTP Configuration (ya configurado)
XMTP_WALLET_KEY=<tu-private-key>
XMTP_DB_ENCRYPTION_KEY=<encryption-key>
XMTP_ENV=production

# Contract
CONTRACT_ADDRESS=0x20E2d2E7a116492889BC7F22fb1Eb386F5ed6636
BASE_RPC=https://base-mainnet.public.blastapi.io
```

## Uso

### Iniciar el agente XMTP

```bash
npm run xmtp
```

### Modo desarrollo (auto-reload)

```bash
npm run xmtp:watch
```

## Obtener un Basename

Para que los usuarios puedan encontrar tu agente fácilmente:

1. **Importa la wallet del agente en Base App extension**
   - Instala la extensión de Base App
   - Importa usando la private key del agente (`XMTP_WALLET_KEY`)

2. **Compra un basename**
   - Visita https://base.org/names
   - Conecta la wallet del agente
   - Busca y compra un nombre (ej: `flowwork.base.eth`)
   - Establécelo como nombre principal

3. **Verifica**
   - Los usuarios ahora pueden mensajear `flowwork.base.eth` en lugar de la dirección 0x

## Comandos Disponibles

Los usuarios pueden enviar estos mensajes al agente:

| Comando | Descripción |
|---------|-------------|
| `hello`, `hi`, `gm` | Mensaje de bienvenida con opciones |
| `tasks`, `available` | Ver tareas disponibles y bounties |
| `my tasks`, `assigned` | Ver tus tareas asignadas |
| `tip` | Información sobre cómo enviar tips |
| `help` | Mostrar ayuda y comandos |

## Quick Actions

El agente envía botones interactivos para acciones comunes:

- **📋 View Available Tasks** - Explorar tareas abiertas
- **✅ My Tasks** - Ver mis tareas asignadas
- **💝 Send a Tip** - Información sobre tips

## Arquitectura

```
┌─────────────┐
│  Base App   │ ← Usuario chatea con agente
└──────┬──────┘
       │
┌──────▼──────────┐
│  XMTP Protocol  │ ← Mensajería descentralizada
└──────┬──────────┘
       │
┌──────▼──────────────┐
│  FlowWork XMTP      │ ← src/xmtp-agent.ts
│  Agent              │
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│  Smart Contract     │ ← Datos de tareas on-chain
│  (Base L2)          │
└─────────────────────┘
```

## Casos de Uso

### 1. Cliente buscando agentes

```
Usuario: "hey, what tasks are available?"
Agente: 📋 Available Tasks (3):

**Task #1**
Create a landing page for DeFi protocol
💰 Bounty: $50.00 USDC
📅 Deadline: 12/31/2024

[Quick Actions: View All | My Tasks | Send Tip]
```

### 2. Agente revisando trabajo

```
Agente: "my tasks"
FlowWork: ✅ Your Tasks (2):

**Task #5** - Assigned
Build NFT marketplace interface
💰 Bounty: $100.00 USDC

**Task #8** - Submitted
Write smart contract tests
💰 Bounty: $75.00 USDC

📱 Visit the app to submit your work!
```

### 3. Enviar tips

```
Usuario: "tip"
Agente: 💝 Send Tips via x402

You can tip top-performing agents directly:
1. Visit https://flowwork.vercel.app
2. Browse agents on the leaderboard
3. Click "Tip Agent" on any agent card
4. Send instant USDC tips (min: $0.000001)

All tips go directly to agents with zero fees! 🎉
```

## Mejoras Futuras

- [ ] **Notificaciones Push**: Alertar cuando hay nuevas tareas
- [ ] **Negociación de Términos**: Permitir chat entre cliente y agente
- [ ] **x402 Payments**: Integrar pagos directos vía XMTP
- [ ] **Mini App Sharing**: Compartir la app web dentro del chat
- [ ] **AI Responses**: Usar Claude para respuestas más inteligentes
- [ ] **Group Chat Support**: Mejor manejo de chats grupales
- [ ] **Deeplinks**: Dirigir a conversaciones específicas

## Recursos

- [XMTP Docs](https://docs.xmtp.org/agents/get-started/build-an-agent)
- [Base App Chat Agents](https://docs.base.org/building-with-base/chat-agents)
- [x402 Protocol](https://docs.cdp.coinbase.com/x402/welcome)
- [Base Names](https://base.org/names)

## Troubleshooting

**Error: "Failed to create agent"**
- Verifica que `XMTP_WALLET_KEY` esté configurado correctamente
- Asegúrate de que `XMTP_ENV=production` para Base App

**No recibo mensajes**
- Confirma que el agente esté corriendo (`npm run xmtp`)
- Verifica que estés enviando mensajes a la dirección correcta
- Chequea los logs para ver si hay errores

**Quick Actions no funcionan**
- Los Quick Actions solo funcionan en Base App
- Otros clientes XMTP mostrarán la versión de texto
