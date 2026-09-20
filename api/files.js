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
      // Upload a file (expects base64 data in req.body)
      const { fileData, mimeType, displayName } = req.body;
      const file = await ai.files.upload({
        file: Buffer.from(fileData, 'base64'),
        config: { mimeType, displayName },
      });
      return res.status(200).json({ file });
    }
    
    if (req.method === 'GET') {
      // List files
      const files = await ai.files.list();
      return res.status(200).json({ files: files.files });
    }
    
    if (req.method === 'DELETE') {
      // Delete a file
      const { fileName } = req.body;
      await ai.files.delete({ name: fileName });
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error('Files API Error:', error);
    return res.status(500).json({ error: 'Files API operation failed.', details: error.message });
  }
}