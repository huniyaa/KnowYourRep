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
    
    // Search with a broader query first
    const searchUrl = `https://api.openparliament.ca/politicians/?format=json&limit=20`;
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      console.error(`Search failed: ${searchResponse.status}`);
      return res.status(200).json({ objects: [] });
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.objects || searchData.objects.length === 0) {
      console.log(`No politicians found`);
      return res.status(200).json({ objects: [] });
    }
    
    // Log all politicians for debugging
    console.log(`Found ${searchData.objects.length} politicians total`);
    
    // Try to find exact match
    let politicianData = searchData.objects.find(p => 
      p.name.toLowerCase() === politician.toLowerCase()
    );
    
    // If no exact match, try partial match
    if (!politicianData) {
      const searchName = politician.toLowerCase().split(' ');
      politicianData = searchData.objects.find(p => {
        const pName = p.name.toLowerCase();
        return searchName.every(part => pName.includes(part));
      });
    }
    
    // If still no match, try first name + last name
    if (!politicianData) {
      const [firstName, lastName] = politician.toLowerCase().split(' ');
      politicianData = searchData.objects.find(p => {
        const pName = p.name.toLowerCase();
        return pName.includes(firstName) && pName.includes(lastName);
      });
    }
    
    if (!politicianData) {
      console.log(`No match found for: ${politician}`);
      console.log(`Available politicians: ${searchData.objects.slice(0, 10).map(p => p.name).join(', ')}`);
      return res.status(200).json({ objects: [] });
    }
    
    const politicianUrl = politicianData.url;
    console.log(`Found politician: ${politicianData.name}, URL: ${politicianUrl}`);
    
    // Fetch their statements
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