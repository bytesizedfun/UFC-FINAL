const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const picksFile = path.join(__dirname, "data", "picks.json");
const fightsFile = path.join(__dirname, "data", "fights.json");

function load(file) {
  try {
    return JSON.parse(fs.readFileSync(file));
  } catch (err) {
    console.error(`❌ Failed to load ${file}:`, err);
    return {};
  }
}

function save(file, data) {
  const backupFile = file + ".bak";
  try {
    // Create a backup first
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, backupFile);
    }
    // Save updated data
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`❌ Failed to save ${file}:`, err);
    if (fs.existsSync(backupFile)) {
      fs.copyFileSync(backupFile, file);
      console.log(`🔁 Restored ${file} from backup.`);
    }
  }
}

app.get("/api/fights", (req, res) => {
  res.json(load(fightsFile));
});

app.post("/api/submit", (req, res) => {
  const { username, picks, append } = req.body;
  if (!username || !Array.isArray(picks)) return res.status(400).json({ error: "Invalid data" });

  const all = load(picksFile);

  // Ensure this user has an array
  if (!all[username]) all[username] = [];

  if (append) {
    const existingIds = new Set(all[username].map(p => p.fightId));
    const newPicks = picks.filter(p => !existingIds.has(p.fightId));
    all[username] = all[username].concat(newPicks);
  } else {
    all[username] = picks;
  }

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
