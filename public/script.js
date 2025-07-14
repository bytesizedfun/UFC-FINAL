let fights = [];
let picks = [];

document.addEventListener("DOMContentLoaded", async () => {
  const name = localStorage.getItem("ufc_username");
  if (name) {
    document.getElementById("userSetup").style.display = "none";
    document.getElementById("mainApp").style.display = "block";
    document.getElementById("welcome").innerText = `Welcome back, ${name}!`;
    loadFights();
  }
});

function lockName() {
  const name = document.getElementById("username").value.trim();
  if (!name) return alert("Enter a name!");
  localStorage.setItem("ufc_username", name);
  location.reload();
}

async function loadFights() {
  const res = await fetch("/api/fights");
  const data = await res.json();
  fights = data.fights;
  const container = document.getElementById("fights");
  container.innerHTML = "";

  fights.forEach(f => {
    const div = document.createElement("div");
    div.className = "fight";
    div.innerHTML = `
      <strong>${f.f1}</strong> vs <strong>${f.f2}</strong><br>
      Pick: 
      <select id="fighter-${f.id}">
        <option value="">--</option>
        <option value="${f.f1}">${f.f1}</option>
        <option value="${f.f2}">${f.f2}</option>
      </select>
      Method:
      <select id="method-${f.id}">
        <option value="">--</option>
        <option value="KO/TKO">KO/TKO</option>
        <option value="Submission">Submission</option>
        <option value="Decision">Decision</option>
      </select>
    `;
    container.appendChild(div);
  });
}

async function submitPicks() {
  const username = localStorage.getItem("ufc_username");
  const selections = [];
  for (const f of fights) {
    const fighter = document.getElementById(`fighter-${f.id}`).value;
    const method = document.getElementById(`method-${f.id}`).value;
    if (!fighter || !method) continue;
    selections.push({ fightId: f.id, fighter, method });
  }
  if (selections.length === 0) return alert("No picks made.");
  const res = await fetch("/api/submit", {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, picks: selections })
  });
  if (res.ok) alert("Picks submitted!");
}

async function viewMyPicks() {
  const username = localStorage.getItem("ufc_username");
  const res = await fetch("/api/fights");
  const data = await res.json();
  const results = data.results || [];
  const myPicks = (await fetch("/api/leaderboard").then(r => r.json())).allTime.find(u => u.user === username);
  const rawPicks = (await fetch("/data/picks.json")).json(); // Not exposed, you can skip this if needed

  const picksHTML = data.fights.map(fight => {
    const match = rawPicks[username]?.find(p => p.fightId === fight.id);
    if (!match) return '';
    const result = results.find(r => r.fightId === fight.id);
    const outcome = result ? (result.winner === match.fighter ? "✅" : "❌") : "⏳";
    return `
      <div class="fight">
        <strong>${fight.f1}</strong> vs <strong>${fight.f2}</strong><br>
        You picked: ${match.fighter} by ${match.method} ${outcome}
      </div>
    `;
  }).join("");

  document.getElementById("myPicks").innerHTML = picksHTML || "No picks yet.";
}
