import * as db from '../db/service';

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
  const [dailyLogs, gymLogs, nutritionLogs, journalEntries, habits, habitLogs, goals, transactions, timetable] =
    await Promise.all([
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
  return { dailyLogs, gymLogs, nutritionLogs, journalEntries, habits, habitLogs, goals, transactions, timetable };
}

function buildContextString(ctx: AiContext): string {
  const sections: string[] = [];

  if (ctx.gymLogs.length > 0) {
    sections.push('=== GYM WORKOUT HISTORY ===');
    sections.push(ctx.gymLogs.map((l: any) =>
      `[${l.date}] ${l.workout_name}: ${l.exercises} (${l.duration_minutes}min)${l.notes ? ' - ' + l.notes : ''}`
    ).join('\n'));
  }

  if (ctx.nutritionLogs.length > 0) {
    sections.push('=== NUTRITION HISTORY ===');
    sections.push(ctx.nutritionLogs.map((l: any) =>
      `[${l.date}] ${l.meal_type}: ${l.foods} (${l.calories}cal, ${l.protein_g}g protein)${l.notes ? ' - ' + l.notes : ''}`
    ).join('\n'));
  }

  if (ctx.dailyLogs.length > 0) {
    sections.push('=== DAILY TRACKING ===');
    sections.push(ctx.dailyLogs.map((l: any) =>
      `[${l.date}] Weight:${l.weight || '—'} Water:${l.water_ml || 0}ml Steps:${l.steps || 0} Mood:${l.mood || '—'} Sleep:${l.sleep_hours || '—'}h${l.notes ? ' Notes:' + l.notes : ''}`
    ).join('\n'));
  }

  if (ctx.journalEntries.length > 0) {
    sections.push('=== JOURNAL ENTRIES ===');
    sections.push(ctx.journalEntries.map((e: any) =>
      `[${e.date}] ${e.title ? e.title + ': ' : ''}${e.content}`
    ).join('\n'));
  }

  if (ctx.habits.length > 0) {
    sections.push('=== HABITS ===');
    sections.push(ctx.habits.map((h: any) =>
      `${h.emoji} ${h.name} (target: ${h.target_per_day} ${h.unit || 'times'}/day)`
    ).join('\n'));
  }

  if (ctx.goals.length > 0) {
    sections.push('=== GOALS ===');
    sections.push(ctx.goals.map((g: any) =>
      `${g.title}: ${g.current_value}/${g.target_value} ${g.unit || ''} (${g.area || 'General'})`
    ).join('\n'));
  }

  if (ctx.transactions.length > 0) {
    sections.push('=== TRANSACTIONS ===');
    sections.push(ctx.transactions.map((t: any) =>
      `[${t.date}] ${t.type === 'income' ? '+' : '-'}$${t.amount} - ${t.category}${t.description ? ': ' + t.description : ''}`
    ).join('\n'));
  }

  if (ctx.timetable.length > 0) {
    sections.push('=== WEEKLY SCHEDULE ===');
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    sections.push(ctx.timetable.map((t: any) =>
      `${dayNames[t.day_of_week]} ${t.start_time} - ${t.activity}`
    ).join('\n'));
  }

  return sections.join('\n\n');
}

async function makeRequest(
  provider: string,
  model: string,
  apiKey: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  switch (provider) {
    case 'openai': {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'OpenAI API error');
      return data.choices[0].message.content;
    }

    case 'anthropic': {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Anthropic API error');
      return data.content[0].text;
    }

    case 'google': {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `${systemPrompt}\n\n${userMessage}` }],
            }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Google API error');
      return data.candidates[0].content.parts[0].text;
    }

    case 'openrouter': {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://arete.app',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'OpenRouter API error');
      return data.choices[0].message.content;
    }

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export async function generateAiProgram(
  type: 'gym' | 'food',
  userPreferences?: string
): Promise<{
  title: string;
  items: { day_index: number; day_label: string; title: string; description: string; sort_order: number }[];
}> {
  const provider = await db.getActiveAiProvider();
  if (!provider) throw new Error('No active AI provider configured. Go to AI Settings to set one up.');
  if (!provider.api_key) throw new Error('API key not set for the active provider.');

  const context = await collectContext();
  const contextStr = buildContextString(context);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const systemPrompt = type === 'gym'
    ? 'You are an expert personal trainer creating weekly workout programs. Use the user\'s gym history, daily logs, and goals to create a personalized weekly program. Return ONLY valid JSON.'
    : 'You are an expert nutritionist creating weekly meal plans. Use the user\'s nutrition history, daily logs, and goals to create a personalized weekly meal plan. Return ONLY valid JSON.';

  const userMessage = `Generate a weekly ${type === 'gym' ? 'workout' : 'meal'} program for the user for the week of ${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}.

Here is the user's historical data to personalize the plan:

${contextStr}

${userPreferences ? `\nUser preferences:\n${userPreferences}\n` : ''}

Respond with ONLY valid JSON in this exact format:
{
  "title": "Week of [date] - [Program Name]",
  "items": [
    {
      "day_index": 0,
      "day_label": "Sunday",
      "title": "Day title (e.g. Push Day or High Protein Day)",
      "description": "Detailed description of what to do/eat",
      "sort_order": 0
    }
  ]
}

Generate exactly 7 items, one for each day of the week (day_index 0-6). Make the plan personalized based on the user's data, goals, and history.`;

  const rawResponse = await makeRequest(provider.provider, provider.model, provider.api_key, systemPrompt, userMessage);

  const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse AI response. Unexpected format.');

  const parsed = JSON.parse(jsonMatch[0]);

  const ws = weekStart.toISOString().split('T')[0];
  const we = weekEnd.toISOString().split('T')[0];

  const programId = await db.saveAiProgram({
    type,
    title: parsed.title || `${type === 'gym' ? 'Workout' : 'Meal'} Plan - ${ws}`,
    week_start: ws,
    week_end: we,
    context_snapshot: contextStr,
    raw_response: rawResponse,
    items: parsed.items.map((item: any) => ({
      day_index: item.day_index,
      day_label: item.day_label || dayLabels[item.day_index],
      title: item.title,
      description: item.description,
      sort_order: item.sort_order ?? item.day_index,
    })),
  });

  const full = await db.getAiProgramWithItems(Number(programId));
  return {
    title: full.title,
    items: full.items,
  };
}

