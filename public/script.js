document.addEventListener("DOMContentLoaded", () => {
  const loginDiv = document.getElementById("login");
  const fightForm = document.getElementById("fightForm");
  const leaderboardDiv = document.getElementById("leaderboard");

  const username = localStorage.getItem("username");

  if (!username) {
    loginDiv.style.display = "block";
    fightForm.style.display = "none";
  } else {
    loginDiv.style.display = "none";
    fightForm.style.display = "block";

    const welcome = document.createElement("h2");
    welcome.textContent = `IIIIIT'S TIME... Welcome back ${username}`;
    welcome.style.textAlign = "center";
    welcome.style.color = "#ff1a1a";
    fightForm.prepend(welcome);

    loadFights();
    loadLeaderboard();
  }

  window.lockName = function () {
    const input = document.getElementById("username");
    const name = input.value.trim();
    if (!name) return alert("Please enter a name.");
    localStorage.setItem("username", name);
    location.reload();
  };

  function loadFights() {
    fetch("/api/fights")
      .then(res => res.json())
      .then(fightData => {
        fetch(`/api/mypicks/${username}`)
          .then(res => res.json())
          .then(userData => {
            const picked = userData.picks || [];
            const pickedIds = picked.map(p => p.fightId);

            const event = document.createElement("h2");
            event.textContent = fightData.event;
            fightForm.appendChild(event);

            fightData.fights.forEach(fight => {
              const div = document.createElement("div");
              div.className = "fight";

              const isPicked = pickedIds.includes(fight.id);
              div.innerHTML = `
                <h3>${fight.f1} vs ${fight.f2}</h3>
                <select id="fighter-${fight.id}" ${isPicked ? "disabled" : ""}>
                  <option value="">Select Winner</option>
                  <option value="${fight.f1}">${fight.f1}</option>
                  <option value="${fight.f2}">${fight.f2}</option>
                </select>
                <select id="method-${fight.id}" ${isPicked ? "disabled" : ""}>
                  <option value="">Method</option>
                  <option value="KO">KO</option>
                  <option value="Submission">Submission</option>
                  <option value="Decision">Decision</option>
                </select>
                <button onclick="submitSinglePick('${fight.id}')" ${isPicked ? "disabled" : ""}>Lock Pick</button>
              `;

              fightForm.appendChild(div);
            });
          });
      });
  }

  window.submitSinglePick = function (fightId) {
    const fighter = document.getElementById(`fighter-${fightId}`).value;
    const method = document.getElementById(`method-${fightId}`).value;
    if (!fighter || !method) {
      alert("Pick both fighter and method.");
      return;
    }

    fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: localStorage.getItem("username"),
        picks: [{ fightId, fighter, method }],
        append: true
      })
    })
      .then(res => res.json())
      .then(() => {
        alert("✅ Pick locked in!");
        location.reload();
      });
  };

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
});
