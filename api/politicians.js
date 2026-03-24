export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://api.openparliament.ca/politicians/?format=json&limit=100"
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
 
    res.status(200).json(cleaned);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
}