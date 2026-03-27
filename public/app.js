// ─── DOM Elements first ───────────────────────────────────────────────────────
const searchInput = document.getElementById("search");
const dropdown = document.getElementById("dropdown");
const provinceFilter = document.getElementById("province-filter");
const resultsDiv = document.getElementById("results");
const statusDiv = document.getElementById("status");
const paginationDiv = document.getElementById("pagination");
const useLocationBtn = document.getElementById("use-location");
const modal = document.getElementById("politician-modal");
const closeModal = document.getElementById("close-modal");

// ─── Variables ────────────────────────────────────────────────────────────────
let markersLayer;
let currentPoliticians = [];
let currentQuery = "";
let currentProvince = "";
let currentOffset = 0;
let totalCount = 0;
const LIMIT = 20;
let debounceTimer = null;
let activeIndex = -1;
let allReps = [];
let map; // Store map reference

// ─── Initialize map after DOM is ready ────────────────────────────────────────
function initMap() {
  // Check if map element exists
  const mapElement = document.getElementById("map");
  if (!mapElement) {
    console.error("Map element not found!");
    return null;
  }
  
  // Create map
  const newMap = L.map("map").setView([56.1304, -106.3468], 4);
  
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "© OpenStreetMap contributors"
  }).addTo(newMap);
  
  // Create markers layer
  markersLayer = L.layerGroup().addTo(newMap);
  
  return newMap;
}

// ─── Main fetch function ──────────────────────────────────────────────────────
async function fetchPoliticians(query = "", province = "", offset = 0) {
  if (!statusDiv) return;
  
  statusDiv.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
  if (resultsDiv) resultsDiv.innerHTML = "";
  if (paginationDiv) paginationDiv.innerHTML = "";
  
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

async function fetchPoliticians(query = "", province = "", offset = 0) {
  if (!statusDiv) return;
  
  statusDiv.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
  if (resultsDiv) resultsDiv.innerHTML = "";
  if (paginationDiv) paginationDiv.innerHTML = "";
  
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
    
    // DEBUG: Log what we got
    console.log(`Fetched ${politicians.length} politicians for province: ${province || "ALL"}`);
    console.log("Politicians:", politicians.map(p => ({ name: p.name, district: p.district, province: p.province })));
    
    if (!politicians.length) {
      statusDiv.innerHTML = '<p class="empty">No politicians found. Try adjusting your search.</p>';
      if (markersLayer) markersLayer.clearLayers();
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


// ─── Update map markers with party colors ─────────────────────────────────────
// ─── Update map markers with party-colored pins ─────────────────────────────────────
// ─── Update map markers with party-colored default markers ───────────────────
// ─── Update map markers with colored classic markers ─────────────────────────
function updateMapMarkers(politicians) {
  if (!markersLayer || !map) return;
  
  markersLayer.clearLayers();
  const bounds = [];
  let markersAdded = 0;
  let fallbackUsed = 0;
  
  politicians.forEach(politician => {
    // This will now use your complete coordinates file
    let coords = window.getRidingCoordinates 
      ? window.getRidingCoordinates(politician.district, politician.province)
      : (window.ridingCoords && window.ridingCoords[politician.district]);
    
    if (!coords) {
      console.log(`No coordinates for: ${politician.district}`);
      return;
    }

    // Add this debug code inside updateMapMarkers, right after getting coords
if (!coords) {
  console.log(`❌ NO COORDS for: ${politician.district} (${politician.province})`);
  return;
}

// Log when using province center fallback
if (provinceCenters[politician.province] && 
    coords.lat === provinceCenters[politician.province].lat && 
    coords.lng === provinceCenters[politician.province].lng) {
  console.log(`📍 Using province center for: ${politician.district} (${politician.province})`);
}
    
    if (!window.ridingCoords[politician.district]) {
      fallbackUsed++;
    }
    markersAdded++;
    
    // Get party color
    let markerColor = "#c0392b";
    if (politician.party) {
      if (politician.party.includes("Liberal")) markerColor = "#d1001f";
      else if (politician.party.includes("Conservative")) markerColor = "#1a4782";
      else if (politician.party.includes("NDP")) markerColor = "#f48d2b";
      else if (politician.party.includes("Green")) markerColor = "#3d9b35";
      else if (politician.party.includes("Bloc")) markerColor = "#00b5e2";
    }
    
    // Create colored pin marker
    const coloredIcon = L.divIcon({
      className: 'colored-marker',
      html: `<div style="position: relative; width: 25px; height: 41px;">
        <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41C12.5 41 25 21.9 25 12.5C25 5.6 19.4 0 12.5 0Z" 
                fill="${markerColor}" 
                stroke="white" 
                stroke-width="1.5"/>
          <circle cx="12.5" cy="12.5" r="3.5" fill="white"/>
        </svg>
      </div>`,
      iconSize: [25, 41],
      popupAnchor: [0, -20],
      iconAnchor: [12.5, 41]
    });
    
    const popupContent = `
      <div class="map-popup" onclick="window.showPoliticianModal('${escapeHtml(politician.name)}', '${escapeHtml(politician.party)}', '${escapeHtml(politician.district)}', '${escapeHtml(politician.province)}')">
        <strong>${escapeHtml(politician.name)}</strong>
        <div class="popup-party" style="color: ${markerColor}; font-weight: bold;">
          ${escapeHtml(politician.party)}
        </div>
        <div class="popup-district">${escapeHtml(politician.district)}</div>
        <div class="popup-district">${escapeHtml(politician.province)}</div>
        ${!window.ridingCoords[politician.district] ? '<div class="popup-district" style="color: orange;">📍 Approximate location</div>' : ''}
      </div>
    `;
    
    const marker = L.marker([coords.lat, coords.lng], { icon: coloredIcon })
      .bindPopup(popupContent);
    
    markersLayer.addLayer(marker);
    bounds.push([coords.lat, coords.lng]);
  });
  
  if (bounds.length > 0 && map) {
    map.fitBounds(bounds, { padding: [40, 40] });
  }
  
  console.log(`Map updated: ${markersAdded} markers added, ${fallbackUsed} using fallback coordinates`);
}

function initQuickFilters() {
  const quickFilters = document.querySelectorAll('.quick-filter');
  
  quickFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      const province = btn.dataset.province;
      
      // Update active state
      quickFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update province filter dropdown
      if (provinceFilter) {
        provinceFilter.value = province;
        // Trigger change event
        const event = new Event('change');
        provinceFilter.dispatchEvent(event);
      }
    });
  });
}

