// ─── Map setup ────────────────────────────────────────────────────────────────
let markersLayer = L.layerGroup();
let currentPoliticians = [];
let currentQuery = "";
let currentProvince = "";
let currentOffset = 0;
let totalCount = 0;
const LIMIT = 20;

// Initialize map
const map = L.map("map").setView([56.1304, -106.3468], 4);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: "© OpenStreetMap contributors"
}).addTo(map);
markersLayer.addTo(map);

// DOM Elements
const searchInput = document.getElementById("search");
const dropdown = document.getElementById("dropdown");
const provinceFilter = document.getElementById("province-filter");
const resultsDiv = document.getElementById("results");
const statusDiv = document.getElementById("status");
const paginationDiv = document.getElementById("pagination");
const useLocationBtn = document.getElementById("use-location");
const modal = document.getElementById("politician-modal");
const closeModal = document.getElementById("close-modal");

let debounceTimer = null;
let activeIndex = -1;
let allReps = [];

// Cache for autocomplete
(async () => {
  try {
    const res = await fetch("/api/politicians?limit=400");
    const data = await res.json();
    allReps = data.politicians || [];
  } catch (error) {
    console.error("Failed to load initial data:", error);
  }
})();

// ─── Main fetch function ──────────────────────────────────────────────────────
async function fetchPoliticians(query = "", province = "", offset = 0) {
  statusDiv.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
  resultsDiv.innerHTML = "";
  paginationDiv.innerHTML = "";
  
  const params = new URLSearchParams({ limit: LIMIT, offset });
  if (query) params.set("name", query);
  if (province) params.set("province", province);
  
  try {
    const res = await fetch(`/api/politicians?${params}`);
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    
    const data = await res.json();
    const politicians = data.politicians;
    totalCount = data.count;
    currentOffset = data.offset;
    
    if (!politicians.length) {
      statusDiv.innerHTML = '<p class="empty">No politicians found. Try adjusting your search.</p>';
      markersLayer.clearLayers();
      return;
    }
    
    const from = offset + 1;
    const to = Math.min(offset + LIMIT, totalCount);
    statusDiv.innerHTML = `Found ${totalCount} result${totalCount !== 1 ? "s" : ""} — showing ${from}–${to}`;
    
    displayResults(politicians);
    updateMapMarkers(politicians);
    renderPagination();
    
  } catch (err) {
    console.error(err);
    statusDiv.innerHTML = `<p class="error">⚠️ ${err.message}</p>`;
  }
}

// ─── Update map markers ───────────────────────────────────────────────────────
function updateMapMarkers(politicians) {
  markersLayer.clearLayers();
  const bounds = [];
  
  politicians.forEach(politician => {
    const coords = window.ridingCoords && window.ridingCoords[politician.district];
    if (!coords) return;
    
    const popupContent = `
      <div class="map-popup" onclick="window.showPoliticianModal('${escapeHtml(politician.name)}', '${escapeHtml(politician.party)}', '${escapeHtml(politician.district)}', '${escapeHtml(politician.province)}')">
        <strong>${escapeHtml(politician.name)}</strong>
        <div class="popup-party">${escapeHtml(politician.party)}</div>
        <div class="popup-district">${escapeHtml(politician.district)}</div>
        <div class="popup-district">${escapeHtml(politician.province)}</div>
      </div>
    `;
    
    const marker = L.marker([coords.lat, coords.lng])
      .bindPopup(popupContent);
    
    markersLayer.addLayer(marker);
    bounds.push([coords.lat, coords.lng]);
  });
  
  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [40, 40] });
  }
}

// ─── Display results cards ────────────────────────────────────────────────────
function displayResults(politicians) {
  resultsDiv.innerHTML = politicians.map(rep => `
    <div class="card" onclick="window.showPoliticianModal('${escapeHtml(rep.name)}', '${escapeHtml(rep.party)}', '${escapeHtml(rep.district)}', '${escapeHtml(rep.province)}')">
      <div class="avatar">${getInitials(rep.name)}</div>
      <div class="info">
        <h3>${escapeHtml(rep.name)}</h3>
        <p class="party">${escapeHtml(rep.party)}</p>
        <p class="district">${escapeHtml(rep.district)}${rep.province ? `, ${rep.province}` : ""}</p>
      </div>
    </div>
  `).join('');
}

// ─── Show politician modal ────────────────────────────────────────────────────
window.showPoliticianModal = (name, party, district, province) => {
  document.getElementById("modal-name").textContent = name;
  document.getElementById("modal-party").textContent = party;
  document.getElementById("modal-district").textContent = district;
  document.getElementById("modal-province").textContent = province;
  document.getElementById("modal-quotes-text").innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading quotes...';
  
  modal.hidden = false;
  
  // Fetch quotes for this politician (from OpenParliament API)
  fetchQuotesForPolitician(name);
};

async function fetchQuotesForPolitician(name) {
  try {
    // Search for statements by this politician
    const params = new URLSearchParams({
      format: "json",
      limit: 5,
      politician: name
    });
    
    const response = await fetch(`https://api.openparliament.ca/statements/?${params}`);
    if (!response.ok) throw new Error("Failed to fetch quotes");
    
    const data = await response.json();
    const quotesText = document.getElementById("modal-quotes-text");
    
    if (data.objects && data.objects.length > 0) {
      quotesText.innerHTML = data.objects.map(statement => `
        <blockquote style="margin: 12px 0; padding: 8px 12px; background: #f9f9f9; border-left: 3px solid #c0392b;">
          "${escapeHtml(statement.text?.en || "No text available")}"
          ${statement.date ? `<footer><small>${new Date(statement.date).toLocaleDateString()}</small></footer>` : ''}
        </blockquote>
      `).join('');
    } else {
      quotesText.innerHTML = "No recent statements found for this politician.";
    }
  } catch (error) {
    console.error("Error fetching quotes:", error);
    document.getElementById("modal-quotes-text").innerHTML = "Unable to load quotes at this time.";
  }
}