export async function askAi(question: string): Promise<string> {
  const provider = await db.getActiveAiProvider();
  if (!provider) throw new Error('No active AI provider configured.');
  if (!provider.api_key) throw new Error('API key not set for the active provider.');

  const context = await collectContext();
  const contextStr = buildContextString(context);

  const systemPrompt = 'You are an AI assistant with full context of the user\'s life tracking data. Use the provided data to give personalized, insightful answers. Be concise and helpful.';

  const userMessage = `Here is the user's data:\n\n${contextStr}\n\nUser question: ${question}`;

  return await makeRequest(provider.provider, provider.model, provider.api_key, systemPrompt, userMessage);
}

export const PROVIDERS = [
  { id: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4o-mini-free', 'gpt-4-turbo'] },
  { id: 'anthropic', label: 'Anthropic (Claude)', models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'] },
  { id: 'google', label: 'Google (Gemini)', models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-3.5-flash'] },
  { id: 'openrouter', label: 'OpenRouter', models: [
    'google/gemini-2.5-flash', 'google/gemini-2.0-flash-exp:free',
    'openai/gpt-4o-mini', 'openai/gpt-4o',
    'anthropic/claude-3.5-sonnet', 'anthropic/claude-3.5-haiku',
    'deepseek/deepseek-chat', 'deepseek/deepseek-r1',
    'meta-llama/llama-3.2-3b-instruct:free', 'meta-llama/llama-3.1-8b-instruct:free',
    'mistralai/mistral-small', 'mistralai/mistral-7b-instruct:free',
  ]},
] as const;
