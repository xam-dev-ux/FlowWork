#!/usr/bin/env node

// Script de prueba para Claude API + FlowWork

const testMessages = [
  "necesito copy para landing page, $20",
  "escribe un blog post sobre web3, $25",
  "analiza estos datos CSV, $30 para mañana",
  "traduce 500 palabras a español, $15",
  "investiga sobre IA en blockchain, $40",
];

async function testClaude(message) {
  const Anthropic = require("@anthropic-ai/sdk");

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const systemPrompt = `Eres un parser de intenciones para un marketplace de tareas.
Extrae información del mensaje del usuario y devuelve JSON.

Acciones posibles:
- "create_task": crear una tarea nueva

Para create_task extrae:
- description: descripción de la tarea
- category: copywriting, codereview, dataanalysis, imageprompts, research, translation, socialmedia, financial, legal, other
- bounty: precio en dólares (convierte a centavos * 1000000)

Ejemplos:
"escribe copy, $20" → {"action":"create_task","category":"copywriting","bounty":20000000}

Responde SOLO con JSON válido.`;

  const response = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 1024,
    temperature: 0.2,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Mensaje: "${message}"\n\nJSON:`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type === "text") {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  }

  return null;
}

async function runTests() {
  console.log("\n🧪 Probando Claude API con FlowWork...\n");

  for (const message of testMessages) {
    try {
      console.log(`📝 Mensaje: "${message}"`);
      const result = await testClaude(message);
      console.log(`✅ Resultado:`, JSON.stringify(result, null, 2));
      console.log("");
    } catch (error) {
      console.log(`❌ Error:`, error.message);
      console.log("");
    }
  }

  console.log("✨ Pruebas completadas!\n");
}

runTests().catch(console.error);
