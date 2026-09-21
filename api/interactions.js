import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured.' });

  const { model = 'gemini-3.5-flash', input, stream } = req.body;

  /* ---------------------------------------------------------------
   * Streaming path: pipe Gemini's SSE directly to the browser.
   * --------------------------------------------------------------- */
  if (stream) {
    try {
      const upstream = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/interactions?alt=sse',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({ model, input, stream: true }),
        }
      );

      if (!upstream.ok) {
        const txt = await upstream.text();
        return res.status(upstream.status).json({
          error: 'Upstream error',
          details: txt.slice(0, 500),
        });
      }

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');   // disable Vercel's buffering

      const reader = upstream.body.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
      return;
    } catch (err) {
      console.error('[stream] error:', err);
      return res.status(500).json({ error: 'Streaming failed', details: err.message });
    }
  }

  /* ---------------------------------------------------------------
   * Non-streaming fallback (original behavior).
   * --------------------------------------------------------------- */
  try {
    const ai = new GoogleGenAI({ apiKey });
    const interaction = await ai.interactions.create({ model, input });
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
