const OpenAI = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');

const generateSummary = async (transcript, model, apiKey) => {
  if (model === 'openai') {
    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Summarize the following meeting transcript." },
        { role: "user", content: transcript }
      ],
    });
    return response.choices[0].message.content;
  } else if (model === 'anthropic') {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1024,
      messages: [{ role: "user", content: `Summarize this meeting transcript:\n\n${transcript}` }],
    });
    return response.content[0].text;
  } else {
    throw new Error('Unsupported AI model');
  }
};

module.exports = { generateSummary };
