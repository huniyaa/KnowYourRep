// ─── Map setup ────────────────────────────────────────────────────────────────
const map = L.map("map").setView([56.1304, -106.3468], 4);
 
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: "© OpenStreetMap contributors"
}).addTo(map);
 
// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLE_DEFAULT     = { color: "#aaa",     weight: 0.8, fillColor: "#ccc",     fillOpacity: 0.15 };
const STYLE_HIGHLIGHTED = { color: "#c0392b",  weight: 2,   fillColor: "#c0392b",  fillOpacity: 0.35 };
const STYLE_HOVER       = { color: "#922b21",  weight: 2.5, fillColor: "#c0392b",  fillOpacity: 0.55 };
 
// ─── GeoJSON state ────────────────────────────────────────────────────────────
let geojsonLayer   = null;
let ridingLayerMap = new Map(); // normalizedName → { layer, rawName }
let geojsonReady   = false;
 
// Normalize riding names for fuzzy matching:
// lowercases, strips accents, normalises all dash variants to a plain hyphen,
// collapses whitespace — so "Beaches—East York" matches "Beaches-East York" etc.
function normalizeName(name) {
  return (name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // strip accents
    .toLowerCase()
    .replace(/[\u2014\u2013\u2012\u2010-]/g, "-") // em/en/fig dash → hyphen
    .replace(/\s*-\s*/g, "-")          // tighten spaces around hyphens
    .replace(/\s+/g, " ")
    .trim();
}
 
fetch("ridings.geojson")
  .then(r => r.json())
  .then(data => {
    geojsonLayer = L.geoJSON(data, {
      style: () => STYLE_DEFAULT,
      onEachFeature(feature, layer) {
        // Try common Elections Canada property names in order of preference
        const rawName =
          feature.properties.FEDENAME ||  // English name (2015+ shapefiles)
          feature.properties.FEDNAME  ||  // older bilingual name
          feature.properties.name    ||
          "";
 
        const key = normalizeName(rawName);
        if (key) ridingLayerMap.set(key, { layer, rawName });
 
        layer.on({
          mouseover(e) {
            const l = e.target;
            // only apply hover style if already highlighted
            if (l.options.fillOpacity > 0.2) l.setStyle(STYLE_HOVER);
            l.bringToFront();
          },
          mouseout(e) {
            // restore whichever style it had (geojsonLayer.resetStyle restores default,
            // so we track highlighted state separately)
            const l = e.target;
            if (l._highlighted) {
              l.setStyle(STYLE_HIGHLIGHTED);
            } else {
              geojsonLayer.resetStyle(l);
            }
          }
        });
      }
    }).addTo(map);
 
    geojsonReady = true;
 
    // If politicians already loaded before GeoJSON, highlight them now
    if (pendingHighlight.length) {
      highlightRidings(pendingHighlight);
      pendingHighlight = [];
    }
  })
  .catch(() => {
    console.warn("ridings.geojson not found or failed to load.");
  });
 
// ─── Highlight helpers ────────────────────────────────────────────────────────
let pendingHighlight = [];
 
function highlightRidings(politicians) {
  if (!geojsonReady) {
    pendingHighlight = politicians;
    return;
  }
 
  // Reset all layers
  ridingLayerMap.forEach(({ layer }) => {
    layer._highlighted = false;
    geojsonLayer.resetStyle(layer);
  });
 
  const bounds = [];
 
  politicians.forEach(rep => {
    const key   = normalizeName(rep.district);
    const entry = ridingLayerMap.get(key);
    if (!entry) return;
 
    const { layer, rawName } = entry;
    layer._highlighted = true;
    layer.setStyle(STYLE_HIGHLIGHTED);
 
    layer.unbindPopup();
    layer.bindPopup(`
      <div class="map-popup">
        <strong>${escapeHtml(rep.name)}</strong>
        <span class="popup-party">${escapeHtml(rep.party)}</span>
        <span class="popup-district">${escapeHtml(rawName)}${rep.province ? `, ${rep.province}` : ""}</span>
      </div>
    `);
 
    try {
      const layerBounds = layer.getBounds();
      if (layerBounds.isValid()) bounds.push(layerBounds);
    } catch {}
  });
 
  // Zoom to fit all highlighted ridings
  if (bounds.length === 1) {
    map.fitBounds(bounds[0], { padding: [40, 40], maxZoom: 10 });
  } else if (bounds.length > 1) {
    const combined = bounds.reduce((acc, b) => acc.extend(b), bounds[0]);
    map.fitBounds(combined, { padding: [40, 40], maxZoom: 8 });
  }
}
 
// ─── App state ────────────────────────────────────────────────────────────────
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
let activeIndex     = -1;
 
// Cache all reps once for autocomplete
let allReps = [];
(async () => {
  try {
    const res  = await fetch("/api/politicians?limit=400");
    const data = await res.json();
    allReps = data.politicians || [];
  } catch {}
})();
 
// ─── Main fetch ───────────────────────────────────────────────────────────────
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
 
    if (!data.politicians.length) {
      statusDiv.textContent = "";
      resultsDiv.innerHTML  = `<p class="empty">No politicians found.</p>`;
      return;
    }
 
    const from = offset + 1;
    const to   = Math.min(offset + LIMIT, totalCount);
    statusDiv.textContent = (query || province)
      ? `Found ${totalCount} result${totalCount !== 1 ? "s" : ""} — showing ${from}–${to}`
      : `Showing ${from}–${to} of ${totalCount} politicians`;
 
    displayResults(data.politicians);
    highlightRidings(data.politicians);
    renderPagination();
  } catch (err) {
    statusDiv.textContent = "";
    resultsDiv.innerHTML  = `<p class="error">⚠️ ${err.message}</p>`;
  }
}
 
