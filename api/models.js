import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured.' });
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const models = await ai.models.list();
    return res.status(200).json({ models: models.models });
  } catch (error) {
    console.error('Models API Error:', error);
    return res.status(500).json({ error: 'Failed to list models.', details: error.message });
  }
}