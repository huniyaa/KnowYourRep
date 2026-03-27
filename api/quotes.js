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
    const speechesUrl = `https://api.openparliament.ca/speeches/?format=json&limit=1&politician=${slug}`;
    const speechesResponse = await fetch(speechesUrl);
    
    if (!speechesResponse.ok) {
      return res.status(200).json({ objects: [] });
    }
    
    const speechesData = await speechesResponse.json();
    
    // Format the speeches and clean HTML
    const formatted = speechesData.objects?.map(speech => {
      // Get the text from the content field
      let text = "";
      
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
      
      if (text) {
        // Strip HTML tags
        text = text.replace(/<[^>]*>/g, ' ');
        
        // Replace HTML entities
        text = text.replace(/&quot;/g, '"')
                   .replace(/&amp;/g, '&')
                   .replace(/&lt;/g, '<')
                   .replace(/&gt;/g, '>')
                   .replace(/&nbsp;/g, ' ')
                   .replace(/&#39;/g, "'");
        
        // Clean up whitespace
        text = text.replace(/\s+/g, ' ').trim();
        
        // Truncate if too long
        if (text.length > 450) {
          text = text.substring(0, 450) + "...";
        }
      }
      
      // Get the date
      const date = speech.time || speech.date;
      let formattedDate = "";
      if (date) {
        try {
          formattedDate = new Date(date).toLocaleDateString('en-CA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } catch (e) {
          formattedDate = date;
        }
      }
      
      return {
        text: { en: text || "No text available" },
        date: formattedDate,
        context: "House of Commons Speech"
      };
    }).filter(s => s.text.en && s.text.en !== "No text available" && s.text.en !== "") || [];
    
    console.log(`Found ${formatted.length} cleaned speeches for ${politicianObj.name}`);
    
    res.status(200).json({ objects: formatted });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(200).json({ objects: [] });
  }
}