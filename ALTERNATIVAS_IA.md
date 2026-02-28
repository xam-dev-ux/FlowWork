# Alternativas de IA Gratuitas para FlowWork

Comparación de todas las opciones gratuitas de IA que puedes usar en el agente.

## 🏆 Recomendadas (Mejores)

### 1. Ollama (Local) ⭐ MEJOR OPCIÓN

**Ventajas:**
- ✅ 100% gratis, sin límites
- ✅ Privacidad total (local)
- ✅ Rápido (<1s)
- ✅ Funciona offline
- ✅ Fácil de instalar

**Desventajas:**
- ❌ Necesita 4GB+ RAM
- ❌ Instalación inicial de 2GB

**Instalación:**
```bash
# Instalar Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Descargar modelo
ollama pull llama3.2

# Iniciar
ollama serve
```

**Uso:** Ver `OLLAMA_SETUP.md`

---

### 2. LM Studio (Local) ⭐

**Ventajas:**
- ✅ 100% gratis
- ✅ Interfaz gráfica (GUI)
- ✅ Descarga modelos con 1 clic
- ✅ Compatible con OpenAI API

**Desventajas:**
- ❌ Necesita 8GB+ RAM
- ❌ Solo Windows/Mac (no Linux)

**Instalación:**
1. Descarga: https://lmstudio.ai/
2. Abre LM Studio
3. Busca "Llama 3.2" → Download
4. Start Server (puerto 1234)

**Código:**
```typescript
// Usar LM Studio (compatible con OpenAI SDK)
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://localhost:1234/v1",
  apiKey: "not-needed"
});
```

---

### 3. Hugging Face Inference API (Cloud Gratis)

**Ventajas:**
- ✅ Gratis (hasta 1000 req/día)
- ✅ Sin instalación
- ✅ No usa tu RAM
- ✅ Muchos modelos

**Desventajas:**
- ❌ Necesita internet
- ❌ Más lento (2-5s)
- ❌ Rate limits

**Instalación:**
```bash
npm install @huggingface/inference
```

**Código:**
```typescript
import { HfInference } from "@huggingface/inference";

const hf = new HfInference("hf_YOUR_FREE_TOKEN");

const result = await hf.textGeneration({
  model: "mistralai/Mistral-7B-Instruct-v0.2",
  inputs: prompt,
  parameters: {
    max_new_tokens: 200,
    temperature: 0.1,
  },
});
```

**Token gratis:** https://huggingface.co/settings/tokens

---

## Otras Opciones

### 4. Together.ai (Cloud)

**Gratis:** $25 de crédito inicial
**Modelos:** Llama 3, Mixtral, etc.
**Código:**
```typescript
const response = await fetch("https://api.together.xyz/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${TOGETHER_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "meta-llama/Llama-3-8b-chat-hf",
    messages: [{ role: "user", content: prompt }]
  })
});
```

### 5. Groq (Cloud - Muy Rápido)

**Gratis:** 14400 req/día
**Velocidad:** <500ms (el más rápido)
**Modelos:** Llama 3, Mixtral, Gemma

```bash
npm install groq-sdk
```

```typescript
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const completion = await groq.chat.completions.create({
  model: "llama-3.1-8b-instant",
  messages: [{ role: "user", content: prompt }],
  temperature: 0,
});
```

**Registro:** https://console.groq.com/

### 6. Fireworks.ai

**Gratis:** $1 crédito inicial
**Ventaja:** API compatible con OpenAI

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.fireworks.ai/inference/v1",
  apiKey: process.env.FIREWORKS_API_KEY,
});
```

---

## Comparación Completa

| Opción | Costo | Velocidad | RAM Necesaria | Internet | Setup |
|--------|-------|-----------|---------------|----------|-------|
| **Ollama** | $0 | ⚡⚡⚡ | 4GB+ | No | 5 min |
| **LM Studio** | $0 | ⚡⚡⚡ | 8GB+ | No | 10 min |
| **HuggingFace** | $0 | ⚡⚡ | 0 | Sí | 1 min |
| **Groq** | $0 | ⚡⚡⚡⚡ | 0 | Sí | 2 min |
| **Together.ai** | $25 gratis | ⚡⚡⚡ | 0 | Sí | 2 min |
| **OpenAI** | ~$0.002/req | ⚡⚡⚡ | 0 | Sí | 1 min |

---

## Recomendación por Caso de Uso

### Para Desarrollo Local
→ **Ollama** (100% gratis, privado, rápido)

### Para Prototipar Rápido
→ **Groq** (súper rápido, 14k req/día gratis)

### Para Producción con Presupuesto
→ **Together.ai** o **Fireworks.ai** (económicos)

### Si tienes RAM limitada (<4GB)
→ **HuggingFace** o **Groq** (cloud)

---

## Implementación en FlowWork

### Opción 1: Solo Ollama (Recomendado)

```typescript
// agent/src/index.ts
import { parseIntent } from "./intentParserLocal"; // ← Ollama
```

### Opción 2: Fallback Múltiple

```typescript
async function parseIntentWithFallback(message: string) {
  try {
    // Intentar Ollama primero (gratis, local)
    return await parseIntentOllama(message);
  } catch {
    try {
      // Fallback a Groq (gratis, cloud, rápido)
      return await parseIntentGroq(message);
    } catch {
      // Fallback a reglas simples
      return parseIntentFallback(message);
    }
  }
}
```

### Opción 3: Switch por Variable

```typescript
// agent/src/index.ts
const AI_PROVIDER = process.env.AI_PROVIDER || "ollama";

let parseIntent;
switch (AI_PROVIDER) {
  case "ollama":
    parseIntent = require("./intentParserLocal").parseIntent;
    break;
  case "groq":
    parseIntent = require("./intentParserGroq").parseIntent;
    break;
  case "openai":
    parseIntent = require("./intentParser").parseIntent;
    break;
  default:
    parseIntent = require("./intentParserLocal").parseIntent;
}
```

---

## Costos Estimados (1000 tareas/mes)

| Proveedor | Costo Mensual |
|-----------|---------------|
| Ollama | **$0** |
| LM Studio | **$0** |
| Groq | **$0** (dentro de límites) |
| HuggingFace | **$0** (dentro de límites) |
| Together.ai | ~$2 |
| OpenAI | ~$10 |

---

## Instalación Rápida de Ollama

```bash
# 1. Instalar
curl -fsSL https://ollama.com/install.sh | sh

# 2. Descargar modelo
ollama pull llama3.2

# 3. Probar
ollama run llama3.2
>>> escribe un haiku sobre blockchain
>>> /bye

# 4. Iniciar como servicio
ollama serve &

# 5. Usar en FlowWork
# Editar agent/src/index.ts para usar intentParserLocal.ts
```

**¡Listo!** Ya tienes IA gratis funcionando. 🎉

---

## Recursos

- **Ollama**: https://ollama.com
- **LM Studio**: https://lmstudio.ai
- **Groq**: https://console.groq.com
- **HuggingFace**: https://huggingface.co/inference-api
- **Together.ai**: https://together.ai

---

**Mi recomendación personal: Empieza con Ollama.**

Es el equilibrio perfecto entre gratis, privado, rápido y fácil de usar.
