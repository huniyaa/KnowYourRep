// This file contains coordinates for Canadian electoral districts
// All district names should match EXACTLY what the OpenParliament API returns

const ridingCoords = {
  // ============= ALBERTA =============
  "Edmonton Manning": { lat: 53.576, lng: -113.403 },
  "Edmonton Centre": { lat: 53.542, lng: -113.493 },
  "Edmonton Griesbach": { lat: 53.587, lng: -113.482 },
  "Edmonton Mill Woods": { lat: 53.457, lng: -113.426 },
  "Edmonton Riverbend": { lat: 53.457, lng: -113.556 },
  "Edmonton Strathcona": { lat: 53.520, lng: -113.431 },
  "Edmonton West": { lat: 53.528, lng: -113.617 },
  "Calgary Centre": { lat: 51.048, lng: -114.071 },
  "Calgary Confederation": { lat: 51.075, lng: -114.126 },
  "Calgary Forest Lawn": { lat: 51.043, lng: -113.951 },
  "Calgary Heritage": { lat: 50.978, lng: -114.124 },
  "Calgary McKnight": { lat: 51.103, lng: -114.012 },
  "Calgary Midnapore": { lat: 50.915, lng: -114.088 },
  "Calgary Nose Hill": { lat: 51.117, lng: -114.071 },
  "Calgary Rocky Ridge": { lat: 51.151, lng: -114.205 },
  "Calgary Shepard": { lat: 50.936, lng: -113.959 },
  "Calgary Signal Hill": { lat: 51.015, lng: -114.179 },
  "Calgary Skyview": { lat: 51.134, lng: -113.985 },
  "Banff—Airdrie": { lat: 51.178, lng: -114.912 },
  "Battle River—Crowfoot": { lat: 52.031, lng: -112.321 },
  "Bow River": { lat: 50.415, lng: -112.649 },
  "Foothills": { lat: 50.256, lng: -113.825 },
  "Fort McMurray—Cold Lake": { lat: 55.452, lng: -111.398 },
  "Grande Prairie—Mackenzie": { lat: 55.226, lng: -118.787 },
  "Lakeland": { lat: 54.019, lng: -111.458 },
  "Lethbridge": { lat: 49.694, lng: -112.831 },
  "Medicine Hat—Cardston—Warner": { lat: 49.698, lng: -111.991 },
  "Peace River—Westlock": { lat: 55.377, lng: -115.282 },
  "Red Deer—Lacombe": { lat: 52.274, lng: -113.800 },
  "Red Deer—Mountain View": { lat: 51.681, lng: -114.624 },
  "Sherwood Park—Fort Saskatchewan": { lat: 53.611, lng: -113.129 },
  "St. Albert—Edmonton": { lat: 53.680, lng: -113.605 },
  "Yellowhead": { lat: 53.558, lng: -116.429 },
  
  // ============= BRITISH COLUMBIA =============
  "Vancouver East": { lat: 49.279, lng: -123.066 },
  "Vancouver Centre": { lat: 49.280, lng: -123.121 },
  "Vancouver Granville": { lat: 49.257, lng: -123.131 },
  "Vancouver Kingsway": { lat: 49.253, lng: -123.072 },
  "Vancouver Quadra": { lat: 49.262, lng: -123.170 },
  "Vancouver South": { lat: 49.218, lng: -123.094 },
  "Burnaby North—Seymour": { lat: 49.282, lng: -122.988 },
  "Burnaby South": { lat: 49.243, lng: -122.978 },
  "Surrey Centre": { lat: 49.184, lng: -122.846 },
  "Surrey—Newton": { lat: 49.121, lng: -122.855 },
  "Richmond Centre": { lat: 49.167, lng: -123.140 },
  "Victoria": { lat: 48.428, lng: -123.365 },
  "Saanich—Gulf Islands": { lat: 48.727, lng: -123.429 },
  "North Vancouver": { lat: 49.345, lng: -123.065 },
  "West Vancouver—Sunshine Coast—Sea to Sky Country": { lat: 49.718, lng: -123.158 },
  "Abbotsford": { lat: 49.052, lng: -122.317 },
  "Chilliwack—Hope": { lat: 49.344, lng: -121.670 },
  "Kelowna—Lake Country": { lat: 49.982, lng: -119.437 },
  "Kamloops—Thompson—Cariboo": { lat: 51.263, lng: -120.325 },
  "Prince George—Peace River—Northern Rockies": { lat: 55.861, lng: -122.239 },
  "Cariboo—Prince George": { lat: 53.394, lng: -122.743 },
  "Skeena—Bulkley Valley": { lat: 54.911, lng: -127.513 },
  "North Island—Powell River": { lat: 50.159, lng: -126.033 },
  "Courtenay—Alberni": { lat: 49.467, lng: -125.124 },
  "Nanaimo—Ladysmith": { lat: 49.153, lng: -123.984 },
  "Cowichan—Malahat—Langford": { lat: 48.780, lng: -124.125 },
  "Esquimalt—Saanich—Sooke": { lat: 48.466, lng: -123.570 },
  
  // ============= ONTARIO (Major ones to start) =============
  "Toronto Centre": { lat: 43.653, lng: -79.383 },
  "Toronto—Danforth": { lat: 43.681, lng: -79.352 },
  "Toronto—St. Paul's": { lat: 43.675, lng: -79.396 },
  "Ottawa Centre": { lat: 45.410, lng: -75.702 },
  "Ottawa South": { lat: 45.363, lng: -75.682 },
  "Ottawa—Vanier": { lat: 45.431, lng: -75.668 },
  "Hamilton Centre": { lat: 43.256, lng: -79.869 },
  "London North Centre": { lat: 43.002, lng: -81.252 },
  "Kitchener Centre": { lat: 43.450, lng: -80.479 },
  "Mississauga Centre": { lat: 43.581, lng: -79.647 },
  "Brampton Centre": { lat: 43.697, lng: -79.761 },
  "Markham—Unionville": { lat: 43.857, lng: -79.306 },
  "Oakville": { lat: 43.448, lng: -79.665 },
  "Burlington": { lat: 43.352, lng: -79.785 },
  "Oshawa": { lat: 43.915, lng: -78.859 },
  "Barrie—Innisfil": { lat: 44.364, lng: -79.659 },
  "Kingston and the Islands": { lat: 44.231, lng: -76.481 },
  "Sudbury": { lat: 46.490, lng: -81.012 },
  "Thunder Bay—Rainy River": { lat: 48.644, lng: -91.433 },
  "Windsor—Tecumseh": { lat: 42.319, lng: -82.887 },
  "Niagara Falls": { lat: 43.082, lng: -79.090 },
  "Guelph": { lat: 43.545, lng: -80.249 },
  "Waterloo": { lat: 43.459, lng: -80.539 },
  
  // ============= QUEBEC =============
  "Montreal Centre": { lat: 45.501, lng: -73.567 },
  "Québec": { lat: 46.812, lng: -71.235 },
  "Gatineau": { lat: 45.484, lng: -75.652 },
  "Laval—Les Îles": { lat: 45.542, lng: -73.749 },
  "Sherbrooke": { lat: 45.400, lng: -71.895 },
  "Trois-Rivières": { lat: 46.347, lng: -72.547 },
  "Hull—Aylmer": { lat: 45.428, lng: -75.744 },
  "Brossard—Saint-Lambert": { lat: 45.462, lng: -73.472 },
  "Longueuil—Saint-Hubert": { lat: 45.526, lng: -73.430 },
  
  // ============= MANITOBA =============
  "Winnipeg Centre": { lat: 49.894, lng: -97.157 },
  "Winnipeg North": { lat: 49.938, lng: -97.123 },
  "Winnipeg South": { lat: 49.821, lng: -97.149 },
  "Winnipeg South Centre": { lat: 49.858, lng: -97.154 },
  "Brandon—Souris": { lat: 49.826, lng: -99.956 },
  
  // ============= SASKATCHEWAN =============
  "Saskatoon—University": { lat: 52.129, lng: -106.590 },
  "Saskatoon West": { lat: 52.149, lng: -106.716 },
  "Regina—Wascana": { lat: 50.445, lng: -104.589 },
  "Regina—Lewvan": { lat: 50.435, lng: -104.646 },
  "Prince Albert": { lat: 53.642, lng: -105.445 },
  
  // ============= NOVA SCOTIA =============
  "Halifax": { lat: 44.648, lng: -63.575 },
  "Halifax West": { lat: 44.671, lng: -63.672 },
  "Dartmouth—Cole Harbour": { lat: 44.686, lng: -63.527 },
  "Cape Breton—Canso": { lat: 45.787, lng: -61.134 },
  "Sydney—Victoria": { lat: 46.142, lng: -60.265 },
  
  // ============= NEW BRUNSWICK =============
  "Fredericton": { lat: 45.964, lng: -66.643 },
  "Moncton—Riverview—Dieppe": { lat: 46.094, lng: -64.781 },
  "Saint John—Rothesay": { lat: 45.316, lng: -66.059 },
  
  // ============= NEWFOUNDLAND =============
  "St. John's East": { lat: 47.566, lng: -52.713 },
  "St. John's South—Mount Pearl": { lat: 47.514, lng: -52.779 },
  
  // ============= PRINCE EDWARD ISLAND =============
  "Charlottetown": { lat: 46.238, lng: -63.131 },
  
  // ============= TERRITORIES =============
  "Northwest Territories": { lat: 64.825, lng: -124.845 },
  "Nunavut": { lat: 70.299, lng: -83.107 },
  "Yukon": { lat: 63.626, lng: -135.168 }
};

