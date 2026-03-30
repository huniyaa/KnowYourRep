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
let map;

// ─── Scroll Animation ────────────────────────────────────────────────────────
function initScrollAnimation() {
  const hero = document.getElementById('hero');
  const appContent = document.getElementById('app-content');
  const scrollIndicator = document.querySelector('.scroll-indicator');
  
  function revealContent() {
    if (hero && appContent) {
      hero.classList.add('hide-hero');
      appContent.classList.remove('hidden');
    }
  }
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) revealContent();
  });
  
  if (scrollIndicator) {
    scrollIndicator.addEventListener('click', (e) => {
      e.preventDefault();
      revealContent();
      window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    });
  }
  
  if (window.scrollY > 50) revealContent();
}

// ─── Initialize map ────────────────────────────────────────────────────────
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
  
  markersLayer = L.markerClusterGroup({
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    disableClusteringAtZoom: 12
  }).addTo(newMap);
  
  return newMap;
}

// ─── Show Results in Side Panel ───────────────────────────────────────────────
function showResultsInPanel(politicians, isSearchResult = false) {
  const resultsList = document.getElementById('results');
  const panelEmpty = document.getElementById('panel-empty');
  const statusMsg = document.getElementById('status');
  const clearBtn = document.getElementById('clear-results-btn');
  
  if (!resultsList) return;
  
  if (!politicians || politicians.length === 0) {
    resultsList.innerHTML = '';
    if (panelEmpty) panelEmpty.style.display = 'block';
    if (statusMsg) statusMsg.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'none';
    return;
  }
  
  if (panelEmpty) panelEmpty.style.display = 'none';
  if (statusMsg) statusMsg.style.display = 'block';
  if (isSearchResult && clearBtn) clearBtn.style.display = 'inline-block';
  
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

// ─── Clear Results ────────────────────────────────────────────────────────────
function clearResults() {
  const resultsList = document.getElementById('results');
  const panelEmpty = document.getElementById('panel-empty');
  const clearBtn = document.getElementById('clear-results-btn');
  const statusMsg = document.getElementById('status');
  
  if (resultsList) resultsList.innerHTML = '';
  if (panelEmpty) panelEmpty.style.display = 'block';
  if (clearBtn) clearBtn.style.display = 'none';
  if (statusMsg) statusMsg.style.display = 'none';
  
  if (searchInput) searchInput.value = '';
  currentQuery = '';
  currentProvince = '';
  if (provinceFilter) provinceFilter.value = '';
}

// ─── Clear button handler ─────────────────────────────────────────────────────
const clearBtn = document.getElementById('clear-results-btn');
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    clearResults();
    if (map) map.setView([56.1304, -106.3468], 4);
  });
}

// ─── Main fetch function ──────────────────────────────────────────────────────
async function fetchPoliticians(query = "", province = "", offset = 0) {
  const statusMsg = document.getElementById('status');
  if (!statusMsg) return;
  
  statusMsg.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
  
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
      statusMsg.innerHTML = '<p class="empty">No politicians found. Try adjusting your search.</p>';
      showResultsInPanel([], true);
      if (markersLayer) markersLayer.clearLayers();
      return;
    }
    
    const from = offset + 1;
    const to = Math.min(offset + LIMIT, totalCount);
    statusMsg.innerHTML = `Found ${totalCount} result${totalCount !== 1 ? "s" : ""} — showing ${from}–${to}`;
    
    showResultsInPanel(politicians, true);
    updateMapMarkers(politicians);
    renderPagination();
    
  } catch (err) {
    console.error(err);
    statusMsg.innerHTML = `<p class="error">⚠️ ${err.message}</p>`;
  }
}

