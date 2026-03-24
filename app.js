const searchInput = document.getElementById("search");
const resultsDiv  = document.getElementById("results");
const statusDiv   = document.getElementById("status");
 
let allReps = [];
 
async function loadData() {
  statusDiv.textContent = "Loading…";
  resultsDiv.innerHTML  = "";
 
  try {
    const res  = await fetch("/api/politicians");
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    allReps = await res.json();
 
    statusDiv.textContent = `${allReps.length} politicians loaded`;
    displayResults(allReps);
  } catch (err) {
    statusDiv.textContent = "";
    resultsDiv.innerHTML  = `<p class="error">⚠️ Failed to load data: ${err.message}</p>`;
  }
}
 
function getInitials(name) {
  return name.trim().split(/\s+/).map(p => p[0]).join("").slice(0, 2).toUpperCase();
}
 
function displayResults(reps) {
  if (reps.length === 0) {
    resultsDiv.innerHTML = `<p class="empty">No politicians match your search.</p>`;
    return;
  }
 
  resultsDiv.innerHTML = reps.map(rep => `
    <div class="card">
      <div class="avatar">${getInitials(rep.name)}</div>
      <div class="info">
        <h3>${rep.name}</h3>
        <p class="party">${rep.party}</p>
        <p class="district">${rep.district}${rep.province ? `, ${rep.province}` : ""}</p>
      </div>
    </div>
  `).join("");
}
 
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const filtered = allReps.filter(rep =>
    rep.name.toLowerCase().includes(query) ||
    rep.district.toLowerCase().includes(query)
  );
  statusDiv.textContent = query
    ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""} for "${searchInput.value}"`
    : `${allReps.length} politicians loaded`;
  displayResults(filtered);
});
 
loadData();