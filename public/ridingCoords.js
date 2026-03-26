// Electoral district coordinates for Canadian ridings
const ridingCoords = {
  // Alberta
  "Edmonton Manning": { lat: 53.57, lng: -113.39 },
  "Edmonton Centre": { lat: 53.54, lng: -113.49 },
  "Edmonton West": { lat: 53.52, lng: -113.62 },
  "Calgary Centre": { lat: 51.04, lng: -114.07 },
  "Calgary Nose Hill": { lat: 51.12, lng: -114.07 },
  "Calgary Forest Lawn": { lat: 51.04, lng: -113.95 },
  "Calgary Skyview": { lat: 51.13, lng: -113.98 },
  
  // British Columbia
  "Vancouver East": { lat: 49.28, lng: -123.06 },
  "Vancouver Centre": { lat: 49.28, lng: -123.12 },
  "Vancouver Granville": { lat: 49.26, lng: -123.13 },
  "Vancouver Kingsway": { lat: 49.25, lng: -123.07 },
  "Vancouver Quadra": { lat: 49.26, lng: -123.17 },
  "Vancouver South": { lat: 49.22, lng: -123.09 },
  "Burnaby South": { lat: 49.24, lng: -122.98 },
  "Surrey Centre": { lat: 49.18, lng: -122.85 },
  "Victoria": { lat: 48.43, lng: -123.37 },
  
  // Ontario
  "Toronto Centre": { lat: 43.65, lng: -79.38 },
  "Toronto—Danforth": { lat: 43.68, lng: -79.35 },
  "Toronto—St. Paul's": { lat: 43.67, lng: -79.40 },
  "Ottawa Centre": { lat: 45.41, lng: -75.70 },
  "Ottawa South": { lat: 45.36, lng: -75.68 },
  "Ottawa—Vanier": { lat: 45.43, lng: -75.67 },
  "Hamilton Centre": { lat: 43.26, lng: -79.87 },
  "London North Centre": { lat: 43.00, lng: -81.25 },
  "Kitchener Centre": { lat: 43.45, lng: -80.48 },
  "Mississauga Centre": { lat: 43.58, lng: -79.64 },
  
  // Quebec
  "Montreal Centre": { lat: 45.50, lng: -73.56 },
  "Montreal East": { lat: 45.55, lng: -73.52 },
  "Montreal West": { lat: 45.45, lng: -73.65 },
  "Quebec City Centre": { lat: 46.81, lng: -71.21 },
  "Laval—Les Îles": { lat: 45.55, lng: -73.75 },
  "Gatineau": { lat: 45.48, lng: -75.65 },
  
  // Manitoba
  "Winnipeg Centre": { lat: 49.89, lng: -97.16 },
  "Winnipeg North": { lat: 49.94, lng: -97.12 },
  "Winnipeg South": { lat: 49.82, lng: -97.15 },
  
  // Saskatchewan
  "Saskatoon West": { lat: 52.15, lng: -106.71 },
  "Saskatoon—University": { lat: 52.13, lng: -106.59 },
  "Regina—Lewvan": { lat: 50.44, lng: -104.65 },
  
  // Nova Scotia
  "Halifax": { lat: 44.65, lng: -63.58 },
  "Halifax West": { lat: 44.67, lng: -63.67 },
  
  // New Brunswick
  "Fredericton": { lat: 45.96, lng: -66.64 },
  "Moncton—Riverview—Dieppe": { lat: 46.09, lng: -64.78 },
  
  // Newfoundland and Labrador
  "St. John's East": { lat: 47.56, lng: -52.71 },
  "St. John's South—Mount Pearl": { lat: 47.51, lng: -52.78 },
  
  // PEI
  "Charlottetown": { lat: 46.24, lng: -63.13 },
  
  // Territories
  "Northwest Territories": { lat: 64.83, lng: -124.58 },
  "Yukon": { lat: 61.36, lng: -135.71 },
  "Nunavut": { lat: 70.30, lng: -93.50 }
};

// Make it globally available
if (typeof window !== 'undefined') {
  window.ridingCoords = ridingCoords;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ridingCoords;
}