// ─── Update map markers ───────────────────────────────────────────────────────
function updateMapMarkers(politicians) {
  if (!markersLayer || !map) return;
  
  markersLayer.clearLayers();
  const markers = [];
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
    
    const coloredIcon = L.divIcon({
      className: 'colored-marker',
      html: `<div style="background-color: ${markerColor}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); transition: transform 0.2s; cursor: pointer;"></div>`,
      iconSize: [24, 24],
      popupAnchor: [0, -12]
    });
    
    const popupContent = `
      <div class="map-popup" onclick="window.showPoliticianModal('${escapeHtml(politician.name)}', '${escapeHtml(politician.party)}', '${escapeHtml(politician.district)}', '${escapeHtml(politician.province)}')">
        <strong>${escapeHtml(politician.name)}</strong>
        <div class="popup-party" style="color: ${markerColor}; font-weight: bold;">${escapeHtml(politician.party)}</div>
        <div class="popup-district">${escapeHtml(politician.district)}</div>
      </div>
    `;
    
    const marker = L.marker([coords.lat, coords.lng], { icon: coloredIcon }).bindPopup(popupContent);
    markers.push(marker);
    bounds.push([coords.lat, coords.lng]);
  });
  
  markersLayer.addLayers(markers);
  if (bounds.length > 0 && map) map.fitBounds(bounds, { padding: [40, 40] });
  
  console.log(`Map updated: ${markers.length} markers added`);
}

// ─── Quick Filters ────────────────────────────────────────────────────────────
function initQuickFilters() {
  const quickFilters = document.querySelectorAll('.quick-filter');
  quickFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      const province = btn.dataset.province;
      quickFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (provinceFilter) {
        provinceFilter.value = province;
        provinceFilter.dispatchEvent(new Event('change'));
      }
    });
  });
}

