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
    const { action, fileSearchStoreName, file, query, model = 'gemini-3.8-flash' } = req.body;
    
    if (action === 'createStore') {
      const store = await ai.fileSearchStores.create({
        config: { displayName: 'My File Search Store', embeddingModel: 'models/gemini-embedding-2' },
      });
      return res.status(200).json({ store });
    }
    
    if (action === 'upload') {
      const operation = await ai.fileSearchStores.uploadToFileSearchStore({
        file,
        fileSearchStoreName,
        config: { displayName: 'Uploaded Document' },
      });
      // In a real app, you'd poll the operation until done
      return res.status(200).json({ operation });
    }
    
    if (action === 'query') {
      const interaction = await ai.interactions.create({
        model,
        input: query,
        tools: [{ type: 'file_search', file_search_store_names: [fileSearchStoreName] }],
      });
      
      // Extract citations from the response
      const citations = [];
      for (const step of interaction.steps) {
        if (step.type === 'model_output') {
          for (const block of step.content) {
            if (block.annotations) {
              for (const ann of block.annotations) {
                if (ann.type === 'file_citation') {
                  citations.push({ fileName: ann.file_name, source: ann.source });
                }
              }
            }
          }
        }
      }
      return res.status(200).json({ text: interaction.output_text, citations });
    }
    
    return res.status(400).json({ error: 'Invalid action. Use createStore, upload, or query.' });
  } catch (error) {
    console.error('File Search Error:', error);
    return res.status(500).json({ error: 'File Search operation failed.', details: error.message });
  }
}