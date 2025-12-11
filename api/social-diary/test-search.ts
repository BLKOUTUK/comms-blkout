import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

  if (!TAVILY_API_KEY) {
    return res.status(500).json({ error: 'Missing TAVILY_API_KEY' });
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: 'UK Black Pride 2025',
        search_depth: 'basic',
        max_results: 5
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: 'Tavily API error', details: errorText });
    }

    const data = await response.json();

    return res.status(200).json({
      success: true,
      query: 'UK Black Pride 2025',
      resultCount: data.results?.length || 0,
      results: data.results?.map((r: any) => ({ title: r.title, url: r.url })) || []
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Fetch failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
