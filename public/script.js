let username = localStorage.getItem("ufc_username") || "";

function lockName() {
  const input = document.getElementById("username");
  username = input.value.trim();
  if (!username) return alert("Enter a name!");
  localStorage.setItem("ufc_username", username);
  document.getElementById("login").style.display = "none";
  document.getElementById("fightForm").style.display = "block";
  loadFights();
  loadPicks();
}

function loadFights() {
  fetch("/api/fights")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("fightForm");
      container.innerHTML = `<h2>Welcome back, ${username} 👊</h2>`;
      data.fights.forEach(fight => {
        const div = document.createElement("div");
        div.className = "fight";
        div.innerHTML = `
          <h3>${fight.f1} vs ${fight.f2}</h3>
          <label>Winner:
            <select id="winner-${fight.id}">
              <option value="">Pick winner</option>
              <option value="${fight.f1}">${fight.f1}</option>
              <option value="${fight.f2}">${fight.f2}</option>
            </select>
          </label>
          <label>Method:
            <select id="method-${fight.id}">
              <option value="">Pick method</option>
              <option value="KO">KO</option>
              <option value="Sub">Sub</option>
              <option value="Dec">Dec</option>
            </select>
          </label>
        `;
        container.appendChild(div);
      });

      const btn = document.createElement("button");
      btn.textContent = "Submit Picks";
      btn.onclick = submitPicks;
      container.appendChild(btn);
    });
}

function submitPicks() {
  fetch("/api/fights")
    .then(res => res.json())
    .then(data => {
      const picks = data.fights.map(fight => {
        return {
          fightId: fight.id,
          fighter: document.getElementById(`winner-${fight.id}`).value,
          method: document.getElementById(`method-${fight.id}`).value,
        };
      });
      fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, picks })
      }).then(() => {
        alert("Picks submitted!");
        loadPicks();
        loadLeaderboard();
      });
    });
}

function loadPicks() {
  fetch("/api/fights")
    .then(res => res.json())
    .then(data => {
      fetch("/api/leaderboard")
        .then(res => res.json())
        .then(leaderboard => {
          const picksDiv = document.getElementById("myPicks");
          const my = leaderboard.picks?.[username];
          if (!my || !my.length) {
            picksDiv.innerHTML = "<h3>No picks submitted yet.</h3>";
            return;
          }

          picksDiv.innerHTML = "<h2>My Picks</h2><ul>" + my.map(p => {
            const fight = data.fights.find(f => f.id === p.fightId);
            return `<li><strong>${fight?.f1} vs ${fight?.f2}:</strong> ${p.fighter} by ${p.method}</li>`;
          }).join("") + "</ul>";
        });
    });
}

function loadLeaderboard() {
  fetch("/api/leaderboard")
    .then(res => res.json())
    .then(data => {
      let div = document.getElementById("leaderboard");
      div.innerHTML = "<h2>🏆 Weekly Champ</h2><ul>";
      data.weekly.forEach((p, i) => {
        div.innerHTML += `<li>${i + 1}. ${p.user} - ${p.weekly} pts</li>`;
      });
      div.innerHTML += "</ul><h2>📊 All-Time Standings</h2><ul>";
      data.allTime.forEach((p, i) => {
        div.innerHTML += `<li>${i + 1}. ${p.user} - ${p.total} pts</li>`;
      });
      div.innerHTML += "</ul>";
    });
}

if (username) {
  document.getElementById("login").style.display = "none";
  document.getElementById("fightForm").style.display = "block";
  loadFights();
  loadPicks();
  loadLeaderboard();
} else {
  document.getElementById("fightForm").style.display = "none";
  document.getElementById("leaderboard").innerHTML = "<p>Enter your name to see the picks and leaderboard.</p>";
}
