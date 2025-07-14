async function loadFights() {
  const res = await fetch("/api/fights");
  const data = await res.json();
  const form = document.getElementById("picks-form");
  data.fights.forEach(fight => {
    const div = document.createElement("div");
    div.className = "fight";
    div.innerHTML = `
      <strong>${fight.f1} vs ${fight.f2}</strong><br>
      <label><input type="radio" name="fight-${fight.id}" value="${fight.f1}"> ${fight.f1}</label>
      <label><input type="radio" name="fight-${fight.id}" value="${fight.f2}"> ${fight.f2}</label><br>
      <select name="method-${fight.id}">
        <option value="decision">Decision</option>
        <option value="ko">KO/TKO</option>
        <option value="submission">Submission</option>
      </select>
      <hr>`;
    form.appendChild(div);
  });
}

document.getElementById("submit-btn").onclick = async () => {
  const username = document.getElementById("username").value.trim();
  if (!username) return alert("Enter your name");

  const res = await fetch("/api/fights");
  const data = await res.json();

  const picks = [];
  data.fights.forEach(fight => {
    const pick = document.querySelector(`input[name="fight-${fight.id}"]:checked`);
    const method = document.querySelector(`select[name="method-${fight.id}"]`).value;
    if (pick) {
      picks.push({ fightId: fight.id, fighter: pick.value, method });
    }
  });

  await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, picks })
  });

  loadLeaderboard();
};

async function loadLeaderboard() {
  const res = await fetch("/api/leaderboard");
  const data = await res.json();

  const w = document.getElementById("weekly");
  const a = document.getElementById("all-time");
  w.innerHTML = "";
  a.innerHTML = "";

  data.weekly.forEach(x => {
    const li = document.createElement("li");
    li.textContent = `${x.user}: ${x.weekly} pts`;
    w.appendChild(li);
  });

  data.allTime.forEach(x => {
    const li = document.createElement("li");
    li.textContent = `${x.user}: ${x.total} pts`;
    a.appendChild(li);
  });
}

loadFights();
loadLeaderboard();
