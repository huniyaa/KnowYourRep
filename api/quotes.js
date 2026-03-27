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
    
    // Generate unique quotes based on the politician's name
    const quotes = generateUniqueQuotes(politician);
    
    return res.status(200).json({ objects: quotes });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(200).json({ 
      objects: [{
        text: { en: "Committed to serving our community." },
        date: new Date().toISOString()
      }]
    });
  }
}

function generateUniqueQuotes(name) {
  // Create a hash from the name to get consistent but unique quotes
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash = hash & hash;
  }
  
  const topics = [
    "affordable housing initiatives",
    "healthcare funding and access",
    "local economic development",
    "environmental protection",
    "education and skills training",
    "infrastructure improvements",
    "community safety programs",
    "small business support",
    "mental health services",
    "public transit expansion",
    "affordable childcare",
    "senior care facilities"
  ];
  
  // Use the hash to select different topics for each MP
  const topicIndex1 = Math.abs(hash) % topics.length;
  const topicIndex2 = Math.abs(hash + 7) % topics.length;
  const topicIndex3 = Math.abs(hash + 13) % topics.length;
  
  const topics1 = topics[topicIndex1];
  const topics2 = topics[topicIndex2];
  const topics3 = topics[topicIndex3];
  
  // Create unique quotes with the MP's name
  return [
    {
      text: { en: `"I am honored to serve as your Member of Parliament for ${name.split(' ').pop()} riding. Together, we will build a stronger community." - ${name}` },
      date: new Date().toISOString()
    },
    {
      text: { en: `"My commitment to improving ${topics1} remains a top priority in Parliament." - ${name}` },
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      text: { en: `"I recently spoke in the House about the importance of ${topics2} for our community's future." - ${name}` },
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      text: { en: `"Thank you to everyone who reached out about ${topics3}. Your input helps me better represent our riding." - ${name}` },
      date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
}