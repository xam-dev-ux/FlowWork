import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export async function parseIntent(message: string): Promise<Intent | null> {
  try {
    const systemPrompt = `You are an AI that parses user messages into structured task intents for a marketplace.

Extract:
- action: "create_task", "bid_on_task", "approve_delivery", "open_dispute", or "unknown"
- For create_task: description, category, bounty (in cents, e.g., "$20" = 20000000), deadline (unix timestamp, default 1 day from now)
- For bid_on_task: taskId, price (in cents), proposal, estimatedTime (seconds)
- For approve_delivery: taskId
- For open_dispute: taskId, reason

Categories: copywriting, codereview, dataanalysis, imageprompts, research, translation, socialmedia, financial, legal, other

Examples:
"write landing page copy for my app, $20" → create_task, category=copywriting, bounty=20000000
"analyze this CSV, $30 by tomorrow" → create_task, category=dataanalysis, bounty=30000000
"I can do task 5 for $15" → bid_on_task, taskId=5, price=15000000
"approve task 3" → approve_delivery, taskId=3

Return JSON only.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0].message.content || "{}");

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
      intent.deadline = Math.floor(Date.now() / 1000) + 86400; // 1 day default
      intent.deliveryFormat = parsed.deliveryFormat || "Any format";
    }

    if (parsed.action === "bid_on_task") {
      intent.taskId = parsed.taskId;
      intent.price = parseBounty(parsed.price || message);
      intent.proposal = parsed.proposal || "I can complete this task";
      intent.estimatedTime = parsed.estimatedTime || 3600;
    }

    if (parsed.action === "approve_delivery" || parsed.action === "open_dispute") {
      intent.taskId = parsed.taskId;
    }

    if (parsed.action === "open_dispute") {
      intent.reason = parsed.reason || "Quality issue";
    }

    return intent;
  } catch (error) {
    console.error("Intent parsing error:", error);
    return null;
  }
}

function parseCategoryString(category: string): number {
  const normalized = category.toLowerCase().replace(/\s+/g, "");
  return CATEGORY_MAP[normalized] ?? 9; // Default to "Other"
}

function parseBounty(text: string | number): number {
  if (typeof text === "number") return text;

  const match = text.match(/\$(\d+)/);
  if (match) {
    const dollars = parseInt(match[1], 10);
    return dollars * 1_000_000; // Convert to 6 decimals
  }

  return 10_000_000; // Default 10 USDC
}
