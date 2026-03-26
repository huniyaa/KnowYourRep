export default async function handler(req, res) {
  try {
    const { name = "", province = "", district = "", limit = 400, offset = 0 } = req.query;
    
    let url = `https://api.openparliament.ca/politicians/?format=json&limit=${limit}&offset=${offset}`;
    
    if (name.trim()) {
      url += `&name=${encodeURIComponent(name.trim())}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Upstream error: ${response.status}`);
    
    const data = await response.json();
    
    let cleaned = data.objects.map((rep) => ({
      id: rep.url?.split('/').filter(Boolean).pop() || rep.name,
      name: rep.name ?? "Unknown",
      party: rep.current_party?.short_name?.en ?? "Unknown",
      district: rep.current_riding?.name?.en ?? "Unknown",
      district_id: rep.current_riding?.id,
      province: rep.current_riding?.province ?? "",
      image: rep.image ?? "",
      url: rep.url,
      years_in_office: calculateYearsInOffice(rep),
      votes: rep.votes_summary,
      email: rep.email || null,
      website: rep.website || null
    }));
    
    // Filter by province if selected
    if (province.trim()) {
      cleaned = cleaned.filter(rep => rep.province === province);
    }
    
    // Filter by district if selected
    if (district.trim()) {
      cleaned = cleaned.filter(rep => 
        rep.district.toLowerCase().includes(district.toLowerCase())
      );
    }
    
    res.status(200).json({
      politicians: cleaned,
      count: cleaned.length,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
}

function calculateYearsInOffice(rep) {
  // This is a simplified calculation - you might want to enhance this
  if (!rep.start_date) return 0;
  const startDate = new Date(rep.start_date);
  const now = new Date();
  const years = (now - startDate) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.floor(years);
}