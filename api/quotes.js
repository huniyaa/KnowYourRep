export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { politician } = req.query;
    
    if (!politician) {
      return res.status(400).json({ error: 'Politician name is required' });
    }
    
    console.log(`Searching for politician: ${politician}`);
    
    // Step 1: Find the politician's exact URL
    const searchUrl = `https://api.openparliament.ca/politicians/?format=json&limit=10&name=${encodeURIComponent(politician)}`;
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      console.error(`Search failed: ${searchResponse.status}`);
      return res.status(200).json({ objects: [] });
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.objects || searchData.objects.length === 0) {
      console.log(`No politician found: ${politician}`);
      return res.status(200).json({ objects: [] });
    }
    
    // Find exact match or best match
    let politicianData = searchData.objects.find(p => 
      p.name.toLowerCase() === politician.toLowerCase()
    );
    
    if (!politicianData) {
      politicianData = searchData.objects[0];
      console.log(`Using closest match: ${politicianData.name}`);
    }
    
    const politicianUrl = politicianData.url;
    console.log(`Found politician: ${politicianData.name}, URL: ${politicianUrl}`);
    
    // Step 2: Fetch their statements
    const statementsUrl = `${politicianUrl}statements/?format=json&limit=10`;
    const statementsResponse = await fetch(statementsUrl);
    
    if (!statementsResponse.ok) {
      console.error(`Statements fetch failed: ${statementsResponse.status}`);
      return res.status(200).json({ objects: [] });
    }
    
    const statementsData = await statementsResponse.json();
    
    // Format the statements
    const formattedStatements = statementsData.objects?.map(statement => ({
      text: { en: statement.text?.en || "No text available" },
      date: statement.date,
      context: statement.context?.en
    })).filter(s => s.text.en !== "No text available") || [];
    
    console.log(`Found ${formattedStatements.length} real statements for ${politicianData.name}`);
    
    res.status(200).json({ objects: formattedStatements });
    
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(200).json({ objects: [] });
  }
}