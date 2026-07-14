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

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/**
 * Distinguishes *why* a response failed to become usable JSON, so callers
 * can decide how to react (retry with more tokens, retry with a corrective
 * prompt, or give up with a clear message) instead of guessing from a
 * generic Error string.
 */
class AiResponseError extends Error {
  code: "PARSE_ERROR" | "TRUNCATED" | "EMPTY" | "VALIDATION_ERROR";
  constructor(code: AiResponseError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "AiResponseError";
  }
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

// Wraps fetch with a timeout so a stalled request doesn't hang forever and
// look identical to "the app is broken."
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 60000,
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

// ---------------------------------------------------------------------------
// Robust JSON extraction
// ---------------------------------------------------------------------------

/**
 * Extracts the outermost JSON object from a raw model response.
 *
 * This is string-aware: it will not get confused by `{`/`}` characters that
 * appear inside quoted strings (e.g. a meal description containing braces),
 * which was the main source of "unable to parse" failures before. It also
 * distinguishes a genuinely malformed response from a *truncated* one (an
 * opening brace that never closes), since those need different fixes.
 */
function extractJsonBlock(text: string): {
  json: string | null;
  truncated: boolean;
} {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // Fast path: the whole response is already valid JSON.
  try {
    JSON.parse(cleaned);
    return { json: cleaned, truncated: false };
  } catch {}

  let depth = 0;
  let start = -1;
  let inString = false;
  let stringChar = "";
  let escaped = false;

  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (c === "\\") {
        escaped = true;
      } else if (c === stringChar) {
        inString = false;
      }
      continue;
    }

    if (c === '"' || c === "'") {
      inString = true;
      stringChar = c;
      continue;
    }

    if (c === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        return { json: cleaned.slice(start, i + 1), truncated: false };
      }
    }
  }

  // An opening brace was found but never balanced out — the response was
  // almost certainly cut off mid-generation (ran out of output tokens).
  if (start !== -1) {
    return { json: null, truncated: true };
  }

  return { json: null, truncated: false };
}

