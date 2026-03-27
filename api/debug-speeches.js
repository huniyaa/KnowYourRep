export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    
    if (!slug) {
      return res.status(400).json({ error: 'Slug is required' });
    }
    
    // Test the speeches endpoint directly
    const speechesUrl = `https://api.openparliament.ca/speeches/?format=json&limit=5&politician=${slug}`;
    console.log(`Fetching: ${speechesUrl}`);
    
    const response = await fetch(speechesUrl);
    const data = await response.json();
    
    res.status(200).json({
      url: speechesUrl,
      status: response.status,
      hasObjects: data.objects ? data.objects.length : 0,
      sample: data.objects ? data.objects.slice(0, 2) : null,
      fullData: data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}