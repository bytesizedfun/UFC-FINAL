let name = localStorage.getItem("username");
const loginDiv = document.getElementById("login");
const formDiv = document.getElementById("fightForm");

if (name) {
  loginDiv.style.display = "none";
  initApp();
} else {
  loginDiv.style.display = "block";
}

function lockName() {
  const input = document.getElementById("username");
  const val = input.value.trim();
  if (val.length < 2) {
    alert("Enter a valid name");
    return;
  }
  localStorage.setItem("username", val);
  name = val;
  loginDiv.style.display = "none";
  initApp();
}

async function initApp() {
  const res = await fetch("/api/fights");
  const data = await res.json();
  const { fights, event } = data;

  const formHTML = fights.map(fight => `
    <div class="fight">
      <h3>${fight.name}</h3>
      <label>
        Pick Winner:
        <select id="fighter-${fight.id}">
          <option value="">-- Choose --</option>
          <option value="${fight.fighterA}">${fight.fighterA}</option>
          <option value="${fight.fighterB}">${fight.fighterB}</option>
        </select>
      </label>
      <label>
        Method:
        <select id="method-${fight.id}">
          <option value="">-- Method --</option>
          <option value="KO">KO</option>
          <option value="Sub">Sub</option>
          <option value="Dec">Dec</option>
        </select>
      </label>
    </div>
  `).join("");

  formDiv.innerHTML = `
    <h2>Welcome, ${name}!</h2>
    <form id="pickForm">
      ${formHTML}
      <button type="submit">Submit Picks</button>
    </form>
  `;

  document.getElementById("pickForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const picks = fights.map(f => {
      return {
        fightId: f.id,
        fighter: document.getElementById(`fighter-${f.id}`).value,
        method: document.getElementById(`method-${f.id}`).value
      };
    });
    await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: name, picks })
    });
    alert("Picks submitted!");
    showPicks(picks, fights);
    loadLeaderboard();
  });

  loadUserPicks(data);
  loadLeaderboard();
}

function loadUserPicks(data) {
  fetch("/api/fights").then(r => r.json()).then(fdata => {
    fetch("/api/leaderboard")
      .then(res => res.json())
      .then(scores => {
        const all = scores.allTime.find(p => p.user === name);
        const wk = scores.weekly.find(p => p.user === name);
        const text = `
          <h2>Your Picks (${fdata.event})</h2>
          <p><strong>Weekly:</strong> ${wk ? wk.weekly : 0} pts</p>
          <p><strong>All-Time:</strong> ${all ? all.total : 0} pts</p>
        `;
        document.getElementById("myPicks").innerHTML = text;
      });
  });
}

function showPicks(picks, fights) {
  const myDiv = document.getElementById("myPicks");
  const lines = picks.map(p => {
    const fight = fights.find(f => f.id === p.fightId);
    return `<li>${fight.name}: <strong>${p.fighter}</strong> by ${p.method}</li>`;
  }).join("");
  myDiv.innerHTML += `<ul>${lines}</ul>`;
}

function loadLeaderboard() {
  fetch("/api/leaderboard")
    .then(res => res.json())
    .then(data => {
      const all = data.allTime.map((x, i) => `<li>#${i + 1} ${x.user} - ${x.total} pts</li>`).join("");
      const wk = data.weekly.map((x, i) => `<li>#${i + 1} ${x.user} - ${x.weekly} pts</li>`).join("");
      document.getElementById("leaderboard").innerHTML = `
        <h2>🏆 Leaderboards</h2>
        <h3>Weekly Champ</h3>
        <ul>${wk}</ul>
        <h3>All-Time Ranking</h3>
        <ul>${all}</ul>
      `;
    });
}
