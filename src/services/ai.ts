import * as db from "../db/service";

interface AiContext {
  dailyLogs: any[];
  gymLogs: any[];
  nutritionLogs: any[];
  journalEntries: any[];
  habits: any[];
  habitLogs: any[];
  goals: any[];
  transactions: any[];
  timetable: any[];
}

async function collectContext(): Promise<AiContext> {
  const [
    dailyLogs,
    gymLogs,
    nutritionLogs,
    journalEntries,
    habits,
    habitLogs,
    goals,
    transactions,
    timetable,
  ] = await Promise.all([
    db.getAllDailyLogs(),
    db.getAllGymLogs(),
    db.getAllNutritionLogs(),
    db.getAllJournalEntries(),
    db.getHabits(),
    db.getHabitLogs(),
    db.getGoals(),
    db.getAllTransactions(),
    db.getAllTimetable(),
  ]);
  return {
    dailyLogs,
    gymLogs,
    nutritionLogs,
    journalEntries,
    habits,
    habitLogs,
    goals,
    transactions,
    timetable,
  };
}

function buildContextString(ctx: AiContext): string {
  const sections: string[] = [];

  if (ctx.gymLogs.length > 0) {
    sections.push("=== GYM WORKOUT HISTORY ===");
    sections.push(
      ctx.gymLogs
        .map(
          (l: any) =>
            `[${l.date}] ${l.workout_name}: ${l.exercises} (${l.duration_minutes}min)${l.notes ? " - " + l.notes : ""}`,
        )
        .join("\n"),
    );
  }

  if (ctx.nutritionLogs.length > 0) {
    sections.push("=== NUTRITION HISTORY ===");
    sections.push(
      ctx.nutritionLogs
        .map(
          (l: any) =>
            `[${l.date}] ${l.meal_type}: ${l.foods} (${l.calories}cal, ${l.protein_g}g protein)${l.notes ? " - " + l.notes : ""}`,
        )
        .join("\n"),
    );
  }

  if (ctx.dailyLogs.length > 0) {
    sections.push("=== DAILY TRACKING ===");
    sections.push(
      ctx.dailyLogs
        .map(
          (l: any) =>
            `[${l.date}] Weight:${l.weight || "—"} Water:${l.water_ml || 0}ml Steps:${l.steps || 0} Mood:${l.mood || "—"} Sleep:${l.sleep_hours || "—"}h${l.notes ? " Notes:" + l.notes : ""}`,
        )
        .join("\n"),
    );
  }

  if (ctx.journalEntries.length > 0) {
    sections.push("=== JOURNAL ENTRIES ===");
    sections.push(
      ctx.journalEntries
        .map(
          (e: any) =>
            `[${e.date}] ${e.title ? e.title + ": " : ""}${e.content}`,
        )
        .join("\n"),
    );
  }

  if (ctx.habits.length > 0) {
    sections.push("=== HABITS ===");
    sections.push(
      ctx.habits
        .map(
          (h: any) =>
            `${h.name} (target: ${h.target_per_day} ${h.unit || "times"}/day)`,
        )
        .join("\n"),
    );
  }

  if (ctx.goals.length > 0) {
    sections.push("=== GOALS ===");
    sections.push(
      ctx.goals
        .map(
          (g: any) =>
            `${g.title}: ${g.current_value}/${g.target_value} ${g.unit || ""} (${g.area || "General"})`,
        )
        .join("\n"),
    );
  }

  if (ctx.transactions.length > 0) {
    sections.push("=== TRANSACTIONS ===");
    sections.push(
      ctx.transactions
        .map(
          (t: any) =>
            `[${t.date}] ${t.type === "income" ? "+" : "-"}$${t.amount} - ${t.category}${t.description ? ": " + t.description : ""}`,
        )
        .join("\n"),
    );
  }

  if (ctx.timetable.length > 0) {
    sections.push("=== WEEKLY SCHEDULE ===");
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    sections.push(
      ctx.timetable
        .map(
          (t: any) =>
            `${dayNames[t.day_of_week]} ${t.start_time} - ${t.activity}`,
        )
        .join("\n"),
    );
  }

  return sections.join("\n\n");
}

