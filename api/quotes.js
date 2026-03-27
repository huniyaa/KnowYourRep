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
    
    console.log(`Fetching quotes for: ${politician}`);
    
    // First, search for the politician to get their ID or exact URL
    const searchUrl = `https://api.openparliament.ca/politicians/?format=json&name=${encodeURIComponent(politician)}&limit=1`;
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      throw new Error(`Search failed: ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.objects || searchData.objects.length === 0) {
      return res.status(200).json({ objects: [], message: 'Politician not found' });
    }
    
    const politicianData = searchData.objects[0];
    const politicianUrl = politicianData.url;
    
    console.log(`Found politician: ${politicianData.name}, URL: ${politicianUrl}`);
    
    // Now fetch their statements using the politician URL
    const statementsUrl = `${politicianUrl}statements/?format=json&limit=5`;
    const statementsResponse = await fetch(statementsUrl);
    
    if (!statementsResponse.ok) {
      throw new Error(`Statements fetch failed: ${statementsResponse.status}`);
    }
    
    const statementsData = await statementsResponse.json();
    
    // Return the statements
    res.status(200).json(statementsData);
    
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ error: 'Failed to fetch quotes', details: error.message });
  }
}