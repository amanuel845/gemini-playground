import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured.' });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const { model = 'gemini-3.5-flash', input } = req.body;

    const interaction = await ai.interactions.create({
      model,
      input,
    });

    return res.status(200).json({
      text: interaction.output_text,
      usage: interaction.usage,
    });
  } catch (error) {
    console.error('Interactions Error:', error);
    return res.status(500).json({
      error: 'Failed to generate content.',
      details: error.message,
    });
  }
}