// Wraps fetch with a timeout so a stalled request doesn't hang forever and
// look identical to "the app is broken."
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 30000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (e: any) {
    if (e.name === "AbortError") {
      throw new Error(
        `Request timed out after ${timeoutMs / 1000}s. The provider may be down, rate-limiting you, or your network is slow.`,
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// Friendlier error messages for the most common failure modes, especially
// the ones free-tier users hit (rate limits, missing/invalid key, model gone).
function explainHttpError(
  status: number,
  providerLabel: string,
  raw?: string,
): string {
  if (status === 401 || status === 403) {
    return `${providerLabel} rejected the API key (${status}). Double-check you copied it correctly and that it's active.`;
  }
  if (status === 404) {
    return `${providerLabel} couldn't find that model (404). It may have been renamed or retired — pick a different model in AI Settings.`;
  }
  if (status === 429) {
    return `${providerLabel} rate-limited this request (429). This is common on free tiers — wait a bit and try again, or switch to a paid key/model.`;
  }
  if (status >= 500) {
    return `${providerLabel} is having server issues (${status}). Try again shortly.`;
  }
  return raw || `${providerLabel} returned an error (${status}).`;
}

function extractJsonBlock(text: string): string | null {
  // Strip markdown fences
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // Try naive parse first
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {}

  // Balanced brace extraction: find the outermost { ... }
  let depth = 0;
  let start = -1;
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (cleaned[i] === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        return cleaned.slice(start, i + 1);
      }
    }
  }

  return null;
}

function parseAiJson(rawResponse: string): any {
  const block = extractJsonBlock(rawResponse);
  if (!block) {
    console.error("AI raw response (no JSON block found):", rawResponse);
    throw new Error(
      "Failed to parse AI response. Unexpected format. Try a different model or check the raw response in logs.",
    );
  }
  try {
    return JSON.parse(block);
  } catch (e: any) {
    console.error("AI raw response:", rawResponse);
    console.error("Extracted JSON block:", block);
    throw new Error(
      `Failed to parse AI response as JSON: ${e.message}. Try a different model or regenerate.`,
    );
  }
}

async function makeRequest(
  provider: string,
  model: string,
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  switch (provider) {
    case "openai": {
      const res = await fetchWithTimeout(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
            temperature: 0.7,
            response_format: { type: "json_object" },
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          explainHttpError(res.status, "OpenAI", data?.error?.message),
        );
      }
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error("OpenAI returned an empty response.");
      return content;
    }

    case "anthropic": {
      const res = await fetchWithTimeout(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: 4096,
            system: systemPrompt,
            messages: [{ role: "user", content: userMessage }],
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          explainHttpError(res.status, "Anthropic", data?.error?.message),
        );
      }
      const text = data?.content?.[0]?.text;
      if (!text) throw new Error("Anthropic returned an empty response.");
      return text;
    }

    case "google": {
      const res = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: `${systemPrompt}\n\n${userMessage}` }],
              },
            ],
            generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          explainHttpError(res.status, "Gemini", data?.error?.message),
        );
      }
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        const blockReason = data?.promptFeedback?.blockReason;
        throw new Error(
          blockReason
            ? `Gemini blocked this response (${blockReason}).`
            : "Gemini returned an empty response.",
        );
      }
      return text;
    }

    case "openrouter": {
      const res = await fetchWithTimeout(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "https://arete.app",
            "X-Title": "Arete",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
            temperature: 0.7,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          explainHttpError(res.status, "OpenRouter", data?.error?.message),
        );
      }
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error("OpenRouter returned an empty response.");
      return content;
    }

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export async function generateAiProgram(
  type: "gym" | "food",
  userPreferences?: string,
): Promise<{
  title: string;
  items: {
    day_index: number;
    day_label: string;
    title: string;
    description: string;
    sort_order: number;
    details: db.AiProgramDetail[];
  }[];
}> {
  const provider = await db.getActiveAiProvider();
  if (!provider)
    throw new Error(
      "No active AI provider configured. Go to AI Settings to set one up.",
    );
  if (!provider.api_key)
    throw new Error("API key not set for the active provider.");

  const context = await collectContext();
  const contextStr = buildContextString(context);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const dayLabels = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const systemPrompt =
    type === "gym"
      ? `You are an expert personal trainer creating weekly workout programs. Use the user's gym history, daily logs, and goals to create a personalized weekly program.

Each day should contain 4-6 concrete exercises with:
- name, sets, reps, rest seconds
- estimated weight recommendation
- warm-up / cool-down notes
- total volume estimate

Return ONLY valid JSON.`
      : `You are an expert nutritionist creating weekly meal plans. Use the user's nutrition history, daily logs, and goals to create a personalized weekly meal plan.

Each meal should include:
- specific food name, portion size
- calories, protein, carbs, fat breakdown
- prep instructions
- total daily macros

Return ONLY valid JSON.`;

  const userMessage = `Generate a weekly ${type === "gym" ? "workout" : "meal"} program for the user for the week of ${weekStart.toISOString().split("T")[0]} to ${weekEnd.toISOString().split("T")[0]}.
Here is the user's historical data to personalize the plan:
${contextStr}
${userPreferences ? `\nUser preferences:\n${userPreferences}\n` : ""}

You MUST respond with ONLY a single valid JSON object. Do not wrap it in markdown code blocks, do not add explanations, and do not include any text before or after the JSON.

Required JSON structure:
{
  "title": "Week of [date] - [Program Name]",
  "items": [
    {
      "day_index": 0,
      "day_label": "Sunday",
      "title": "Day title",
      "description": "Brief description",
      "sort_order": 0,
      "details": [
        {
          "type": "${type === "gym" ? "exercise" : "meal"}",
          "name": "Name",
          ${type === "gym"
            ? `"sets": 4,
          "reps": 8,
          "rest_seconds": 90,
          "weight": "185 lbs",
          "notes": "Warm up with empty bar first"`
            : `"calories": 450,
          "protein": 35,
          "carbs": 45,
          "fat": 12,
          "portion": "1 bowl"`
          }
        }
      ]
    }
  ]
}

Rules:
- Output exactly 7 items, one for each day of the week (day_index 0-6).
- Every item MUST include a "details" array with at least 3 entries.
- For gym programs, each detail is an exercise with sets, reps, rest_seconds, weight, notes.
- For meal programs, each detail is a food item with calories, protein, carbs, fat, portion.
- Provide real, actionable numbers based on the user's history and goals.
- Return valid JSON only.`;

  const rawResponse = await makeRequest(
    provider.provider,
    provider.model,
    provider.api_key,
    systemPrompt,
    userMessage,
  );

  const parsed = parseAiJson(rawResponse);

  const ws = weekStart.toISOString().split("T")[0];
  const we = weekEnd.toISOString().split("T")[0];

  const items = parsed.items.map((item: any) => {
    const detailType = type === "gym" ? "exercise" : "meal";
    const rawDetails = Array.isArray(item.details) ? item.details : [];
    const details: db.AiProgramDetail[] = rawDetails.map((d: any) => {
      const metadata: Record<string, any> = {};
      for (const key of Object.keys(d)) {
        if (key !== "type" && key !== "name") {
          metadata[key] = d[key];
        }
      }
      return {
        type: d.type || detailType,
        name: d.name || (type === "gym" ? "Exercise" : "Meal"),
        metadata,
      };
    });

    return {
      day_index: item.day_index,
      day_label: item.day_label || dayLabels[item.day_index],
      title: item.title,
      description: item.description,
      sort_order: item.sort_order ?? item.day_index,
      details,
    };
  });

  const programId = await db.saveAiProgram({
    type,
    title:
      parsed.title || `${type === "gym" ? "Workout" : "Meal"} Plan - ${ws}`,
    week_start: ws,
    week_end: we,
    context_snapshot: contextStr,
    raw_response: rawResponse,
    items,
  });

  const full = await db.getAiProgramWithItems(Number(programId));
  return {
    title: full.title,
    items: full.items,
  };
}

