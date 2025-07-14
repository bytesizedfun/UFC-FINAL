let username = localStorage.getItem("username");

if (!username) {
  document.getElementById("login").style.display = "block";
} else {
  document.getElementById("login").style.display = "none";
  loadApp();
}

function lockName() {
  const input = document.getElementById("username");
  const name = input.value.trim();
  if (name.length < 2) return alert("Enter a valid name");
  localStorage.setItem("username", name);
  location.reload();
}

async function loadApp() {
  const res = await fetch("/api/fights");
  const { fights, event } = await res.json();

  document.getElementById("fightForm").innerHTML = `
    <h2>${event}</h2>
    <form id="pickForm">
      ${fights.map(f => `
        <div class="fight">
          <h3>${f.name}</h3>
          <label>Pick:
            <select name="fighter-${f.id}">
              <option value="">-- Choose --</option>
              <option value="${f.fighterA}">${f.fighterA}</option>
              <option value="${f.fighterB}">${f.fighterB}</option>
            </select>
          </label>
          <label>Method:
            <select name="method-${f.id}">
              <option value="">-- Method --</option>
              <option value="KO">KO</option>
              <option value="Sub">Sub</option>
              <option value="Dec">Dec</option>
            </select>
          </label>
        </div>
      `).join("")}
      <button type="submit">Submit Picks</button>
    </form>
  `;

  document.getElementById("pickForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const picks = fights.map(f => {
      return {
        fightId: f.id,
        fighter: e.target[`fighter-${f.id}`].value,
        method: e.target[`method-${f.id}`].value
      };
    });
    await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: localStorage.getItem("username"), picks })
    });
    alert("Picks submitted!");
    showPicks(picks, fights);
    loadLeaderboard();
  });

  showPicksFromFile(fights);
  loadLeaderboard();
}

async function showPicksFromFile(fights) {
  const res = await fetch("/api/fights");
  const all = await fetch("/api/leaderboard").then(r => r.json());
  const me = localStorage.getItem("username");
  const myWk = all.weekly.find(x => x.user === me);
  const myAll = all.allTime.find(x => x.user === me);
  document.getElementById("myPicks").innerHTML = `
    <h2>Your Picks (${me})</h2>
    <p><strong>Weekly:</strong> ${myWk ? myWk.weekly : 0} pts</p>
    <p><strong>All-Time:</strong> ${myAll ? myAll.total : 0} pts</p>
  `;
}

function showPicks(picks, fights) {
  const list = picks.map(p => {
    const f = fights.find(f => f.id === p.fightId);
    return `<li>${f.name}: <strong>${p.fighter}</strong> by ${p.method}</li>`;
  }).join("");
  document.getElementById("myPicks").innerHTML += `<ul>${list}</ul>`;
}

function loadLeaderboard() {
  fetch("/api/leaderboard")
    .then(res => res.json())
    .then(data => {
      const wk = data.weekly.map((x, i) => `<li>#${i + 1} ${x.user} - ${x.weekly} pts</li>`).join("");
      const all = data.allTime.map((x, i) => `<li>#${i + 1} ${x.user} - ${x.total} pts</li>`).join("");
      document.getElementById("leaderboard").innerHTML = `
        <h2>🏆 Leaderboards</h2>
        <h3>Weekly</h3><ul>${wk}</ul>
        <h3>All-Time</h3><ul>${all}</ul>
      `;
    });
}
