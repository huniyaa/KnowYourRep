const searchInput  = document.getElementById("search");
const resultsDiv   = document.getElementById("results");
const statusDiv    = document.getElementById("status");
const paginationDiv = document.getElementById("pagination");
 
const LIMIT = 20;
let currentOffset = 0;
let currentQuery  = "";
let totalCount    = 0;
let debounceTimer = null;
 
// --- Fetch from our Vercel serverless function ---
async function fetchPoliticians(query = "", offset = 0) {
  statusDiv.textContent  = "Loading…";
  resultsDiv.innerHTML   = "";
  paginationDiv.innerHTML = "";
 
  const params = new URLSearchParams({ limit: LIMIT, offset });
  if (query) params.set("name", query);
 
  try {
    const res = await fetch(`/api/politicians?${params}`);
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const data = await res.json();
 
    totalCount    = data.count;
    currentOffset = data.offset;
 
    const from = offset + 1;
    const to   = Math.min(offset + LIMIT, totalCount);
 
    statusDiv.textContent = query
      ? `Found ${totalCount} result${totalCount !== 1 ? "s" : ""} for "${query}" — showing ${from}–${to}`
      : `Showing ${from}–${to} of ${totalCount} politicians`;
 
    displayResults(data.politicians);
    renderPagination();
  } catch (err) {
    statusDiv.textContent = "";
    resultsDiv.innerHTML  = `<p class="error">⚠️ Failed to load data: ${err.message}</p>`;
  }
}
 
// --- Render cards ---
function getInitials(name) {
  return name.trim().split(/\s+/).map(p => p[0]).join("").slice(0, 2).toUpperCase();
}
 
function displayResults(reps) {
  if (!reps || reps.length === 0) {
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
 
// --- Pagination ---
function renderPagination() {
  const hasPrev    = currentOffset > 0;
  const hasNext    = currentOffset + LIMIT < totalCount;
  const totalPages = Math.ceil(totalCount / LIMIT);
  const curPage    = Math.floor(currentOffset / LIMIT) + 1;
 
  if (!hasPrev && !hasNext) { paginationDiv.innerHTML = ""; return; }
 
  paginationDiv.innerHTML = `
    <button class="page-btn" id="prev-btn" ${hasPrev ? "" : "disabled"}>← Previous</button>
    <span id="page-info">Page ${curPage} of ${totalPages}</span>
    <button class="page-btn" id="next-btn" ${hasNext ? "" : "disabled"}>Next →</button>
  `;
 
  document.getElementById("prev-btn").addEventListener("click", () => {
    fetchPoliticians(currentQuery, currentOffset - LIMIT);
  });
  document.getElementById("next-btn").addEventListener("click", () => {
    fetchPoliticians(currentQuery, currentOffset + LIMIT);
  });
}
 
// --- Search input (debounced, hits the API) ---
searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentQuery  = searchInput.value.trim();
    currentOffset = 0;
    fetchPoliticians(currentQuery, 0);
  }, 350);
});
 
// --- Initial load ---
fetchPoliticians();