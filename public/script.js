document.addEventListener("DOMContentLoaded", () => {
  const loginDiv = document.getElementById("login");
  const fightForm = document.getElementById("fightForm");
  const myPicksDiv = document.getElementById("myPicks");
  const leaderboardDiv = document.getElementById("leaderboard");

  let username = localStorage.getItem("username");

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

    checkIfAlreadyPicked();
    loadMyPicks();
    loadLeaderboard();
  }

  window.lockName = function () {
    const input = document.getElementById("username");
    const name = input.value.trim();
    if (!name) return alert("Please enter a name.");
    localStorage.setItem("username", name);
    location.reload();
  };

  function checkIfAlreadyPicked() {
    fetch(`/api/mypicks/${localStorage.getItem("username")}`)
      .then(res => res.json())
      .then(data => {
        if (data.picks && data.picks.length > 0) {
          const msg = document.createElement("p");
          msg.textContent = "✅ You’ve already submitted your picks for this card.";
          msg.style.textAlign = "center";
          msg.style.color = "#66ff66";
          fightForm.appendChild(msg);
        } else {
          loadFights();
        }
      });
  }

  function loadFights() {
    fetch("/api/fights")
      .then(res => res.json())
      .then(data => {
        const event = document.createElement("h2");
        event.textContent = data.event;
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
              <option value="KO">KO</optio
