// Task Executor - Completa tareas usando Claude AI

import Anthropic from "@anthropic-ai/sdk";

interface TaskExecution {
  canExecute: boolean;
  estimatedTime: number; // en segundos
  confidence: number; // 0-100
  result?: string;
}

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

export async function canExecuteTask(
  description: string,
  category: number
): Promise<TaskExecution> {
  try {
    // Si no hay API key, usar heurística simple
    if (!process.env.ANTHROPIC_API_KEY) {
      return analyzeTaskWithoutAI(description, category);
    }

    const anthropic = getAnthropicClient();

    const systemPrompt = `Eres un agente AI que evalúa si puede completar tareas.

Analiza la tarea y responde SOLO con JSON:
{
  "canExecute": true/false,
  "confidence": 0-100,
  "estimatedTime": segundos,
  "reason": "breve explicación"
}

Puedes hacer:
- Escritura (copy, blogs, emails)
- Investigación (research, análisis)
- Traducción de textos
- Análisis de datos (con información provista)
- Code review
- Generación de prompts de imágenes

NO puedes:
- Tareas que requieren acceso a sistemas externos
- Ejecución de código en sistemas reales
- Tareas físicas
- Acceso a bases de datos privadas`;

    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-3-7-haiku-20250219",
      max_tokens: 1024,
      temperature: 0.2,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Tarea: "${description}"\n\nCategoría: ${getCategoryName(category)}\n\n¿Puedes completar esta tarea?`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return { canExecute: false, estimatedTime: 0, confidence: 0 };
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { canExecute: false, estimatedTime: 0, confidence: 0 };
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return {
      canExecute: analysis.canExecute || false,
      estimatedTime: analysis.estimatedTime || 3600,
      confidence: analysis.confidence || 0,
    };
  } catch (error) {
    console.error("Error analizando tarea:", error);
    return analyzeTaskWithoutAI(description, category);
  }
}

export async function executeTask(
  description: string,
  deliveryFormat: string,
  category: number
): Promise<string> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("Claude API key no configurado");
    }

    const anthropic = getAnthropicClient();

    const systemPrompt = `Eres un agente AI que completa tareas profesionalmente.

La tarea que debes completar es:
"${description}"

Formato de entrega solicitado: ${deliveryFormat}

IMPORTANTE:
- Sé conciso y profesional
- Entrega exactamente lo que se pide
- Si es escritura, hazlo en el tono apropiado
- Si es investigación, incluye fuentes cuando sea posible
- Si es traducción, mantén el significado original
- Si es análisis, sé claro y estructurado`;

    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-3-7-haiku-20250219",
      max_tokens: parseInt(process.env.CLAUDE_MAX_TOKENS || "8000"),
      temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || "0.7"),
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Completa la tarea ahora. Entrega el resultado listo para el cliente.`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("No se pudo generar respuesta");
    }

    return content.text;
  } catch (error: any) {
    console.error("Error ejecutando tarea:", error);
    throw new Error(`No se pudo completar la tarea: ${error.message}`);
  }
}

function analyzeTaskWithoutAI(
  description: string,
  category: number
): TaskExecution {
  const lowerDesc = description.toLowerCase();

  // Categorías que podemos intentar
  const canDoCategories = [0, 3, 4, 5, 6]; // copywriting, image prompts, research, translation, social

  if (!canDoCategories.includes(category)) {
    return { canExecute: false, estimatedTime: 0, confidence: 0 };
  }

  // Palabras clave que sugieren que NO podemos hacer
  const cantDoKeywords = [
    "código",
    "code",
    "programa",
    "ejecuta",
    "instala",
    "base de datos",
    "database",
    "servidor",
    "deploy",
  ];

  for (const keyword of cantDoKeywords) {
    if (lowerDesc.includes(keyword)) {
      return { canExecute: false, estimatedTime: 0, confidence: 0 };
  }
  }

  // Si es corto y simple, alta confianza
  const wordCount = description.split(" ").length;
  const confidence = Math.min(80, Math.max(30, 100 - wordCount));

  return {
    canExecute: true,
    estimatedTime: wordCount * 10, // ~10 seg por palabra
    confidence,
  };
}

function getCategoryName(category: number): string {
  const names = [
    "Copywriting",
    "Code Review",
    "Data Analysis",
    "Image Prompts",
    "Research",
    "Translation",
    "Social Media",
    "Financial",
    "Legal",
    "Other",
  ];
  return names[category] || "Unknown";
}
