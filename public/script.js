let username = localStorage.getItem("username");
const fightForm = document.getElementById("fightForm");
const myPicksDiv = document.getElementById("myPicks");
const leaderboardDiv = document.getElementById("leaderboard");

function lockName() {
  const nameInput = document.getElementById("username");
  const name = nameInput.value.trim();
  if (!name) return alert("Please enter a name.");
  localStorage.setItem("username", name);
  username = name;
  document.getElementById("login").innerHTML = `<h2>👊 Welcome, ${username}!</h2>`;
  loadFights();
}

function loadFights() {
  fetch("/api/fights")
    .then(res => res.json())
    .then(data => {
      const { fights } = data;
      fightForm.style.display = "block";
      fightForm.innerHTML = `<h2>📝 Make Your Picks</h2>`;
      fights.forEach(fight => {
        const div = document.createElement("div");
        div.className = "fight";
        div.innerHTML = `
          <h3>${fight.f1} vs ${fight.f2}</h3>
          <label>Pick Winner:</label>
          <select id="fighter-${fight.id}">
            <option value="">--Select--</option>
            <option value="${fight.f1}">${fight.f1}</option>
            <option value="${fight.f2}">${fight.f2}</option>
          </select>
          <label>Method:</label>
          <select id="method-${fight.id}">
            <option value="">--Select--</option>
            <option value="KO">KO</option>
            <option value="Sub">Sub</option>
            <option value="Dec">Dec</option>
          </select>
        `;
        fightForm.appendChild(div);
      });

      const btn = document.createElement("button");
      btn.textContent = "Submit Picks";
      btn.onclick = submitPicks;
      fightForm.appendChild(btn);

      loadMyPicks();
      loadLeaderboard();
    });
}

function submitPicks() {
  fetch("/api/fights")
    .then(res => res.json())
    .then(data => {
      const picks = [];
      data.fights.forEach(f => {
        const fighter = document.getElementById(`fighter-${f.id}`).value;
        const method = document.getElementById(`method-${f.id}`).value;
        if (fighter) {
          picks.push({
            fightId: f.id,
            fighter,
            method
          });
        }
      });

      if (picks.length === 0) {
        return alert("Please make at least one pick.");
      }

      fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, picks })
      }).then(res => res.json())
        .then(() => {
          alert("✅ Picks submitted!");
          loadMyPicks();
          loadLeaderboard();
        });
    });
}

function loadMyPicks() {
  fetch("/api/mypicks/" + username)
    .then(res => res.json())
    .then(data => {
      if (!data || data.length === 0) {
        myPicksDiv.innerHTML = "<h2 id='myPicks'>📋 Your Picks</h2><p>No picks submitted yet.</p>";
        return;
      }

      myPicksDiv.innerHTML = "<h2>📋 Your Picks</h2><ul>" +
        data.map(p => `<li><strong>${p.fightId}</strong>: ${p.fighter} by ${p.method}</li>`).join("") +
        "</ul>";
    });
}

function loadLeaderboard() {
  fetch("/api/leaderboard")
    .then(res => res.json())
    .then(data => {
      leaderboardDiv.innerHTML = "<h2>🏆 Leaderboard</h2>";
      leaderboardDiv.innerHTML += "<h3>This Week</h3><ul>" +
        data.weekly.map(p => `<li>${p.user}: ${p.weekly} pts</li>`).join("") +
        "</ul><h3>All Time</h3><ul>" +
        data.allTime.map(p => `<li>${p.user}: ${p.total} pts</li>`).join("") +
        "</ul>";
    });
}

// On page load
if (username) {
  document.getElementById("login").innerHTML = `<h2>👊 Welcome back, ${username}!</h2>`;
  loadFights();
}
