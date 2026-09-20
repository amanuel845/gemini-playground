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
    const { prompt, model = 'gemini-3.1-flash-image' } = req.body;

    const interaction = await ai.interactions.create({
      model: model,
      input: prompt,
    });

    // The image data is base64-encoded in the output_image property
    const generatedImage = interaction.output_image;
    if (!generatedImage || !generatedImage.data) {
      return res.status(500).json({ error: 'No image was generated.' });
    }

    return res.status(200).json({
      image: generatedImage.data, // base64 string
      text: interaction.output_text, // sometimes the model returns text too
    });
  } catch (error) {
    console.error('Image Generation Error:', error);
    return res.status(500).json({ error: 'Failed to generate image.', details: error.message });
  }
}
