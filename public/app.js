// ─── DOM Elements ─────────────────────────────────────────────────────────────
const searchInput = document.getElementById("search");
const dropdown = document.getElementById("dropdown");
const provinceFilter = document.getElementById("province-filter");
const resultsDiv = document.getElementById("results");
const statusDiv = document.getElementById("status");
const paginationDiv = document.getElementById("pagination");
const useLocationBtn = document.getElementById("use-location");
const modal = document.getElementById("politician-modal");
const closeModal = document.getElementById("close-modal");

// Debug: Check if sticky header exists
console.log('Sticky header element:', document.getElementById('sticky-header'));

// Simple test: Show sticky header after 1 second
setTimeout(() => {
  const testHeader = document.getElementById('sticky-header');
  if (testHeader) {
    testHeader.classList.add('visible');
    console.log('Sticky header shown via test');
  }
}, 1000);

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
let map;



  
async function init() {
  // Initialize scroll animation
  initScrollAnimation();  // <-- MAKE SURE THIS IS HERE
  
  map = initMap();
  if (modal) modal.style.display = 'none';
  
  try {
    const res = await fetch("/api/politicians?limit=400");
    const data = await res.json();
    allReps = data.politicians || [];
    console.log(`Loaded ${allReps.length} politicians for autocomplete`);
  } catch (error) {
    console.error("Failed to load initial data:", error);
  }
  
  fetchPoliticians();
}

// ─── Initialize Map ───────────────────────────────────────────────────────────
function initMap() {
  const mapElement = document.getElementById("map");
  if (!mapElement) {
    console.error("Map element not found!");
    return null;
  }
  
  const newMap = L.map("map").setView([56.1304, -106.3468], 4);
  
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "© OpenStreetMap contributors"
  }).addTo(newMap);
  
  markersLayer = L.layerGroup().addTo(newMap);
  
  return newMap;
}

