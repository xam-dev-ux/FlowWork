# Usar Ollama (IA Local Gratuita) en FlowWork

Ollama es una alternativa **100% gratuita** a OpenAI que corre completamente en tu máquina local.

## ¿Por qué Ollama?

✅ **Gratis** - sin API keys, sin costos
✅ **Privado** - tus datos nunca salen de tu máquina
✅ **Rápido** - respuestas en <1 segundo
✅ **Offline** - funciona sin internet
✅ **Modelos potentes** - Llama 3.2, Mistral, Gemma, etc.

## Instalación

### Linux / WSL

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### macOS

```bash
brew install ollama
```

### Windows

Descarga desde: https://ollama.com/download

## Configuración para FlowWork

### 1. Iniciar Ollama

```bash
ollama serve
```

Debería mostrar:
```
Listening on 127.0.0.1:11434
```

### 2. Descargar modelo (solo una vez)

```bash
# Llama 3.2 (recomendado, 2GB)
ollama pull llama3.2

# Alternativas:
# ollama pull mistral        # Mistral 7B
# ollama pull gemma2:2b      # Google Gemma (más pequeño)
# ollama pull qwen2.5:3b     # Qwen (más rápido)
```

### 3. Probar el modelo

```bash
ollama run llama3.2
```

Escribe algo y debería responder. Usa `/bye` para salir.

### 4. Actualizar el agente

Edita `agent/src/index.ts`:

```typescript
// ANTES (OpenAI - de pago)
import { parseIntent } from "./intentParser";

// DESPUÉS (Ollama - gratis)
import { parseIntent } from "./intentParserLocal";
```

### 5. Actualizar .env del agente

```env
# ANTES
OPENAI_API_KEY=sk-...  # ← ELIMINAR

# DESPUÉS
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

### 6. Reiniciar el agente

```bash
cd agent
npm start
```

## Uso

Ahora el agente procesará mensajes usando Ollama:

```
Usuario: "escribe copy para landing page, $25"
Ollama: → Parsea intent localmente
Agent: → Crea tarea en el contrato
```

## Comparación de Modelos

| Modelo | Tamaño | RAM | Velocidad | Calidad |
|--------|--------|-----|-----------|---------|
| llama3.2 | 2GB | 4GB | Media | Alta |
| mistral | 4GB | 8GB | Media | Muy alta |
| gemma2:2b | 1.5GB | 3GB | Rápida | Media |
| qwen2.5:3b | 2GB | 4GB | Muy rápida | Alta |

**Recomendación**: Empieza con `llama3.2`. Si tu máquina tiene 16GB+ RAM, usa `mistral`.

## Cambiar de Modelo

```bash
# Descargar nuevo modelo
ollama pull mistral

# Actualizar .env
OLLAMA_MODEL=mistral

# Reiniciar agente
```

## Fallback sin IA

El código incluye un **fallback inteligente** por si Ollama no está corriendo:

```typescript
// Si Ollama falla, usa reglas simples:
"escribe copy, $20" → create_task
"aprobar tarea 5" → approve_delivery
```

Funciona sin IA, pero con menos precisión.

## Optimización de Rendimiento

### Mantener modelo en memoria

```bash
# Precarga el modelo (más rápido)
ollama run llama3.2 &
```

### Ajustar configuración

Edita `intentParserLocal.ts`:

```typescript
{
  model: "llama3.2",
  stream: false,
  options: {
    temperature: 0,      // Más determinístico
    num_predict: 100,    // Respuestas más cortas
    top_k: 10,          // Más preciso
    top_p: 0.9
  }
}
```

## Solución de Problemas

### "Ollama no está corriendo"

```bash
# Verificar si está corriendo
curl http://localhost:11434

# Si no responde, iniciar:
ollama serve
```

### "Modelo no encontrado"

```bash
# Listar modelos instalados
ollama list

# Instalar el modelo
ollama pull llama3.2
```

### "Muy lento"

Prueba un modelo más pequeño:

```bash
ollama pull gemma2:2b
```

O aumenta la RAM asignada:

```bash
OLLAMA_MAX_LOADED_MODELS=1 ollama serve
```

### "Respuestas incorrectas"

Mejora el prompt en `intentParserLocal.ts`:

```typescript
const systemPrompt = `Eres un experto en análisis de intenciones...
[más ejemplos]
[más contexto]`;
```

## Ejecutar como Servicio (Producción)

### Linux (systemd)

```bash
sudo nano /etc/systemd/system/ollama.service
```

```ini
[Unit]
Description=Ollama Service
After=network.target

[Service]
Type=simple
User=YOUR_USER
ExecStart=/usr/local/bin/ollama serve
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable ollama
sudo systemctl start ollama
```

### Docker

```dockerfile
FROM ollama/ollama:latest

# Descargar modelo en build
RUN ollama pull llama3.2

EXPOSE 11434
CMD ["serve"]
```

## Ventajas vs OpenAI

| Aspecto | Ollama | OpenAI |
|---------|--------|--------|
| **Costo** | $0 | ~$0.002/request |
| **Privacidad** | 100% local | Envía datos a OpenAI |
| **Latencia** | <1s | 1-3s |
| **Internet** | No necesario | Requerido |
| **Rate limits** | Sin límites | 3 req/min (free) |
| **Configuración** | 5 minutos | Instant (con API key) |

## Recursos

- **Documentación**: https://ollama.com/docs
- **Modelos**: https://ollama.com/library
- **GitHub**: https://github.com/ollama/ollama

## Ejemplos de Mensajes de Prueba

Prueba estos mensajes con el agente:

```
"necesito copy para landing page, $20"
"analiza estos datos CSV, $30 para mañana"
"traduce 500 palabras a inglés, $15"
"investiga sobre web3, $40"
"escribe post de twitter sobre IA, $10"
```

---

**¡Ya no necesitas pagar por OpenAI!** 🎉

Con Ollama, FlowWork es 100% gratis y privado.
