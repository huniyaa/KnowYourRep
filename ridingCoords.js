const ridingCoords = {
  "Edmonton Manning": { lat: 53.57, lng: -113.39 },
  "Edmonton Centre": { lat: 53.55, lng: -113.50 },
  "Calgary Skyview": { lat: 51.10, lng: -113.95 },
  "Calgary Centre": { lat: 51.04, lng: -114.07 },

  "Toronto Centre": { lat: 43.65, lng: -79.38 },
  "Toronto—Danforth": { lat: 43.68, lng: -79.34 },
  "Scarborough—Agincourt": { lat: 43.79, lng: -79.28 },
  "Mississauga—Erin Mills": { lat: 43.56, lng: -79.74 },

  "Vancouver East": { lat: 49.28, lng: -123.06 },
  "Vancouver Centre": { lat: 49.28, lng: -123.12 },
  "Burnaby South": { lat: 49.22, lng: -122.98 },

  "Winnipeg Centre": { lat: 49.90, lng: -97.14 },

  "Montréal Centre": { lat: 45.50, lng: -73.57 },
  "Québec": { lat: 46.81, lng: -71.21 },

  "Halifax": { lat: 44.65, lng: -63.57 }
};

function normalizeDistrict(name) {
  return name
    .replace(/—/g, "—") // keep em dash consistent
    .replace(/–/g, "—")
    .trim();
}

const coords = ridingCoords[normalizeDistrict(rep.district)];