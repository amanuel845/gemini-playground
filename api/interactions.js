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
    const { model = 'gemini-3.8-flash', input, history } = req.body;
    
    // Build the input array, optionally including conversation history
    let fullInput = input;
    if (history && Array.isArray(history)) {
      fullInput = [
        ...history.map(msg => ({ type: msg.role === 'user' ? 'user_input' : 'model_output', content: [{ type: 'text', text: msg.text }] })),
        { type: 'user_input', content: [{ type: 'text', text: input }] }
      ];
    }
    
    const interaction = await ai.interactions.create({
      model,
      input: fullInput,
    });
    
    return res.status(200).json({
      text: interaction.output_text,
      steps: interaction.steps,
      usage: interaction.usage,
    });
  } catch (error) {
    console.error('Interactions API Error:', error);
    if (error.status === 429) return res.status(429).json({ error: 'Rate limit exceeded. Please wait.' });
    return res.status(500).json({ error: 'Failed to generate content.', details: error.message });
  }
}