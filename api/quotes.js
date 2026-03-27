export default async function handler(req, res) {
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
    
    // First, search for the politician to get their slug
    const searchUrl = `https://api.openparliament.ca/politicians/?format=json&limit=100&name=${encodeURIComponent(politician)}`;
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      console.error(`Search failed: ${searchResponse.status}`);
      return res.status(200).json({ objects: [] });
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.objects || searchData.objects.length === 0) {
      console.log(`No politician found for: ${politician}`);
      return res.status(200).json({ objects: [] });
    }
    
    // Find the politician by name
    let politicianObj = searchData.objects[0];
    
    // Try to find exact match if multiple
    if (searchData.objects.length > 1) {
      politicianObj = searchData.objects.find(p => 
        p.name.toLowerCase() === politician.toLowerCase()
      ) || searchData.objects[0];
    }
    
    // Get the politician's slug from the URL
    const urlParts = politicianObj.url.split('/').filter(Boolean);
    const slug = urlParts[urlParts.length - 1];
    
    console.log(`Found politician: ${politicianObj.name}, slug: ${slug}`);
    
    // Use the correct endpoint for speeches/statements
    const statementsUrl = `https://api.openparliament.ca/speeches/?format=json&limit=5&politician=${slug}`;
    console.log(`Fetching from: ${statementsUrl}`);
    
    const statementsResponse = await fetch(statementsUrl);
    
    if (!statementsResponse.ok) {
      console.error(`Statements fetch failed: ${statementsResponse.status}`);
      return res.status(200).json({ objects: [] });
    }
    
    const statementsData = await statementsResponse.json();
    
    // Format the statements
    const formattedStatements = statementsData.objects?.map(statement => {
      let text = statement.text || "";
      
      // Clean up the text
      text = text.replace(/\s+/g, ' ').trim();
      
      // Truncate if too long
      if (text.length > 400) {
        text = text.substring(0, 400) + "...";
      }
      
      return {
        text: { en: text },
        date: statement.date,
        context: "House of Commons"
      };
    }).filter(s => s.text.en && s.text.en !== "" && s.text.en !== "No text available") || [];
    
    console.log(`Found ${formattedStatements.length} statements for ${politicianObj.name}`);
    
    res.status(200).json({ objects: formattedStatements });
    
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(200).json({ objects: [] });
  }
}