let username = localStorage.getItem("username");
const loginDiv = document.getElementById("login");
const fightForm = document.getElementById("fightForm");
const myPicksDiv = document.getElementById("myPicks");
const leaderboardDiv = document.getElementById("leaderboard");

if (username) {
  loginDiv.style.display = "none";
  fightForm.style.display = "block";
  loadFights();
  loadMyPicks();
  loadLeaderboard();
}

function lockName() {
  const input = document.getElementById("username");
  const name = input.value.trim();
  if (!name) return alert("Enter a valid name");
  localStorage.setItem("username", name);
  location.reload();
}

function loadFights() {
  fetch("/api/fights")
    .then(res => res.json())
    .then(data => {
      const event = document.createElement("h2");
      event.textContent = `🗓️ Event: ${data.event}`;
      fightForm.appendChild(event);

      data.fights.forEach(fight => {
        const div = document.createElement("div");
        div.className = "fight";
        div.innerHTML = `
          <h3>${fight.f1} vs ${fight.f2}</h3>
          <select id="fighter-${fight.id}">
            <option value="">Select Winner</option>
            <option value="${fight.f1}">${fight.f1}</option>
            <option value="${fight.f2}">${fight.f2}</option>
          </select>
          <select id="method-${fight.id}">
            <option value="">Method</option>
            <option value="KO">KO</option>
            <option value="Submission">Submission</option>
            <option value="Decision">Decision</option>
          </select>
        `;
        fightForm.appendChild(div);
      });

      const btn = document.createElement("button");
      btn.textContent = "Submit Picks";
      btn.onclick = submitPicks;
      fightForm.appendChild(btn);
    });
}

function submitPicks() {
  const selects = document.querySelectorAll("select");
  const picks = [];
  selects.forEach(s => {
    const id = s.id.split("-")[1];
    const fighter = document.getElementById(`fighter-${id}`).value;
    const method = document.getElementById(`method-${id}`).value;
    if (fighter && method) {
      picks.push({ fightId: id, fighter, method });
    }
  });

  fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, picks })
  })
    .then(res => res.json())
    .then(() => {
      alert("✅ Picks submitted!");
      loadMyPicks();
      loadLeaderboard();
    });
}

function loadMyPicks() {
  fetch(`/api/mypicks/${username}`)
    .then(res => res.json())
    .then(data => {
      myPicksDiv.innerHTML = "<h2>📋 Your Picks</h2>";
      if (!data.picks || data.picks.length === 0) {
        myPicksDiv.innerHTML += "<p>No picks submitted yet.</p>";
        return;
      }

      const ul = document.createElement("ul");
      data.picks.forEach(pick => {
        const fight = data.fights.find(f => f.id === pick.fightId);
        const li = document.createElement("li");
        li.textContent = `${fight.f1} vs ${fight.f2} — You picked ${pick.fighter} by ${pick.method}`;
        ul.appendChild(li);
      });

      myPicksDiv.appendChild(ul);
    });
}

function loadLeaderboard() {
  fetch("/api/leaderboard")
    .then(res => res.json())
    .then(data => {
      leaderboardDiv.innerHTML = "<h2>🏆 Leaderboard</h2>";

      const weekly = document.createElement("div");
      weekly.innerHTML = "<h3>This Week</h3><ul>" +
        data.weekly.map(p => `<li>${p.user}: ${p.weekly} pts</li>`).join("") +
        "</ul>";

      const allTime = document.createElement("div");
      allTime.innerHTML = "<h3>All-Time</h3><ul>" +
        data.allTime.map(p => `<li>${p.user}: ${p.total} pts</li>`).join("") +
        "</ul>";

      leaderboardDiv.appendChild(weekly);
      leaderboardDiv.appendChild(allTime);
    });
}