// Close modal
closeModal?.addEventListener("click", () => {
  modal.hidden = true;
});

// Close modal on outside click
modal?.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.hidden = true;
  }
});

// Close modal on ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal && !modal.hidden) {
    modal.hidden = true;
  }
});

// ─── Location detection ───────────────────────────────────────────────────────
useLocationBtn?.addEventListener("click", () => {
  if ("geolocation" in navigator) {
    statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting your location...';
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 10);
        await findNearestDistrict(latitude, longitude);
      },
      (error) => {
        console.error("Geolocation error:", error);
        statusDiv.innerHTML = '<p class="error">Unable to get your location. Please search manually.</p>';
        setTimeout(() => { statusDiv.innerHTML = ""; }, 3000);
      }
    );
  } else {
    statusDiv.innerHTML = '<p class="error">Geolocation is not supported by your browser.</p>';
  }
});

async function findNearestDistrict(lat, lng) {
  if (!window.ridingCoords) {
    statusDiv.innerHTML = '<p class="error">District coordinates not loaded yet.</p>';
    return;
  }
  
  statusDiv.innerHTML = '<i class="fas fa-search"></i> Finding your electoral district...';
  
  let nearestDistrict = null;
  let minDistance = Infinity;
  
  for (const [district, coords] of Object.entries(window.ridingCoords)) {
    const distance = Math.sqrt(
      Math.pow(lat - coords.lat, 2) + 
      Math.pow(lng - coords.lng, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestDistrict = district;
    }
  }
  
  if (nearestDistrict) {
    statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> Found district: ${nearestDistrict}`;
    searchInput.value = nearestDistrict;
    currentQuery = nearestDistrict;
    currentOffset = 0;
    fetchPoliticians(currentQuery, currentProvince, 0);
    setTimeout(() => { statusDiv.innerHTML = ""; }, 3000);
  } else {
    statusDiv.innerHTML = '<p class="error">Could not find your district. Please search manually.</p>';
  }
}

// ─── Autocomplete functionality ───────────────────────────────────────────────
function fetchSuggestions(query) {
  if (!query || query.length < 2) {
    closeDropdown();
    return;
  }
  
  const q = query.toLowerCase();
  const filtered = allReps
    .filter(p => p.name.toLowerCase().includes(q) || p.district.toLowerCase().includes(q))
    .slice(0, 8);
  
  showDropdown(filtered, query);
}

function showDropdown(politicians, query) {
  if (!politicians.length) {
    closeDropdown();
    return;
  }
  
  activeIndex = -1;
  dropdown.innerHTML = politicians.map((p, i) => `
    <li data-index="${i}" data-name="${escapeHtml(p.name)}" data-district="${escapeHtml(p.district)}">
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
  currentQuery = name;
  currentOffset = 0;
  closeDropdown();
  fetchPoliticians(currentQuery, currentProvince, 0);
}

function highlight(text, query) {
  const esc = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return escapeHtml(text).replace(new RegExp(`(${esc})`, "gi"), "<mark>$1</mark>");
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getInitials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).map(p => p[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Keyboard navigation ──────────────────────────────────────────────────────
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
    if (activeIndex >= 0) {
      selectSuggestion(items[activeIndex].dataset.name);
    } else {
      currentQuery = searchInput.value.trim();
      currentOffset = 0;
      closeDropdown();
      fetchPoliticians(currentQuery, currentProvince, 0);
    }
    return;
  } else if (e.key === "Escape") {
    closeDropdown();
    return;
  }
  
  items.forEach((li, i) => li.classList.toggle("active", i === activeIndex));
  if (activeIndex >= 0) items[activeIndex].scrollIntoView({ block: "nearest" });
});

searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchSuggestions(searchInput.value.trim()), 200);
});

searchInput.addEventListener("blur", () => setTimeout(closeDropdown, 150));

provinceFilter.addEventListener("change", () => {
  currentProvince = provinceFilter.value;
  currentQuery = "";
  searchInput.value = "";
  currentOffset = 0;
  closeDropdown();
  fetchPoliticians("", currentProvince, 0);
});

// ─── Pagination ───────────────────────────────────────────────────────────────
function renderPagination() {
  const hasPrev = currentOffset > 0;
  const hasNext = currentOffset + LIMIT < totalCount;
  const totalPages = Math.ceil(totalCount / LIMIT);
  const curPage = Math.floor(currentOffset / LIMIT) + 1;
  
  if (!hasPrev && !hasNext) {
    paginationDiv.innerHTML = "";
    return;
  }
  
  paginationDiv.innerHTML = `
    <button class="page-btn" id="prev-btn" ${hasPrev ? "" : "disabled"}>← Previous</button>
    <span id="page-info">Page ${curPage} of ${totalPages}</span>
    <button class="page-btn" id="next-btn" ${hasNext ? "" : "disabled"}>Next →</button>
  `;
  
  document.getElementById("prev-btn")?.addEventListener("click", () => 
    fetchPoliticians(currentQuery, currentProvince, currentOffset - LIMIT)
  );
  document.getElementById("next-btn")?.addEventListener("click", () => 
    fetchPoliticians(currentQuery, currentProvince, currentOffset + LIMIT)
  );
}

// ─── Initialize ───────────────────────────────────────────────────────────────
fetchPoliticians();