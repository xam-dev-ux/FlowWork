// Intent Parser usando Claude API (Anthropic)

import Anthropic from "@anthropic-ai/sdk";

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

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

export async function parseIntent(message: string): Promise<Intent | null> {
  try {
    const anthropic = getAnthropicClient();
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

Responde SOLO con JSON válido, sin explicaciones adicionales.`;

    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-3-5-haiku-20241022",
      max_tokens: parseInt(process.env.CLAUDE_MAX_TOKENS || "8000"),
      temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || "0.2"),
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Mensaje del usuario: "${message}"\n\nDevuelve solo JSON:`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return null;
    }

    // Extraer JSON de la respuesta
    let jsonText = content.text.trim();

    // Si la respuesta tiene markdown code blocks, extraer el JSON
    const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
                      jsonText.match(/(\{[\s\S]*\})/);

    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonText);

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
    console.error("Error parseando intent con Claude:", error);

    // Fallback: parsing simple sin IA
    return parseIntentFallback(message);
  }
}

// Fallback sin IA - parsing basado en reglas
function parseIntentFallback(message: string): Intent | null {
  const lowerMsg = message.toLowerCase();

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

  if (lowerMsg.includes("aprobar") || lowerMsg.includes("approve")) {
    const taskId = extractNumber(message);
    if (taskId) {
      return { action: "approve_delivery", taskId };
    }
  }

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
    return dollars * 1_000_000;
  }

  return 10_000_000;
}
