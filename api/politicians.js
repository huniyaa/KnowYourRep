export default async function handler(req, res) {
  try {
    const { name = "", offset = 0, limit = 20 } = req.query;
 
    const params = new URLSearchParams({ format: "json", limit, offset });
    if (name.trim()) params.set("name", name.trim());
 
    const response = await fetch(
      `https://api.openparliament.ca/politicians/?${params}`
    );
    if (!response.ok) throw new Error(`Upstream error: ${response.status}`);
    const data = await response.json();
 
    const cleaned = data.objects.map((rep) => ({
      name:     rep.name ?? "Unknown",
      party:    rep.current_party?.short_name?.en ?? "Unknown",
      district: rep.riding?.name?.en ?? "Unknown",
      province: rep.riding?.province ?? "",
      image:    rep.image ?? "",
    }));
 
    res.status(200).json({
      politicians: cleaned,
      count:  data.pagination?.count ?? cleaned.length,
      offset: Number(offset),
      limit:  Number(limit),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
}