// ─── Show Politician Modal ────────────────────────────────────────────────────
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
        photoDiv.innerHTML = `<div class="modal-initials" style="width: 100px; height: 100px; border-radius: 50%; background: #c0392b; color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto; font-size: 2rem; font-weight: bold;">${getInitials(name)}</div>`;
      }
      modalBody.insertBefore(photoDiv, modalBody.firstChild);
    } else if (imageUrl) {
      existingPhoto.innerHTML = `<img src="${imageUrl}" alt="${escapeHtml(name)}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #c0392b;">`;
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

// ─── Fetch Quotes ─────────────────────────────────────────────────────────────
async function fetchQuotesForPolitician(name) {
  const modalQuotes = document.getElementById("modal-quotes-text");
  if (!modalQuotes) return;
  
  modalQuotes.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading speeches from Hansard...</div>';
  
  try {
    const response = await fetch(`/api/quotes?politician=${encodeURIComponent(name)}&t=${Date.now()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    if (data.objects && data.objects.length > 0) {
      const quotesHtml = data.objects.map(statement => {
        let text = statement.text?.en || "";
        if (!text || text === "No text available") return "";
        const date = statement.date || "";
        return `
          <blockquote style="margin: 16px 0; padding: 16px; background: #f9f9f9; border-left: 4px solid #c0392b; border-radius: 8px;">
            <i class="fas fa-quote-left" style="color: #c0392b; margin-right: 8px; opacity: 0.5; float: left;"></i>
            <div style="margin-left: 24px;">
              "${escapeHtml(text)}"
              ${date ? `<footer style="margin-top: 12px; font-size: 11px; color: #999;">📅 ${date}</footer>` : ''}
            </div>
          </blockquote>
        `;
      }).join('');
      modalQuotes.innerHTML = quotesHtml || '<p>No recent speeches found.</p>';
    } else {
      modalQuotes.innerHTML = '<p>No recent speeches found for this representative.</p>';
    }
  } catch (error) {
    console.error("Error fetching speeches:", error);
    modalQuotes.innerHTML = '<p style="color: #c0392b;">Unable to load speeches at this time.</p>';
  }
}

// ─── Helper Functions ─────────────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function getInitials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).map(p => p[0]).join("").slice(0, 2).toUpperCase();
}

function renderPagination() {
  const paginationDiv = document.getElementById('pagination');
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
  
  document.getElementById("prev-btn")?.addEventListener("click", () => 
    fetchPoliticians(currentQuery, currentProvince, currentOffset - LIMIT));
  document.getElementById("next-btn")?.addEventListener("click", () => 
    fetchPoliticians(currentQuery, currentProvince, currentOffset + LIMIT));
}

// ─── Province Filter ──────────────────────────────────────────────────────────
if (provinceFilter) {
  provinceFilter.addEventListener("change", async () => {
    currentProvince = provinceFilter.value;
    currentQuery = "";
    if (searchInput) searchInput.value = "";
    currentOffset = 0;
    closeDropdown();
    await fetchPoliticians("", currentProvince, 0);
  });
}

// ─── Autocomplete ─────────────────────────────────────────────────────────────
function fetchSuggestions(query) {
  if (!query || query.length < 2) { closeDropdown(); return; }
  const q = query.toLowerCase();
  const filtered = allReps.filter(p => p.name.toLowerCase().includes(q) || p.district.toLowerCase().includes(q)).slice(0, 8);
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
    li.addEventListener("mousedown", e => { e.preventDefault(); selectSuggestion(li.dataset.name); });
  });
}

function closeDropdown() {
  if (dropdown) { dropdown.hidden = true; dropdown.innerHTML = ""; }
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
      if (activeIndex >= 0) items[activeIndex].scrollIntoView({ block: "nearest" });
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
      const statusMsg = document.getElementById('status');
      if (statusMsg) statusMsg.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting your location...';
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          if (map) map.setView([latitude, longitude], 10);
          await findNearestDistrict(latitude, longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
          const statusMsg = document.getElementById('status');
          if (statusMsg) statusMsg.innerHTML = '<p class="error">Unable to get your location. Please search manually.</p>';
          setTimeout(() => { if (statusMsg) statusMsg.innerHTML = ""; }, 3000);
        }
      );
    }
  });
}

async function findNearestDistrict(lat, lng) {
  if (!window.ridingCoords) return;
  const statusMsg = document.getElementById('status');
  if (statusMsg) statusMsg.innerHTML = '<i class="fas fa-search"></i> Finding your electoral district...';
  
  let nearestDistrict = null;
  let minDistance = Infinity;
  for (const [district, coords] of Object.entries(window.ridingCoords)) {
    const distance = Math.sqrt(Math.pow(lat - coords.lat, 2) + Math.pow(lng - coords.lng, 2));
    if (distance < minDistance) { minDistance = distance; nearestDistrict = district; }
  }
  
  if (nearestDistrict && searchInput) {
    if (statusMsg) statusMsg.innerHTML = `<i class="fas fa-check-circle"></i> Found district: ${nearestDistrict}`;
    searchInput.value = nearestDistrict;
    currentQuery = nearestDistrict;
    currentOffset = 0;
    fetchPoliticians(currentQuery, currentProvince, 0);
    setTimeout(() => { if (statusMsg) statusMsg.innerHTML = ""; }, 3000);
  }
}

// ─── Close Modal ──────────────────────────────────────────────────────────────
function closeModalFunction() { if (modal) modal.style.display = 'none'; }
if (closeModal) closeModal.addEventListener("click", closeModalFunction);
if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) closeModalFunction(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal?.style.display === 'flex') closeModalFunction(); });

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  const mapElement = document.getElementById('map');
  if (mapElement) mapElement.style.opacity = '0.5';
  
  initScrollAnimation();
  map = initMap();
  if (modal) modal.style.display = 'none';
  
  try {
    const res = await fetch("/api/politicians?limit=400");
    const data = await res.json();
    allReps = data.politicians || [];
  } catch (error) { console.error("Failed to load initial data:", error); }
  
  await fetchPoliticians();
  if (mapElement) mapElement.style.opacity = '1';
  initQuickFilters();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}