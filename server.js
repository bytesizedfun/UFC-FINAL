const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const picksFile = path.join(__dirname, "data", "picks.json");
const fightsFile = path.join(__dirname, "data", "fights.json");

function load(file) {
  return JSON.parse(fs.readFileSync(file));
}
function save(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

app.get("/api/fights", (req, res) => {
  res.json(load(fightsFile));
});

app.post("/api/submit", (req, res) => {
  const { username, picks } = req.body;
  if (!username || !Array.isArray(picks)) return res.status(400).json({ error: "Invalid data" });

  const all = load(picksFile);
  all[username] = picks;
  save(picksFile, all);
  res.json({ success: true });
});

app.get("/api/mypicks/:username", (req, res) => {
  const allPicks = load(picksFile);
  const userPicks = allPicks[req.params.username] || [];
  const fights = load(fightsFile).fights;
  res.json({ picks: userPicks, fights });
});

app.get("/api/leaderboard", (req, res) => {
  const picks = load(picksFile);
  const fights = load(fightsFile);
  const results = fights.results || [];
  const underdogs = {};
  fights.fights.forEach(f => underdogs[f.id] = f.underdog);

  const weekly = [], allTime = [];

  for (const user in picks) {
    let total = 0, weeklyPoints = 0;

    picks[user].forEach(pick => {
      const result = results.find(r => r.fightId == pick.fightId);
      if (!result) return;

      let pts = 0;

      console.log(`Scoring pick for ${user}:`, pick);
      console.log(`Matched result:`, result);

      if (pick.fighter === result.winner) {
        pts += 1;
        if (pick.method === result.method) pts += 1;
        if (underdogs[pick.fightId] === pick.fighter) pts += 2;
      }

      console.log(`+${pts} points awarded for this pick`);

      total += pts;
      if (result.event === fights.event) weeklyPoints += pts;
    });

    weekly.push({ user, weekly: weeklyPoints });
    allTime.push({ user, total });
  }

  weekly.sort((a, b) => b.weekly - a.weekly);
  allTime.sort((a, b) => b.total - a.total);

  res.json({ weekly, allTime });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Fantasy Fight Picks running on port ${PORT}`));
