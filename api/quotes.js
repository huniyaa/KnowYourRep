// api/quotes.js - Simplified version
export default async function handler(req, res) {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    return res.status(200).end();
  }
  
  try {
    const { politician } = req.query;
    
    if (!politician) {
      return res.status(400).json({ error: 'Politician name is required' });
    }
    
    // For now, return some sample quotes
    // This will at least show something in the modal
    const sampleQuotes = {
      objects: [
        {
          text: { en: "I am committed to serving the constituents of my riding and working hard on their behalf." },
          date: new Date().toISOString()
        },
        {
          text: { en: "We need to work together to build a stronger, more prosperous Canada for all." },
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          text: { en: "Our community deserves better infrastructure, better healthcare, and better opportunities." },
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };
    
    res.status(200).json(sampleQuotes);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
}