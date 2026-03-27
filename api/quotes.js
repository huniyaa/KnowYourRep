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
    
    // First, get the politician's slug
    const searchUrl = `https://api.openparliament.ca/politicians/?format=json&limit=50&name=${encodeURIComponent(politician)}`;
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      return res.status(200).json({ objects: [] });
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.objects || searchData.objects.length === 0) {
      return res.status(200).json({ objects: [] });
    }
    
    // Get the slug from the URL
    const politicianObj = searchData.objects[0];
    const urlParts = politicianObj.url.split('/').filter(Boolean);
    const slug = urlParts[urlParts.length - 1];
    
    console.log(`Found: ${politicianObj.name}, slug: ${slug}`);
    
    // Fetch speeches using the correct endpoint
    const speechesUrl = `https://api.openparliament.ca/speeches/?format=json&limit=5&politician=${slug}`;
    const speechesResponse = await fetch(speechesUrl);
    
    if (!speechesResponse.ok) {
      return res.status(200).json({ objects: [] });
    }
    
    const speechesData = await speechesResponse.json();
    
    // Format the speeches - FIXED: using content field, not text
    const formatted = speechesData.objects?.map(speech => {
      // Get the text from the content field
      let text = "";
      
      // Check different possible field names
      if (speech.content) {
        if (typeof speech.content === 'string') {
          text = speech.content;
        } else if (speech.content.en) {
          text = speech.content.en;
        } else if (speech.content.text) {
          text = speech.content.text;
        }
      } else if (speech.text) {
        text = speech.text;
      }
      
      // Clean up the text
      if (text) {
        text = text.replace(/\s+/g, ' ').trim();
        
        // Truncate if too long
        if (text.length > 400) {
          text = text.substring(0, 400) + "...";
        }
      }
      
      // Get the date from time field or date field
      const date = speech.time || speech.date;
      
      return {
        text: { en: text || "No text available" },
        date: date,
        context: "House of Commons Speech"
      };
    }).filter(s => s.text.en && s.text.en !== "No text available") || [];
    
    console.log(`Found ${formatted.length} speeches for ${politicianObj.name}`);
    
    res.status(200).json({ objects: formatted });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(200).json({ objects: [] });
  }
}