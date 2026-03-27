export default async function handler(req, res) {
  // Enable CORS for this endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { politician } = req.query;
    
    if (!politician) {
      return res.status(400).json({ error: 'Politician name is required' });
    }
    
    // Fetch from OpenParliament API through our server
    const params = new URLSearchParams({
      format: 'json',
      limit: 5,
      politician: politician
    });
    
    const response = await fetch(`https://api.openparliament.ca/statements/?${params}`);
    
    if (!response.ok) {
      throw new Error(`OpenParliament API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Return the data to the client
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
}