import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured.' });

  const ai = new GoogleGenAI({ apiKey });

  try {
    if (req.method === 'POST') {
      const { fileData, mimeType, displayName } = req.body;

      if (!fileData || !mimeType) {
        return res.status(400).json({ error: 'fileData and mimeType are required.' });
      }

      // ✅ FIX: Convert base64 → Buffer → Blob (SDK expects a Blob, not a Buffer)
      const buffer = Buffer.from(fileData, 'base64');
      const blob = new Blob([buffer], { type: mimeType });

      const file = await ai.files.upload({
        file: blob,
        config: { 
          mimeType, 
          displayName: displayName || 'uploaded-file' 
        },
      });

      return res.status(200).json({ file });
    }

    if (req.method === 'GET') {
      const files = await ai.files.list();
      return res.status(200).json({ files: files.files });
    }

    if (req.method === 'DELETE') {
      const { fileName } = req.body;
      await ai.files.delete({ name: fileName });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Files API Error:', error);
    return res.status(500).json({ 
      error: 'Files API operation failed.', 
      details: error.message 
    });
  }
}
