export default async function handler(req, res) {
  try {
    const { name = "", province = "" } = req.query;
    
    const params = new URLSearchParams({ format: "json", limit: 400 });
    if (name.trim()) params.set("name", name.trim());
    
    const response = await fetch(`https://api.openparliament.ca/politicians/?${params}`);
    if (!response.ok) throw new Error(`Upstream error: ${response.status}`);
    
    const data = await response.json();
    
    let cleaned = data.objects.map((rep) => ({
      name: rep.name ?? "Unknown",
      party: rep.current_party?.short_name?.en ?? "Unknown",
      district: rep.current_riding?.name?.en ?? "Unknown",
      province: rep.current_riding?.province ?? "",
      image: rep.image ?? null,
      slug: rep.url?.split('/').filter(Boolean).pop() ?? null,
    }));
    
    if (province.trim()) {
      cleaned = cleaned.filter(rep => rep.province === province);
    }
    
    res.status(200).json({
      politicians: cleaned,
      count: cleaned.length,
      offset: 0,
      limit: cleaned.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
}