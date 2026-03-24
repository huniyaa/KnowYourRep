const searchInput    = document.getElementById("search");
const dropdown       = document.getElementById("dropdown");
const provinceFilter = document.getElementById("province-filter");
const resultsDiv     = document.getElementById("results");
const statusDiv      = document.getElementById("status");
const paginationDiv  = document.getElementById("pagination");
 
const LIMIT = 20;
let currentOffset   = 0;
let currentQuery    = "";
let currentProvince = "";
let totalCount      = 0;
let debounceTimer   = null;
let activeIndex     = -1; // for keyboard nav in dropdown
 
// ─── API fetch ───────────────────────────────────────────────────────────────
 
async function fetchPoliticians(query = "", province = "", offset = 0) {
  statusDiv.textContent   = "Loading…";
  resultsDiv.innerHTML    = "";
  paginationDiv.innerHTML = "";
 
  const params = new URLSearchParams({ limit: LIMIT, offset });
  if (query)    params.set("name", query);
  if (province) params.set("province", province);
 
  try {
    const res = await fetch(`/api/politicians?${params}`);
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const data = await res.json();
 
    totalCount    = data.count;
    currentOffset = data.offset;
 
    const from = offset + 1;
    const to   = Math.min(offset + LIMIT, totalCount);
 
    if (data.politicians.length === 0) {
      statusDiv.textContent = "";
      resultsDiv.innerHTML  = `<p class="empty">No politicians found.</p>`;
      return;
    }
 
    statusDiv.textContent = query || province
      ? `Found ${totalCount} result${totalCount !== 1 ? "s" : ""} — showing ${from}–${to}`
      : `Showing ${from}–${to} of ${totalCount} politicians`;
 
    displayResults(data.politicians);
    renderPagination();
  } catch (err) {
    statusDiv.textContent = "";
    resultsDiv.innerHTML  = `<p class="error">⚠️ ${err.message}</p>`;
  }
}
 
// ─── Autocomplete ─────────────────────────────────────────────────────────────
 
async function fetchSuggestions(query) {
  if (!query || query.length < 2) { closeDropdown(); return; }
 
  try {
    const res  = await fetch(`/api/politicians?name=${encodeURIComponent(query)}&limit=8`);
    if (!res.ok) return;
    const data = await res.json();
    showDropdown(data.politicians, query);
  } catch {
    closeDropdown();
  }
}
 
function showDropdown(politicians, query) {
  if (!politicians.length) { closeDropdown(); return; }
 
  activeIndex = -1;
  dropdown.innerHTML = politicians.map((p, i) => `
    <li data-index="${i}" data-name="${escapeHtml(p.name)}">
      <span class="suggestion-name">${highlight(p.name, query)}</span>
      <span class="suggestion-district">${escapeHtml(p.district)}${p.province ? `, ${p.province}` : ""}</span>
    </li>
  `).join("");
 
  dropdown.hidden = false;
 
  dropdown.querySelectorAll("li").forEach(li => {
    li.addEventListener("mousedown", (e) => {
      e.preventDefault(); // prevent blur firing first
      selectSuggestion(li.dataset.name);
    });
  });
}
 
function closeDropdown() {
  dropdown.hidden = true;
  dropdown.innerHTML = "";
  activeIndex = -1;
}
 
function selectSuggestion(name) {
  searchInput.value = name;
  currentQuery      = name;
  currentOffset     = 0;
  closeDropdown();
  fetchPoliticians(currentQuery, currentProvince, 0);
}
 
// Highlight matching text in suggestion
function highlight(text, query) {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return escapeHtml(text).replace(
    new RegExp(`(${escaped})`, "gi"),
    `<mark>$1</mark>`
  );
}
 
function escapeHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
 
// ─── Keyboard navigation in dropdown ─────────────────────────────────────────
 
searchInput.addEventListener("keydown", (e) => {
  const items = dropdown.querySelectorAll("li");
  if (dropdown.hidden || !items.length) {
    if (e.key === "Enter") {
      currentQuery  = searchInput.value.trim();
      currentOffset = 0;
      fetchPoliticians(currentQuery, currentProvince, 0);
    }
    return;
  }
 
  if (e.key === "ArrowDown") {
    e.preventDefault();
    activeIndex = Math.min(activeIndex + 1, items.length - 1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    activeIndex = Math.max(activeIndex - 1, -1);
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (activeIndex >= 0) {
      selectSuggestion(items[activeIndex].dataset.name);
    } else {
      currentQuery  = searchInput.value.trim();
      currentOffset = 0;
      closeDropdown();
      fetchPoliticians(currentQuery, currentProvince, 0);
    }
    return;
  } else if (e.key === "Escape") {
    closeDropdown(); return;
  }
 
  items.forEach((li, i) => li.classList.toggle("active", i === activeIndex));
  if (activeIndex >= 0) items[activeIndex].scrollIntoView({ block: "nearest" });
});
 
// ─── Input / filter events ────────────────────────────────────────────────────
 
searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fetchSuggestions(searchInput.value.trim());
  }, 200);
});
 
searchInput.addEventListener("blur", () => {
  // small delay so mousedown on a suggestion fires first
  setTimeout(closeDropdown, 150);
});
 
provinceFilter.addEventListener("change", () => {
  currentProvince = provinceFilter.value;
  currentOffset   = 0;
  closeDropdown();
  fetchPoliticians(currentQuery, currentProvince, 0);
});
 
// ─── Render cards ─────────────────────────────────────────────────────────────
 
function getInitials(name) {
  return name.trim().split(/\s+/).map(p => p[0]).join("").slice(0, 2).toUpperCase();
}
 
function displayResults(reps) {
  resultsDiv.innerHTML = reps.map(rep => `
    <div class="card">
      <div class="avatar">${getInitials(rep.name)}</div>
      <div class="info">
        <h3>${escapeHtml(rep.name)}</h3>
        <p class="party">${escapeHtml(rep.party)}</p>
        <p class="district">${escapeHtml(rep.district)}${rep.province ? `, ${rep.province}` : ""}</p>
      </div>
    </div>
  `).join("");
}
 
// ─── Pagination ───────────────────────────────────────────────────────────────
 
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
 
  document.getElementById("prev-btn").addEventListener("click", () =>
    fetchPoliticians(currentQuery, currentProvince, currentOffset - LIMIT));
  document.getElementById("next-btn").addEventListener("click", () =>
    fetchPoliticians(currentQuery, currentProvince, currentOffset + LIMIT));
}
 