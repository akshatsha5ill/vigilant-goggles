const OpenAI = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');

const getClient = (model, apiKey) => {
  if (model === 'openai') {
    return { client: new OpenAI({ apiKey }), provider: 'openai' };
  } else if (model === 'anthropic') {
    return { client: new Anthropic({ apiKey }), provider: 'anthropic' };
  }
  throw new Error('Unsupported AI model');
};

const generateSummary = async (transcript, model, apiKey) => {
  const { client, provider } = getClient(model, apiKey);
  const systemPrompt = "You are an expert meeting analyst. Provide a clear, concise executive summary of the following meeting transcript. Focus on key decisions, outcomes, and important discussion points.";

  if (provider === 'openai') {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: transcript }
      ],
    });
    return response.choices[0].message.content;
  }
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: transcript }],
  });
  return response.content[0].text;
};

const generateActionItems = async (transcript, model, apiKey) => {
  const { client, provider } = getClient(model, apiKey);
  const systemPrompt = `Extract action items from the following meeting transcript. Return ONLY a JSON array of objects with "task" (string) and "assignee" (string or "Unassigned") fields. Example: [{"task": "Follow up with John", "assignee": "Sales Rep"}]`;

  let raw;
  if (provider === 'openai') {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: transcript }
      ],
    });
    raw = response.choices[0].message.content;
  } else {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: transcript }],
    });
    raw = response.content[0].text;
  }

  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch {
    return [];
  }
};

const analyzeSentiment = async (transcript, model, apiKey) => {
  const { client, provider } = getClient(model, apiKey);
  const systemPrompt = `Analyze the sentiment of this meeting transcript. Return ONLY a JSON object with "overall" (positive/negative/neutral), "score" (0-100 where 100 is very positive), and "notes" (brief explanation). Example: {"overall":"positive","score":75,"notes":"Meeting was productive with clear next steps."}`;

  let raw;
  if (provider === 'openai') {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: transcript }
      ],
    });
    raw = response.choices[0].message.content;
  } else {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: transcript }],
    });
    raw = response.content[0].text;
  }

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { overall: 'neutral', score: 50, notes: 'Unable to analyze sentiment.' };
  } catch {
    return { overall: 'neutral', score: 50, notes: 'Unable to analyze sentiment.' };
  }
};

module.exports = { generateSummary, generateActionItems, analyzeSentiment };