// ─── Autocomplete ─────────────────────────────────────────────────────────────
function fetchSuggestions(query) {
  if (!query || query.length < 2) { closeDropdown(); return; }
 
  const q        = query.toLowerCase();
  const filtered = allReps
    .filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q)
    )
    .slice(0, 8);
 
  showDropdown(filtered, query);
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
    li.addEventListener("mousedown", e => {
      e.preventDefault();
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
 
function highlight(text, query) {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return escapeHtml(text).replace(new RegExp(`(${escaped})`, "gi"), "<mark>$1</mark>");
}
 
function escapeHtml(str) {
  return (str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
 
// ─── Keyboard nav ─────────────────────────────────────────────────────────────
searchInput.addEventListener("keydown", e => {
  const items = dropdown.querySelectorAll("li");
  if (dropdown.hidden || !items.length) {
    if (e.key === "Enter") {
      currentQuery = searchInput.value.trim();
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
    if (activeIndex >= 0) selectSuggestion(items[activeIndex].dataset.name);
    else { currentQuery = searchInput.value.trim(); currentOffset = 0; closeDropdown(); fetchPoliticians(currentQuery, currentProvince, 0); }
    return;
  } else if (e.key === "Escape") { closeDropdown(); return; }
 
  items.forEach((li, i) => li.classList.toggle("active", i === activeIndex));
  if (activeIndex >= 0) items[activeIndex].scrollIntoView({ block: "nearest" });
});
 
searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchSuggestions(searchInput.value.trim()), 200);
});
 
searchInput.addEventListener("blur", () => setTimeout(closeDropdown, 150));
 
provinceFilter.addEventListener("change", () => {
  currentProvince   = provinceFilter.value;
  currentQuery      = "";
  searchInput.value = "";
  currentOffset     = 0;
  closeDropdown();
  fetchPoliticians("", currentProvince, 0);
});
 
// ─── Cards ────────────────────────────────────────────────────────────────────
function getInitials(name) {
  return name.trim().split(/\s+/).map(p => p[0]).join("").slice(0, 2).toUpperCase();
}
 
function displayResults(reps) {
  resultsDiv.innerHTML = reps.map(rep => `
    <div class="card" data-district="${escapeHtml(rep.district)}">
      <div class="avatar">${getInitials(rep.name)}</div>
      <div class="info">
        <h3>${escapeHtml(rep.name)}</h3>
        <p class="party">${escapeHtml(rep.party)}</p>
        <p class="district">${escapeHtml(rep.district)}${rep.province ? `, ${rep.province}` : ""}</p>
      </div>
    </div>
  `).join("");
 
  // Clicking a card zooms the map to that riding
  resultsDiv.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => {
      const key   = normalizeName(card.dataset.district);
      const entry = ridingLayerMap.get(key);
      if (!entry) return;
      try {
        map.fitBounds(entry.layer.getBounds(), { padding: [60, 60], maxZoom: 10 });
        entry.layer.openPopup();
      } catch {}
    });
  });
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
 
// ─── Init ─────────────────────────────────────────────────────────────────────
fetchPoliticians();