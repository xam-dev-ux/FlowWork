#!/usr/bin/env node

// Script de prueba para Ollama + FlowWork

const testMessages = [
  "necesito copy para landing page, $20",
  "escribe un blog post sobre web3, $25",
  "analiza estos datos CSV, $30 para mañana",
  "traduce 500 palabras a español, $15",
  "investiga sobre IA en blockchain, $40",
  "aprobar tarea 5",
  "abrir disputa en tarea 3, mala calidad",
];

async function testOllama(message) {
  const prompt = `Eres un parser de intenciones para un marketplace de tareas.
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

Ejemplos:
"escribe copy, $20" → {"action":"create_task","category":"copywriting","bounty":20000000}
"analiza datos, $30" → {"action":"create_task","category":"dataanalysis","bounty":30000000}

Mensaje del usuario: "${message}"

Responde SOLO con JSON válido:`;

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.2",
      prompt: prompt,
      stream: false,
      format: "json",
    }),
  });

  const data = await response.json();
  return JSON.parse(data.response);
}

async function runTests() {
  console.log("\n🧪 Probando Ollama con FlowWork...\n");

  for (const message of testMessages) {
    try {
      console.log(`📝 Mensaje: "${message}"`);
      const result = await testOllama(message);
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