// Province centers for districts without coordinates
const provinceFallbacks = {
  "AB": { lat: 53.933, lng: -116.576 },
  "BC": { lat: 53.726, lng: -127.647 },
  "MB": { lat: 55.000, lng: -97.000 },
  "NB": { lat: 46.500, lng: -66.500 },
  "NL": { lat: 53.000, lng: -60.000 },
  "NS": { lat: 44.681, lng: -63.744 },
  "NT": { lat: 64.825, lng: -124.845 },
  "NU": { lat: 70.299, lng: -83.107 },
  "ON": { lat: 51.253, lng: -85.323 },
  "PE": { lat: 46.500, lng: -63.500 },
  "QC": { lat: 52.939, lng: -73.549 },
  "SK": { lat: 54.000, lng: -106.000 },
  "YT": { lat: 63.626, lng: -135.168 }
};

// Function to get coordinates for a district
function getRidingCoordinates(districtName, provinceCode) {
  // Try exact match first
  if (ridingCoords[districtName]) {
    return ridingCoords[districtName];
  }
  
  // Try case-insensitive match
  const lowerName = districtName.toLowerCase();
  for (const [key, coords] of Object.entries(ridingCoords)) {
    if (key.toLowerCase() === lowerName) {
      return coords;
    }
  }
  
  // Try partial match (for districts with em dash vs hyphen differences)
  const normalizedName = districtName.replace(/[—–]/g, '-');
  for (const [key, coords] of Object.entries(ridingCoords)) {
    const normalizedKey = key.replace(/[—–]/g, '-');
    if (normalizedKey === normalizedName) {
      return coords;
    }
  }
  
  // Try to extract city name (first part before dash)
  const firstPart = normalizedName.split('-')[0].split('—')[0].trim();
  for (const [key, coords] of Object.entries(ridingCoords)) {
    if (key.includes(firstPart) && key.length > firstPart.length) {
      return coords;
    }
  }
  
  // Fallback to province center
  if (provinceCode && provinceFallbacks[provinceCode]) {
    console.log(`Using province fallback for ${districtName} (${provinceCode})`);
    return provinceFallbacks[provinceCode];
  }
  
  // Default to center of Canada
  console.log(`No coordinates found for ${districtName}`);
  return { lat: 56.130, lng: -106.346 };
}

// Make it globally available
if (typeof window !== 'undefined') {
  window.ridingCoords = ridingCoords;
  window.getRidingCoordinates = getRidingCoordinates;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ridingCoords, getRidingCoordinates, provinceFallbacks };
}