function parseAiJson(rawResponse: string): any {
  if (!rawResponse || !rawResponse.trim()) {
    throw new AiResponseError("EMPTY", "The AI returned an empty response.");
  }

  const { json, truncated } = extractJsonBlock(rawResponse);

  if (truncated) {
    throw new AiResponseError(
      "TRUNCATED",
      "The AI response was cut off before the JSON was complete (it likely ran out of output tokens).",
    );
  }

  if (!json) {
    console.error("AI raw response (no JSON block found):", rawResponse);
    throw new AiResponseError(
      "PARSE_ERROR",
      "Could not find a JSON object anywhere in the AI's response.",
    );
  }

  try {
    return JSON.parse(json);
  } catch (e: any) {
    console.error("AI raw response:", rawResponse);
    console.error("Extracted JSON block:", json);
    throw new AiResponseError(
      "PARSE_ERROR",
      `Extracted text was not valid JSON: ${e.message}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Provider requests
// ---------------------------------------------------------------------------

interface AiCompletion {
  text: string;
  /** True if the provider's own finish/stop reason indicates it ran out of tokens. */
  truncated: boolean;
}

async function makeRequest(
  provider: string,
  model: string,
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  timeoutMs = 60000,
  maxTokens = 4096,
  jsonMode = false,
): Promise<AiCompletion> {
  switch (provider) {
    case "openai": {
      const url = "https://api.openai.com/v1/chat/completions";
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      };
      const body: any = {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
      };
      if (jsonMode) body.response_format = { type: "json_object" };

      let res = await fetchWithTimeout(
        url,
        { method: "POST", headers, body: JSON.stringify(body) },
        timeoutMs,
      );
      let data = await res.json().catch(() => ({}));

      // Some models/providers reject response_format — fall back gracefully
      // instead of failing outright, since our own JSON extraction can cope.
      if (
        !res.ok &&
        jsonMode &&
        /response_format/i.test(data?.error?.message || "")
      ) {
        delete body.response_format;
        res = await fetchWithTimeout(
          url,
          { method: "POST", headers, body: JSON.stringify(body) },
          timeoutMs,
        );
        data = await res.json().catch(() => ({}));
      }

      if (!res.ok) {
        throw new Error(
          explainHttpError(res.status, "OpenAI", data?.error?.message),
        );
      }
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error("OpenAI returned an empty response.");
      return {
        text: content,
        truncated: data?.choices?.[0]?.finish_reason === "length",
      };
    }

    case "anthropic": {
      const url = "https://api.anthropic.com/v1/messages";
      const headers = {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      };

      // Anthropic has no dedicated JSON mode. Prefilling the assistant turn
      // with "{" reliably forces the model to skip preamble/markdown fences
      // and start directly with the object, which we reassemble below.
      const messages = jsonMode
        ? [
            { role: "user", content: userMessage },
            { role: "assistant", content: "{" },
          ]
        : [{ role: "user", content: userMessage }];

      const res = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            system: systemPrompt,
            messages,
          }),
        },
        timeoutMs,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          explainHttpError(res.status, "Anthropic", data?.error?.message),
        );
      }
      const continuation = data?.content?.[0]?.text;
      if (continuation === undefined || continuation === null) {
        throw new Error("Anthropic returned an empty response.");
      }
      const text = jsonMode ? "{" + continuation : continuation;
      return { text, truncated: data?.stop_reason === "max_tokens" };
    }

    case "google": {
      const generationConfig: any = {
        temperature: 0.7,
        maxOutputTokens: maxTokens,
      };
      if (jsonMode) generationConfig.responseMimeType = "application/json";

      const res = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { parts: [{ text: `${systemPrompt}\n\n${userMessage}` }] },
            ],
            generationConfig,
          }),
        },
        timeoutMs,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          explainHttpError(res.status, "Gemini", data?.error?.message),
        );
      }
      const finishReason = data?.candidates?.[0]?.finishReason;
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        if (finishReason === "MAX_TOKENS") {
          // Cut off so early there's no text at all — report as truncated
          // rather than a generic empty-response error.
          return { text: "", truncated: true };
        }
        const blockReason = data?.promptFeedback?.blockReason;
        throw new Error(
          blockReason
            ? `Gemini blocked this response (${blockReason}).`
            : "Gemini returned an empty response.",
        );
      }
      return { text, truncated: finishReason === "MAX_TOKENS" };
    }

    case "openrouter": {
      const url = "https://openrouter.ai/api/v1/chat/completions";
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://arete.app",
        "X-Title": "Arete",
      };
      const body: any = {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
      };
      if (jsonMode) body.response_format = { type: "json_object" };

      let res = await fetchWithTimeout(
        url,
        { method: "POST", headers, body: JSON.stringify(body) },
        timeoutMs,
      );
      let data = await res.json().catch(() => ({}));

      if (
        !res.ok &&
        jsonMode &&
        /response_format/i.test(data?.error?.message || "")
      ) {
        delete body.response_format;
        res = await fetchWithTimeout(
          url,
          { method: "POST", headers, body: JSON.stringify(body) },
          timeoutMs,
        );
        data = await res.json().catch(() => ({}));
      }

      if (!res.ok) {
        throw new Error(
          explainHttpError(res.status, "OpenRouter", data?.error?.message),
        );
      }
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error("OpenRouter returned an empty response.");
      return {
        text: content,
        truncated: data?.choices?.[0]?.finish_reason === "length",
      };
    }

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

async function makeRequestWithRetry(
  provider: string,
  model: string,
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  timeoutMs = 90000,
  maxRetries = 1,
  maxTokens = 4096,
  jsonMode = false,
): Promise<AiCompletion> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await makeRequest(
        provider,
        model,
        apiKey,
        systemPrompt,
        userMessage,
        timeoutMs,
        maxTokens,
        jsonMode,
      );
    } catch (e: any) {
      lastError = e;
      const msg = (e.message || "").toLowerCase();
      const isTransient =
        e.name === "AbortError" ||
        msg.includes("timed out") ||
        msg.includes("timeout") ||
        msg.includes("server issues") ||
        msg.includes("rate-limited");
      if (!isTransient || attempt === maxRetries) {
        throw e;
      }
      console.warn(
        `AI request failed (attempt ${attempt + 1}/${maxRetries + 1}): ${e.message}. Retrying...`,
      );
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw lastError || new Error("AI request failed after retries.");
}

// ---------------------------------------------------------------------------
// Program shape validation
// ---------------------------------------------------------------------------

function validateProgramShape(parsed: any): void {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new AiResponseError(
      "VALIDATION_ERROR",
      "Top-level response was not a JSON object.",
    );
  }
  if (!Array.isArray(parsed.items)) {
    throw new AiResponseError(
      "VALIDATION_ERROR",
      `Missing or invalid "items" array.`,
    );
  }
  if (parsed.items.length === 0) {
    throw new AiResponseError(
      "VALIDATION_ERROR",
      `"items" array is empty — expected 7 days.`,
    );
  }

  const seenDays = new Set<number>();
  parsed.items.forEach((item: any, idx: number) => {
    if (
      typeof item?.day_index !== "number" ||
      item.day_index < 0 ||
      item.day_index > 6
    ) {
      throw new AiResponseError(
        "VALIDATION_ERROR",
        `Item ${idx} has a missing/invalid "day_index" (expected a number 0-6).`,
      );
    }
    seenDays.add(item.day_index);
    if (!item.title || typeof item.title !== "string") {
      throw new AiResponseError(
        "VALIDATION_ERROR",
        `Item ${idx} (day_index ${item.day_index}) is missing a "title".`,
      );
    }
    if (!Array.isArray(item.details) || item.details.length < 3) {
      throw new AiResponseError(
        "VALIDATION_ERROR",
        `Item ${idx} (day_index ${item.day_index}) needs a "details" array with at least 3 entries.`,
      );
    }
    item.details.forEach((d: any, di: number) => {
      if (!d || !d.name || typeof d.name !== "string") {
        throw new AiResponseError(
          "VALIDATION_ERROR",
          `Detail ${di} of item ${idx} (day_index ${item.day_index}) is missing a "name".`,
        );
      }
    });
  });

  if (seenDays.size < 7) {
    const missing = [0, 1, 2, 3, 4, 5, 6].filter((d) => !seenDays.has(d));
    throw new AiResponseError(
      "VALIDATION_ERROR",
      `Response is missing day_index(es): ${missing.join(", ")}. All 7 days (0-6) are required.`,
    );
  }
}

function buildFinalErrorMessage(e: any): string {
  if (e instanceof AiResponseError) {
    if (e.code === "TRUNCATED") {
      return "The AI response kept getting cut off even after increasing the token budget. Try a model with a larger output limit, or simplify the request.";
    }
    if (e.code === "VALIDATION_ERROR") {
      return `The AI kept returning JSON that didn't match the required structure (${e.message}). Try regenerating, or switch to a different model.`;
    }
    if (e.code === "PARSE_ERROR" || e.code === "EMPTY") {
      return "Failed to get valid JSON from the AI after multiple attempts. Try a different model or regenerate.";
    }
  }
  return e?.message || "Failed to generate the program.";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

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
  const apiKey = provider.api_key.trim();

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

  const localeInstructions = `
  The user is in India.

  Use Indian standards:
  - Use kilograms (kg) for body weight and exercise weights.
  - Use centimeters (cm) for height.
  - Use kilometers (km) for distance.
  - Use liters (L) and milliliters (ml) for liquids.
  - Use Celsius (°C) if temperatures are mentioned.

  For meal plans:
  - Prefer Indian foods unless the user explicitly requests another cuisine.
  - Use ingredients commonly available in India.
  - Mention portions in grams, cups, rotis, bowls, etc.
  - Mention prices in INR if discussing costs.
  `;

  const systemPrompt =
    localeInstructions +
    (type === "gym"
      ? `You are an expert personal trainer creating weekly workout programs. Use the user's gym history, daily logs, and goals to create a personalized weekly program.)

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
Return ONLY valid JSON.
`);

  const baseUserMessage = `Generate a weekly ${type === "gym" ? "workout" : "meal"} program for the user for the week of ${weekStart.toISOString().split("T")[0]} to ${weekEnd.toISOString().split("T")[0]}.
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
          ${
            type === "gym"
              ? `"sets": 4,
          "reps": 8,
          "rest_seconds": 90,
          "weight": "185 kg",
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
- Output exactly 7 items, one for each day of the week (day_index 0-6, all 7 present, no duplicates).
- Every item MUST include a "details" array with at least 3 entries.
- For gym programs, each detail is an exercise with sets, reps, rest_seconds, weight, notes.
- For meal programs, each detail is a food item with calories, protein, carbs, fat, portion.
- Provide real, actionable numbers based on the user's history and goals.
- Return valid JSON only.`;

  const MAX_ATTEMPTS = 3;
  const MAX_TOKEN_CEILING = 16384;
  let maxTokens = 8192;
  let correction = "";
  let rawResponse = "";
  let parsed: any;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const completion = await makeRequestWithRetry(
        provider.provider,
        provider.model,
        apiKey,
        systemPrompt,
        baseUserMessage + correction,
        120000,
        1,
        maxTokens,
        true,
      );
      rawResponse = completion.text;

      if (completion.truncated) {
        maxTokens = Math.min(maxTokens * 2, MAX_TOKEN_CEILING);
        throw new AiResponseError(
          "TRUNCATED",
          "Response was cut off before completion (ran out of output tokens).",
        );
      }

      parsed = parseAiJson(rawResponse);
      validateProgramShape(parsed);
      lastError = undefined;
      break;
    } catch (e: any) {
      lastError = e;
      if (attempt === MAX_ATTEMPTS) break;

      if (e instanceof AiResponseError && e.code === "TRUNCATED") {
        console.warn(
          `Program generation attempt ${attempt} was truncated. Retrying with maxTokens=${maxTokens}...`,
        );
      } else {
        console.warn(
          `Program generation attempt ${attempt} failed: ${e.message}. Retrying with a corrective prompt...`,
        );
        correction = `\n\nIMPORTANT: Your previous response was invalid (${e.message}). Fix this and return ONLY a single valid JSON object matching the schema exactly — no markdown, no commentary, all 7 days present.`;
      }
    }
  }

  if (lastError) {
    console.error("AI raw response (final failed attempt):", rawResponse);
    throw new Error(buildFinalErrorMessage(lastError));
  }

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

export async function verifyProvider(
  provider: string,
  model: string,
  apiKey: string,
): Promise<{ ok: boolean; message: string }> {
  if (!apiKey.trim()) {
    return { ok: false, message: "API key is empty." };
  }

  try {
    await makeRequestWithRetry(
      provider,
      model,
      apiKey.trim(),
      "You are a helpful assistant. Reply with a single short sentence.",
      "Say 'API key works!' and nothing else.",
      30000,
      0,
      256,
      false,
    );
    return {
      ok: true,
      message: "API key is valid and the provider responded.",
    };
  } catch (e: any) {
    return { ok: false, message: e.message || "Verification failed." };
  }
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

  const completion = await makeRequestWithRetry(
    provider.provider,
    provider.model,
    provider.api_key.trim(),
    systemPrompt,
    userMessage,
    90000,
    1,
    4096,
    false,
  );
  return completion.text;
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
