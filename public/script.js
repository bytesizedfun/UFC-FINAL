let lockedUser = localStorage.getItem("username");

function lockName() {
  const input = document.getElementById("username");
  const name = input.value.trim();

  if (!name) {
    alert("Enter a fighter name.");
    return;
  }

  localStorage.setItem("username", name);
  lockedUser = name;
  document.getElementById("login").style.display = "none";
  loadFights();
}

if (lockedUser) {
  document.getElementById("login").style.display = "none";
  loadFights();
}

function loadFights() {
  fetch("/api/fights")
    .then(res => res.json())
    .then(data => {
      showFightForm(data.fights);
      showMyPicks(data.fights);
      loadLeaderboard();
    });
}

function showFightForm(fights) {
  const div = document.getElementById("fightForm");
  div.innerHTML = `<h2>Make Your Picks</h2>`;
  const form = document.createElement("form");

  fights.forEach(fight => {
    const section = document.createElement("div");
    section.className = "fight";

    const fighterSelect = document.createElement("select");
    fighterSelect.name = `fighter-${fight.id}`;
    fighterSelect.innerHTML = `
      <option value="">Pick a winner</option>
      <option value="${fight.f1}">${fight.f1}</option>
      <option value="${fight.f2}">${fight.f2}</option>
    `;

    const methodSelect = document.createElement("select");
    methodSelect.name = `method-${fight.id}`;
    methodSelect.innerHTML = `
      <option value="">Method of Victory</option>
      <option value="KO/TKO">KO/TKO</option>
      <option value="Submission">Submission</option>
      <option value="Decision">Decision</option>
    `;

    section.innerHTML = `<strong>${fight.f1} vs ${fight.f2}</strong>`;
    section.appendChild(fighterSelect);
    section.appendChild(methodSelect);
    form.appendChild(section);
  });

  const btn = document.createElement("button");
  btn.type = "submit";
  btn.innerText = "Submit Picks";
  form.appendChild(btn);

  form.onsubmit = (e) => {
    e.preventDefault();
    const picks = [];
    fights.forEach(fight => {
      const fighter = form[`fighter-${fight.id}`].value;
      const method = form[`method-${fight.id}`].value;
      if (fighter) {
        picks.push({ fightId: fight.id, fighter, method });
      }
    });

    fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: lockedUser, picks })
    }).then(() => {
      alert("Picks submitted!");
      showMyPicks(fights);
    });
  };

  div.appendChild(form);
  div.style.display = "block";
}

function showMyPicks(fights) {
  fetch("/api/fights")
    .then(res => res.json())
    .then(fData => {
      fetch("/api/leaderboard")
        .then(res => res.json())
        .then(lb => {
          const userPicks = lb.weekly.find(u => u.user === lockedUser);
          const picksList = document.createElement("ul");
          const div = document.getElementById("myPicks");
          div.innerHTML = `<h2>Your Picks (${lockedUser})</h2>`;

          if (!userPicks) {
            div.innerHTML += `<p>No picks submitted yet.</p>`;
            return;
          }

          const p = fData.picks?.[lockedUser] || [];
          p.forEach(pk => {
            const fight = fData.fights.find(f => f.id === pk.fightId);
            if (fight) {
              const li = document.createElement("li");
              li.innerText = `${fight.f1} vs ${fight.f2} → ${pk.fighter} by ${pk.method}`;
              picksList.appendChild(li);
            }
          });

          div.appendChild(picksList);
        });
    });
}

function loadLeaderboard() {
  fetch("/api/leaderboard")
    .then(res => res.json())
    .then(data => {
      const div = document.getElementById("leaderboard");
      div.innerHTML = `<h2>🏆 Weekly Leaderboard</h2>`;
      const wkList = document.createElement("ul");
      data.weekly.forEach((u, i) => {
        wkList.innerHTML += `<li><strong>${i + 1}. ${u.user}</strong> – ${u.weekly} pts</li>`;
      });
      div.appendChild(wkList);

      div.innerHTML += `<h3>📊 All-Time Scores</h3>`;
      const allList = document.createElement("ul");
      data.allTime.forEach((u, i) => {
        allList.innerHTML += `<li>${i + 1}. ${u.user} – ${u.total} pts</li>`;
      });
      div.appendChild(allList);
    });
}
