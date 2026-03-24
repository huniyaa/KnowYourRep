const searchInput = document.getElementById("search");
const resultsDiv = document.getElementById("results");

let allReps = [];

async function loadData() {
  const res = await fetch("/api/politicians");
  allReps = await res.json();
}

searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();

  const filtered = allReps.filter(rep =>
    rep.district.toLowerCase().includes(query)
  );

  displayResults(filtered);
});

function displayResults(reps) {
  resultsDiv.innerHTML = reps.map(rep => `
    <div class="card">
      <h3>${rep.name}</h3>
      <p>${rep.party}</p>
      <p>${rep.district}</p>
    </div>
  `).join("");
}

loadData();