// ─── Update Map Markers (with colored pins) ───────────────────────────────────
function updateMapMarkers(politicians) {
  if (!markersLayer || !map) return;
  
  markersLayer.clearLayers();
  const bounds = [];
  
  politicians.forEach(politician => {
    let coords = window.getRidingCoordinates 
      ? window.getRidingCoordinates(politician.district, politician.province)
      : (window.ridingCoords && window.ridingCoords[politician.district]);
    
    if (!coords) return;
    
    let markerColor = "#c0392b";
    if (politician.party) {
      if (politician.party.includes("Liberal")) markerColor = "#d1001f";
      else if (politician.party.includes("Conservative")) markerColor = "#1a4782";
      else if (politician.party.includes("NDP")) markerColor = "#f48d2b";
      else if (politician.party.includes("Green")) markerColor = "#3d9b35";
      else if (politician.party.includes("Bloc")) markerColor = "#00b5e2";
    }
    
    // Colored pin marker
    const coloredIcon = L.divIcon({
      className: 'custom-pin',
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
        <div class="popup-party">${escapeHtml(politician.party)}</div>
        <div class="popup-district">${escapeHtml(politician.district)}</div>
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
  
  console.log(`Map updated: ${bounds.length} markers`);
}

// ─── Display Results ──────────────────────────────────────────────────────────
function displayResults(politicians) {
  const resultsList = document.getElementById('results');
  const panelEmpty = document.getElementById('panel-empty');
  const clearBtn = document.getElementById('clear-results-btn');
  
  if (!resultsList) return;
  
  if (!politicians || politicians.length === 0) {
    resultsList.innerHTML = '';
    if (panelEmpty) panelEmpty.style.display = 'block';
    if (clearBtn) clearBtn.style.display = 'none';
    return;
  }
  
  if (panelEmpty) panelEmpty.style.display = 'none';
  if (clearBtn) clearBtn.style.display = 'inline-block';
  
  resultsList.innerHTML = politicians.map(rep => {
    const imageUrl = rep.image ? `https://api.openparliament.ca${rep.image}` : null;
    
    let partyColor = "#e67e22";
    if (rep.party) {
      if (rep.party.includes("Liberal")) partyColor = "#c0392b";
      else if (rep.party.includes("Conservative")) partyColor = "#1a4782";
      else if (rep.party.includes("NDP")) partyColor = "#e67e22";
      else if (rep.party.includes("Green")) partyColor = "#2ecc71";
      else if (rep.party.includes("Bloc")) partyColor = "#3498db";
    }
    
    return `
      <div class="card" data-name="${escapeHtml(rep.name)}" data-party="${escapeHtml(rep.party)}" data-district="${escapeHtml(rep.district)}" data-province="${escapeHtml(rep.province)}" data-image="${imageUrl || ''}">
        <div class="avatar">
          ${imageUrl ? 
            `<img src="${imageUrl}" alt="${escapeHtml(rep.name)}" class="mp-photo" onerror="this.onerror=null; this.parentElement.innerHTML='${getInitials(rep.name)}';">` : 
            getInitials(rep.name)
          }
        </div>
        <div class="info">
          <h3>${escapeHtml(rep.name)}</h3>
          <p class="party" style="color: ${partyColor};">${escapeHtml(rep.party)}</p>
          <p class="district">${escapeHtml(rep.district)}${rep.province ? `, ${rep.province}` : ""}</p>
        </div>
      </div>
    `;
  }).join('');
  
  // Add click handlers
  document.querySelectorAll('.results-list .card').forEach(card => {
    card.addEventListener('click', () => {
      const politician = {
        name: card.dataset.name,
        party: card.dataset.party,
        district: card.dataset.district,
        province: card.dataset.province,
        image: card.dataset.image ? card.dataset.image.replace('https://api.openparliament.ca', '') : null
      };
      showPoliticianModalWithData(politician);
    });
  });
}

// ─── Fetch Politicians ────────────────────────────────────────────────────────
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

// ─── Province Filter ──────────────────────────────────────────────────────────
if (provinceFilter) {
  provinceFilter.addEventListener("change", () => {
    currentProvince = provinceFilter.value;
    currentQuery = "";
    if (searchInput) searchInput.value = "";
    currentOffset = 0;
    closeDropdown();
    fetchPoliticians("", currentProvince, 0);
  });
}

// ─── Autocomplete ─────────────────────────────────────────────────────────────
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

// ─── Helper Functions ─────────────────────────────────────────────────────────
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

function renderPagination() {
  const paginationDiv = document.querySelector('.panel-pagination');
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
    <span>Page ${curPage} of ${totalPages}</span>
    <button class="page-btn" id="next-btn" ${hasNext ? "" : "disabled"}>Next →</button>
  `;
  
  document.getElementById("prev-btn")?.addEventListener("click", () => 
    fetchPoliticians(currentQuery, currentProvince, currentOffset - LIMIT));
  document.getElementById("next-btn")?.addEventListener("click", () => 
    fetchPoliticians(currentQuery, currentProvince, currentOffset + LIMIT));
}

// ─── Modal Functions ──────────────────────────────────────────────────────────
function showPoliticianModalWithData(politician) {
  const name = politician.name;
  const party = politician.party;
  const district = politician.district;
  const province = politician.province;
  const imageUrl = politician.image ? `https://api.openparliament.ca${politician.image}` : null;
  const slug = politician.slug;
  
  const modalName = document.getElementById("modal-name");
  const modalParty = document.getElementById("modal-party");
  const modalDistrict = document.getElementById("modal-district");
  const modalProvince = document.getElementById("modal-province");
  const modalQuotes = document.getElementById("modal-quotes-text");
  const learnMoreLink = document.getElementById("modal-learn-more");
  
  if (modalName) modalName.textContent = name;
  if (modalParty) modalParty.textContent = party;
  if (modalDistrict) modalDistrict.textContent = district;
  if (modalProvince) modalProvince.textContent = province;
  if (modalQuotes) modalQuotes.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading speeches...</div>';
  
  if (learnMoreLink) {
    if (slug) {
      learnMoreLink.href = `https://openparliament.ca/politicians/${slug}/`;
    } else {
      learnMoreLink.href = `https://openparliament.ca/politicians/${name.toLowerCase().replace(/\s+/g, '-')}/`;
    }
    learnMoreLink.style.display = 'inline-flex';
  }
  
  const modalBody = document.querySelector('.modal-body');
  if (modalBody) {
    let existingPhoto = document.getElementById('modal-politician-photo');
    if (!existingPhoto) {
      const photoDiv = document.createElement('div');
      photoDiv.id = 'modal-politician-photo';
      photoDiv.style.cssText = 'text-align: center; margin-bottom: 20px;';
      if (imageUrl) {
        photoDiv.innerHTML = `<img src="${imageUrl}" alt="${escapeHtml(name)}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #c0392b;">`;
      } else {
        photoDiv.innerHTML = `<div class="modal-initials">${getInitials(name)}</div>`;
      }
      modalBody.insertBefore(photoDiv, modalBody.firstChild);
    }
  }
  
  if (modal) modal.style.display = 'flex';
  fetchQuotesForPolitician(name);
}

window.showPoliticianModal = (name, party, district, province) => {
  const politician = allReps.find(p => p.name === name);
  if (politician) {
    showPoliticianModalWithData(politician);
  } else {
    showPoliticianModalWithData({ name, party, district, province, image: null, slug: null });
  }
};

async function fetchQuotesForPolitician(name) {
  const modalQuotes = document.getElementById("modal-quotes-text");
  if (!modalQuotes) return;
  
  try {
    const response = await fetch(`/api/quotes?politician=${encodeURIComponent(name)}&t=${Date.now()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    if (data.objects && data.objects.length > 0) {
      const quotesHtml = data.objects.map(statement => {
        let text = statement.text?.en || "";
        const date = statement.date || "";
        return `
          <blockquote>
            "${escapeHtml(text)}"
            ${date ? `<footer>📅 ${date}</footer>` : ''}
          </blockquote>
        `;
      }).join('');
      modalQuotes.innerHTML = quotesHtml;
    } else {
      modalQuotes.innerHTML = '<p>No recent speeches found for this representative.</p>';
    }
  } catch (error) {
    console.error("Error fetching speeches:", error);
    modalQuotes.innerHTML = '<p>Unable to load speeches at this time.</p>';
  }
}

function closeModalFunction() { if (modal) modal.style.display = 'none'; }
if (closeModal) closeModal.addEventListener("click", closeModalFunction);
if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) closeModalFunction(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal?.style.display === 'flex') closeModalFunction(); });

// ─── Keyboard Navigation ──────────────────────────────────────────────────────
if (searchInput) {
  searchInput.addEventListener("keydown", e => {
    const items = dropdown?.querySelectorAll("li");
    if (!dropdown?.hidden && items?.length) {
      if (e.key === "ArrowDown") { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, items.length - 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); activeIndex = Math.max(activeIndex - 1, -1); }
      else if (e.key === "Enter") {
        e.preventDefault();
        if (activeIndex >= 0) selectSuggestion(items[activeIndex].dataset.name);
        else { currentQuery = searchInput.value.trim(); currentOffset = 0; closeDropdown(); fetchPoliticians(currentQuery, currentProvince, 0); }
        return;
      } else if (e.key === "Escape") { closeDropdown(); return; }
      items.forEach((li, i) => li.classList.toggle("active", i === activeIndex));
    } else if (e.key === "Enter") {
      currentQuery = searchInput.value.trim();
      currentOffset = 0;
      fetchPoliticians(currentQuery, currentProvince, 0);
    }
  });
  
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fetchSuggestions(searchInput.value.trim()), 200);
  });
  
  searchInput.addEventListener("blur", () => setTimeout(closeDropdown, 150));
}

// ─── Location Detection ───────────────────────────────────────────────────────
if (useLocationBtn) {
  useLocationBtn.addEventListener("click", () => {
    if ("geolocation" in navigator) {
      statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting your location...';
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          if (map) map.setView([latitude, longitude], 10);
          await findNearestDistrict(latitude, longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
          statusDiv.innerHTML = '<p class="error">Unable to get your location.</p>';
          setTimeout(() => { statusDiv.innerHTML = ""; }, 3000);
        }
      );
    }
  });
}

async function findNearestDistrict(lat, lng) {
  if (!window.ridingCoords) return;
  statusDiv.innerHTML = '<i class="fas fa-search"></i> Finding your electoral district...';
  
  let nearestDistrict = null;
  let minDistance = Infinity;
  for (const [district, coords] of Object.entries(window.ridingCoords)) {
    const distance = Math.sqrt(Math.pow(lat - coords.lat, 2) + Math.pow(lng - coords.lng, 2));
    if (distance < minDistance) { minDistance = distance; nearestDistrict = district; }
  }
  
  if (nearestDistrict && searchInput) {
    statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> Found district: ${nearestDistrict}`;
    searchInput.value = nearestDistrict;
    currentQuery = nearestDistrict;
    currentOffset = 0;
    fetchPoliticians(currentQuery, currentProvince, 0);
    setTimeout(() => { statusDiv.innerHTML = ""; }, 3000);
  }
}

// ─── Initialize ───────────────────────────────────────────────────────────────
async function init() {
  map = initMap();
  if (modal) modal.style.display = 'none';
  
  try {
    const res = await fetch("/api/politicians?limit=400");
    const data = await res.json();
    allReps = data.politicians || [];
    console.log(`Loaded ${allReps.length} politicians for autocomplete`);
  } catch (error) {
    console.error("Failed to load initial data:", error);
  }
  
  fetchPoliticians();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}