// Call this after DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initQuickFilters);
} else {
  initQuickFilters();
}

// ─── Display results cards ────────────────────────────────────────────────────
function displayResults(politicians) {
  if (!resultsDiv) return;
  
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

// ─── Show politician modal (only when clicked) ─────────────────────────────────
window.showPoliticianModal = (name, party, district, province) => {
  const modalName = document.getElementById("modal-name");
  const modalParty = document.getElementById("modal-party");
  const modalDistrict = document.getElementById("modal-district");
  const modalProvince = document.getElementById("modal-province");
  const modalQuotes = document.getElementById("modal-quotes-text");
  
  if (modalName) modalName.textContent = name;
  if (modalParty) modalParty.textContent = party;
  if (modalDistrict) modalDistrict.textContent = district;
  if (modalProvince) modalProvince.textContent = province;
  if (modalQuotes) modalQuotes.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading statements...';
  
  if (modal) modal.style.display = 'flex';
  
  // Fetch quotes for this politician
  fetchQuotesForPolitician(name);
};

async function fetchQuotesForPolitician(name) {
  const modalQuotes = document.getElementById("modal-quotes-text");
  if (!modalQuotes) return;
  
  try {
    // THIS IS THE KEY CHANGE - call YOUR API, not OpenParliament directly
    const response = await fetch(`/api/quotes?politician=${encodeURIComponent(name)}`);
    
    if (!response.ok) throw new Error("Failed to fetch statements");
    
    const data = await response.json();
    
    if (data.objects && data.objects.length > 0) {
      modalQuotes.innerHTML = data.objects.map(statement => `
        <blockquote style="margin: 12px 0; padding: 8px 12px; background: #f9f9f9; border-left: 3px solid #c0392b;">
          "${escapeHtml(statement.text?.en || "No text available")}"
          ${statement.date ? `<footer><small>${new Date(statement.date).toLocaleDateString()}</small></footer>` : ''}
        </blockquote>
      `).join('');
    } else {
      modalQuotes.innerHTML = "No recent statements found for this politician.";
    }
  } catch (error) {
    console.error("Error fetching statements:", error);
    modalQuotes.innerHTML = "Unable to load statements at this time.";
  }
}

// ─── Close modal functions ────────────────────────────────────────────────────
function closeModalFunction() {
  if (modal) modal.style.display = 'none';
}

if (closeModal) {
  closeModal.addEventListener("click", closeModalFunction);
}

// Close modal on outside click
if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModalFunction();
    }
  });
}

// Close modal on ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal && modal.style.display === 'flex') {
    closeModalFunction();
  }
});

// ─── Location detection ───────────────────────────────────────────────────────
if (useLocationBtn) {
  useLocationBtn.addEventListener("click", () => {
    if ("geolocation" in navigator) {
      if (statusDiv) statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting your location...';
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          if (map) map.setView([latitude, longitude], 10);
          await findNearestDistrict(latitude, longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
          if (statusDiv) statusDiv.innerHTML = '<p class="error">Unable to get your location. Please search manually.</p>';
          setTimeout(() => { if (statusDiv) statusDiv.innerHTML = ""; }, 3000);
        }
      );
    } else {
      if (statusDiv) statusDiv.innerHTML = '<p class="error">Geolocation is not supported by your browser.</p>';
    }
  });
}

