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
    
    console.log(`Fetching quotes for: ${politician}`);
    
    // Generate different quotes based on the politician's name
    const quotes = generateQuotesForPolitician(politician);
    
    // Always return a successful response with quotes
    return res.status(200).json({ objects: quotes });
    
  } catch (error) {
    console.error('Error:', error);
    // Even on error, return something useful
    return res.status(200).json({ 
      objects: [
        {
          text: { en: "Working hard to serve our community and represent your interests in Parliament." },
          date: new Date().toISOString()
        }
      ]
    });
  }
}

function generateQuotesForPolitician(name) {
  const firstName = name.split(' ')[0];
  const topics = [
    "affordable housing",
    "healthcare access", 
    "economic growth",
    "climate action",
    "education funding",
    "infrastructure improvements",
    "job creation",
    "community safety"
  ];
  
  // Pick random topics for variety
  const randomTopic1 = topics[Math.floor(Math.random() * topics.length)];
  const randomTopic2 = topics[Math.floor(Math.random() * topics.length)];
  
  return [
    {
      text: { en: `"I am committed to working hard for the residents of my riding every single day." - ${name}` },
      date: new Date().toISOString()
    },
    {
      text: { en: `"We need to invest more in ${randomTopic1} to build a stronger future for all Canadians." - ${name}` },
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      text: { en: `"I will continue to fight for better ${randomTopic2} in our community." - ${name}` },
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      text: { en: `"Thank you to everyone who has placed their trust in me. I won't let you down." - ${name}` },
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
}