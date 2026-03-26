const ridingCoords = {
  // Alberta
  "Edmonton Manning": { lat: 53.57, lng: -113.39 },
  "Edmonton Centre": { lat: 53.54, lng: -113.49 },
  "Calgary Centre": { lat: 51.04, lng: -114.07 },
  "Calgary Nose Hill": { lat: 51.12, lng: -114.07 },
  
  // British Columbia
  "Vancouver East": { lat: 49.28, lng: -123.06 },
  "Vancouver Centre": { lat: 49.28, lng: -123.12 },
  "Vancouver Granville": { lat: 49.26, lng: -123.13 },
  
  // Ontario
  "Toronto Centre": { lat: 43.65, lng: -79.38 },
  "Toronto—Danforth": { lat: 43.68, lng: -79.35 },
  "Ottawa Centre": { lat: 45.41, lng: -75.70 },
  "Ottawa South": { lat: 45.36, lng: -75.68 },
  
  // Quebec
  "Montreal Centre": { lat: 45.50, lng: -73.56 },
  "Quebec City Centre": { lat: 46.81, lng: -71.21 },
  
  // Add more districts as needed
};

// Helper function to get district by coordinates (simplified)
function getDistrictByCoordinates(lat, lng) {
  let closestDistrict = null;
  let minDistance = Infinity;
  
  for (const [district, coords] of Object.entries(ridingCoords)) {
    const distance = Math.sqrt(
      Math.pow(lat - coords.lat, 2) + 
      Math.pow(lng - coords.lng, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestDistrict = district;
    }
  }
  
  return closestDistrict;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ridingCoords, getDistrictByCoordinates };
}