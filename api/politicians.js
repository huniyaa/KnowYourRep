export default async function handler(req, res) {
  try {
    const response = await fetch("https://api.openparliament.ca/politicians/");
    const data = await response.json();

    // simplify data (IMPORTANT for your UI)
    const cleaned = data.objects.map((rep) => ({
      name: rep.name,
      party: rep.party?.name || "Unknown",
      district: rep.electoral_district?.name || "Unknown",
      province: rep.electoral_district?.province || "",
      image: rep.image || "",
    }));

    res.status(200).json(cleaned);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
}