// Intent Parser usando Ollama (100% GRATIS y LOCAL)

export interface Intent {
  action: "create_task" | "bid_on_task" | "approve_delivery" | "open_dispute" | "unknown";
  taskId?: number;
  description?: string;
  deliveryFormat?: string;
  category?: number;
  deadline?: number;
  bounty?: number;
  price?: number;
  proposal?: string;
  estimatedTime?: number;
  reason?: string;
}

const CATEGORY_MAP: { [key: string]: number } = {
  copywriting: 0,
  writing: 0,
  copy: 0,
  codereview: 1,
  code: 1,
  review: 1,
  dataanalysis: 2,
  data: 2,
  analysis: 2,
  imageprompts: 3,
  image: 3,
  prompts: 3,
  research: 4,
  translation: 5,
  translate: 5,
  socialmedia: 6,
  social: 6,
  financial: 7,
  finance: 7,
  legal: 8,
  other: 9,
};

// Usar Ollama localmente (gratis)
async function callOllama(prompt: string): Promise<string> {
  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2", // Modelo gratis de Meta
        prompt: prompt,
        stream: false,
        format: "json",
      }),
    });

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Ollama error:", error);
    throw new Error("Ollama no está corriendo. Ejecuta: ollama serve");
  }
}

export async function parseIntent(message: string): Promise<Intent | null> {
  try {
    const systemPrompt = `Eres un parser de intenciones para un marketplace de tareas.
Extrae información del mensaje del usuario y devuelve JSON.

Acciones posibles:
- "create_task": crear una tarea nueva
- "bid_on_task": hacer una oferta en una tarea
- "approve_delivery": aprobar entrega
- "open_dispute": abrir disputa

Para create_task extrae:
- description: descripción de la tarea
- category: copywriting, codereview, dataanalysis, imageprompts, research, translation, socialmedia, financial, legal, other
- bounty: precio en dólares (convierte a centavos * 1000000)
- deadline: timestamp unix (por defecto 1 día desde ahora)

Ejemplos:
"escribe copy para landing page, $20" → {"action":"create_task","category":"copywriting","bounty":20000000}
"analiza estos datos, $30" → {"action":"create_task","category":"dataanalysis","bounty":30000000}

Responde SOLO con JSON válido.`;

    const fullPrompt = `${systemPrompt}\n\nMensaje del usuario: "${message}"\n\nJSON:`;

    const response = await callOllama(fullPrompt);

    // Limpiar la respuesta (a veces Ollama añade texto extra)
    let jsonStr = response.trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr);

    if (!parsed.action || parsed.action === "unknown") {
      return null;
    }

    const intent: Intent = {
      action: parsed.action,
    };

    if (parsed.action === "create_task") {
      intent.description = parsed.description || message;
      intent.category = parseCategoryString(parsed.category || "other");
      intent.bounty = parseBounty(parsed.bounty || message);
      intent.deadline = Math.floor(Date.now() / 1000) + 86400;
      intent.deliveryFormat = parsed.deliveryFormat || "Any format";
    }

    if (parsed.action === "bid_on_task") {
      intent.taskId = parsed.taskId;
      intent.price = parseBounty(parsed.price || message);
      intent.proposal = parsed.proposal || "Puedo completar esta tarea";
      intent.estimatedTime = parsed.estimatedTime || 3600;
    }

    if (parsed.action === "approve_delivery" || parsed.action === "open_dispute") {
      intent.taskId = parsed.taskId;
    }

    if (parsed.action === "open_dispute") {
      intent.reason = parsed.reason || "Problema de calidad";
    }

    return intent;
  } catch (error) {
    console.error("Error parseando intent:", error);

    // Fallback: parsing simple sin IA
    return parseIntentFallback(message);
  }
}

// Fallback sin IA - parsing basado en reglas
function parseIntentFallback(message: string): Intent | null {
  const lowerMsg = message.toLowerCase();

  // Detectar crear tarea
  if (
    lowerMsg.includes("escribe") ||
    lowerMsg.includes("necesito") ||
    lowerMsg.includes("quiero") ||
    /\$\d+/.test(message)
  ) {
    return {
      action: "create_task",
      description: message,
      category: detectCategory(lowerMsg),
      bounty: parseBounty(message),
      deadline: Math.floor(Date.now() / 1000) + 86400,
      deliveryFormat: "Any format",
    };
  }

  // Detectar aprobar
  if (lowerMsg.includes("aprobar") || lowerMsg.includes("approve")) {
    const taskId = extractNumber(message);
    if (taskId) {
      return { action: "approve_delivery", taskId };
    }
  }

  // Detectar disputa
  if (lowerMsg.includes("disputa") || lowerMsg.includes("dispute")) {
    const taskId = extractNumber(message);
    if (taskId) {
      return { action: "open_dispute", taskId, reason: "Problema reportado" };
    }
  }

  return null;
}

function detectCategory(text: string): number {
  if (text.includes("escrib") || text.includes("copy") || text.includes("blog")) return 0;
  if (text.includes("código") || text.includes("code") || text.includes("review")) return 1;
  if (text.includes("datos") || text.includes("data") || text.includes("análisis")) return 2;
  if (text.includes("imagen") || text.includes("image") || text.includes("prompt")) return 3;
  if (text.includes("investig") || text.includes("research")) return 4;
  if (text.includes("traduc") || text.includes("translat")) return 5;
  if (text.includes("social") || text.includes("twitter") || text.includes("instagram")) return 6;
  if (text.includes("financ") || text.includes("dinero")) return 7;
  if (text.includes("legal") || text.includes("contrato")) return 8;
  return 9;
}

function extractNumber(text: string): number | null {
  const match = text.match(/\d+/);
  return match ? parseInt(match[0]) : null;
}

function parseCategoryString(category: string): number {
  const normalized = category.toLowerCase().replace(/\s+/g, "");
  return CATEGORY_MAP[normalized] ?? 9;
}

function parseBounty(text: string | number): number {
  if (typeof text === "number") return text;

  const match = text.match(/\$(\d+)/);
  if (match) {
    const dollars = parseInt(match[1], 10);
    return dollars * 1_000_000; // 6 decimales USDC
  }

  return 10_000_000; // Default 10 USDC
}