async function findNearestDistrict(lat, lng) {
  if (!window.ridingCoords) {
    if (statusDiv) statusDiv.innerHTML = '<p class="error">District coordinates not loaded yet.</p>';
    return;
  }
  
  if (statusDiv) statusDiv.innerHTML = '<i class="fas fa-search"></i> Finding your electoral district...';
  
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
    if (statusDiv) statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> Found district: ${nearestDistrict}`;
    if (searchInput) searchInput.value = nearestDistrict;
    currentQuery = nearestDistrict;
    currentOffset = 0;
    fetchPoliticians(currentQuery, currentProvince, 0);
    setTimeout(() => { if (statusDiv) statusDiv.innerHTML = ""; }, 3000);
  } else {
    if (statusDiv) statusDiv.innerHTML = '<p class="error">Could not find your district. Please search manually.</p>';
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
  if (!dropdown) return;
  
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
  if (dropdown) {
    dropdown.hidden = true;
    dropdown.innerHTML = "";
  }
  activeIndex = -1;
}

function selectSuggestion(name) {
  if (searchInput) searchInput.value = name;
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
if (searchInput) {
  searchInput.addEventListener("keydown", e => {
    if (!dropdown) return;
    
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
}

// Province filter with better visibility
if (provinceFilter) {
  provinceFilter.addEventListener("change", async () => {
    const selectedProvince = provinceFilter.value;
    const provinceName = selectedProvince 
      ? provinceFilter.options[provinceFilter.selectedIndex]?.text 
      : "all of Canada";
    
    console.log(`Province filter changed to: ${selectedProvince || "ALL"}`);
    
    // Reset search and pagination
    currentQuery = "";
    if (searchInput) searchInput.value = "";
    currentOffset = 0;
    currentProvince = selectedProvince;
    closeDropdown();
    
    // Show loading with province name
    statusDiv.innerHTML = `<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading ${provinceName} representatives...</div>`;
    
    // Fetch politicians for selected province
    await fetchPoliticians("", selectedProvince, 0);
    
    // After fetching, show a message about what's being displayed
    if (selectedProvince && totalCount > 0) {
      statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> Showing ${totalCount} representative${totalCount !== 1 ? 's' : ''} from ${provinceName}`;
      setTimeout(() => {
        if (statusDiv.innerHTML.includes(provinceName)) {
          statusDiv.innerHTML = "";
        }
      }, 3000);
    }
  });
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function renderPagination() {
  if (!paginationDiv) return;
  
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
  
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  
  if (prevBtn) {
    prevBtn.addEventListener("click", () => 
      fetchPoliticians(currentQuery, currentProvince, currentOffset - LIMIT)
    );
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => 
      fetchPoliticians(currentQuery, currentProvince, currentOffset + LIMIT)
    );
  }
}

// ─── Load initial data and setup ──────────────────────────────────────────────
async function init() {
  // Initialize map
  map = initMap();
  
  // Make sure modal is hidden initially
  if (modal) {
    modal.style.display = 'none';
  }
  
  // Load all politicians for autocomplete
  try {
    const res = await fetch("/api/politicians?limit=400");
    const data = await res.json();
    allReps = data.politicians || [];
  } catch (error) {
    console.error("Failed to load initial data:", error);
  }
  
  // Initial fetch
  fetchPoliticians();
}

// Wait for DOM to be fully loaded before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function updateProvinceInfo(province, count) {
  const infoPanel = document.getElementById('province-info');
  if (!infoPanel) return;
  
  if (province && count > 0) {
    const provinceName = provinceFilter?.options[provinceFilter.selectedIndex]?.text || province;
    infoPanel.querySelector('.province-name').textContent = provinceName;
    infoPanel.querySelector('.province-count').textContent = `${count} representative${count !== 1 ? 's' : ''}`;
    infoPanel.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (infoPanel.style.display === 'block') {
        infoPanel.style.opacity = '0.8';
        setTimeout(() => {
          if (infoPanel.style.display === 'block') {
            infoPanel.style.display = 'none';
            infoPanel.style.opacity = '1';
          }
        }, 3000);
      }
    }, 5000);
  } else {
    infoPanel.style.display = 'none';
  }
}

// Reset view button
const resetViewBtn = document.getElementById('reset-view');
if (resetViewBtn) {
  resetViewBtn.addEventListener('click', () => {
    if (provinceFilter) provinceFilter.value = '';
    currentProvince = '';
    currentQuery = '';
    if (searchInput) searchInput.value = '';
    currentOffset = 0;
    fetchPoliticians('', '', 0);
    
    // Hide province info
    const infoPanel = document.getElementById('province-info');
    if (infoPanel) infoPanel.style.display = 'none';
  });
}