export async function askAi(question: string): Promise<string> {
  const provider = await db.getActiveAiProvider();
  if (!provider) throw new Error("No active AI provider configured.");
  if (!provider.api_key)
    throw new Error("API key not set for the active provider.");

  const context = await collectContext();
  const contextStr = buildContextString(context);

  const systemPrompt =
    "You are an AI assistant with full context of the user's life tracking data. Use the provided data to give personalized, insightful answers. Be concise and helpful.";

  const userMessage = `Here is the user's data:\n\n${contextStr}\n\nUser question: ${question}`;

  return await makeRequest(
    provider.provider,
    provider.model,
    provider.api_key,
    systemPrompt,
    userMessage,
  );
}

export interface ProviderModel {
  id: string;
  label: string;
  /** True if this specific model can be used at zero cost on this provider. */
  free: boolean;
}

export interface ProviderConfigMeta {
  id: string;
  label: string;
  /** Where a user can sign up and grab an API key for this provider. */
  getKeyUrl: string;
  /** True if this provider has a genuine, ongoing free tier (not just trial credits). */
  freeTier: boolean;
  /** One-line explanation shown in Settings so users know what they're signing up for. */
  freeTierNote: string;
  models: ProviderModel[];
}

export const PROVIDERS: ProviderConfigMeta[] = [
  {
    id: "google",
    label: "Google (Gemini)",
    getKeyUrl: "https://aistudio.google.com/apikey",
    freeTier: true,
    freeTierNote:
      "Genuinely free — generous daily limits, no credit card required.",
    models: [
      { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", free: true },
      {
        id: "gemini-3.1-pro-preview",
        label: "Gemini 3.1 Pro Preview",
        free: true,
      },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", free: true },
    ],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    getKeyUrl: "https://openrouter.ai/keys",
    freeTier: true,
    freeTierNote:
      "Free auto-router picks whatever free model is live right now, no credit card required. Individual free models rotate weekly — pin one only if you're checking openrouter.ai/models regularly.",
    models: [
      { id: "openrouter/free", label: "Auto (Free Router)", free: true },
      {
        id: "anthropic/claude-opus-4-8",
        label: "Claude Opus 4.8",
        free: false,
      },
      {
        id: "anthropic/claude-sonnet-5",
        label: "Claude Sonnet 5",
        free: false,
      },
      { id: "google/gemini-3.5-flash", label: "Gemini 3.5 Flash", free: false },
      { id: "openai/gpt-5.6-sol", label: "GPT-5.6 Sol", free: false },
      { id: "openai/gpt-5.6-terra", label: "GPT-5.6 Terra", free: false },
    ],
  },
  {
    id: "openai",
    label: "OpenAI",
    getKeyUrl: "https://platform.openai.com/api-keys",
    freeTier: false,
    freeTierNote:
      "No ongoing free tier — requires adding a payment method to your OpenAI account.",
    models: [
      { id: "gpt-5.6-sol", label: "GPT-5.6 Sol", free: false },
      { id: "gpt-5.6-terra", label: "GPT-5.6 Terra", free: false },
      { id: "gpt-5.6-luna", label: "GPT-5.6 Luna", free: false },
      { id: "gpt-4o", label: "GPT-4o", free: false },
      { id: "gpt-4o-mini", label: "GPT-4o mini", free: false },
    ],
  },
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    getKeyUrl: "https://console.anthropic.com/settings/keys",
    freeTier: false,
    freeTierNote:
      "Small starter credit only — requires billing once that runs out.",
    models: [
      { id: "claude-opus-4-8", label: "Claude Opus 4.8", free: false },
      { id: "claude-sonnet-5", label: "Claude Sonnet 5", free: false },
      {
        id: "claude-haiku-4-5-20251001",
        label: "Claude Haiku 4.5",
        free: false,
      },
    ],
  },
];