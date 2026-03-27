export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { politician, riding } = req.query;
    
    let searchUrl = `https://api.openparliament.ca/politicians/?format=json&limit=20`;
    
    // If we have a riding, search by that too
    if (riding) {
      searchUrl = `https://api.openparliament.ca/politicians/?format=json&limit=20&riding=${encodeURIComponent(riding)}`;
    }
    
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      console.error(`Search failed: ${searchResponse.status}`);
      return res.status(200).json({ objects: [] });
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.objects || searchData.objects.length === 0) {
      return res.status(200).json({ objects: [] });
    }
    
    // Find the politician
    let politicianData = null;
    
    if (politician) {
      politicianData = searchData.objects.find(p => 
        p.name.toLowerCase() === politician.toLowerCase()
      );
      
      if (!politicianData) {
        const searchName = politician.toLowerCase().split(' ');
        politicianData = searchData.objects.find(p => {
          const pName = p.name.toLowerCase();
          return searchName.every(part => pName.includes(part));
        });
      }
    }
    
    if (!politicianData && searchData.objects.length > 0) {
      politicianData = searchData.objects[0];
    }
    
    if (!politicianData) {
      return res.status(200).json({ objects: [] });
    }
    
    const politicianUrl = politicianData.url;
    console.log(`Fetching statements from: ${politicianUrl}`);
    
    const statementsUrl = `${politicianUrl}statements/?format=json&limit=10`;
    const statementsResponse = await fetch(statementsUrl);
    
    if (!statementsResponse.ok) {
      return res.status(200).json({ objects: [] });
    }
    
    const statementsData = await statementsResponse.json();
    
    const formattedStatements = statementsData.objects?.map(statement => ({
      text: { en: statement.text?.en || "No text available" },
      date: statement.date,
      context: statement.context?.en
    })).filter(s => s.text.en !== "No text available") || [];
    
    console.log(`Found ${formattedStatements.length} statements for ${politicianData.name}`);
    
    res.status(200).json({ objects: formattedStatements });
    
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(200).json({ objects: [] });
  }
}