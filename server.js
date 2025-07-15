const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();
app.use(express.json());
app.use(express.static("public"));

// PostgreSQL connection
const db = new Pool({
  user: "fantasy_fight_db_user",
  host: "dpg-d1qsg2gdl3ps73eopo2g-a",
  database: "fantasy_fight_db",
  password: "YOUR_RENDER_PASSWORD", // <-- paste it here
  port: 5432,
});

// Still use local fights file for now
const fs = require("fs");
const fightsFile = path.join(__dirname, "data", "fights.json");

function loadFights() {
  try {
    return JSON.parse(fs.readFileSync(fightsFile));
  } catch (err) {
    console.error("❌ Failed to load fights file:", err);
    return { fights: [], event: "", results: [] };
  }
}

app.get("/api/fights", (req, res) => {
  res.json(loadFights());
});

app.post("/api/submit", async (req, res) => {
  const { username, picks } = req.body;
  if (!username || !Array.isArray(picks)) return res.status(400).json({ error: "Invalid data" });

  try {
    await db.query("DELETE FROM picks WHERE username = $1", [username]);

    for (const pick of picks) {
      await db.query(
        "INSERT INTO picks (username, fight_id, fighter, method) VALUES ($1, $2, $3, $4)",
        [username, pick.fightId, pick.fighter, pick.method]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ DB Error on submit:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/mypicks/:username", async (req, res) => {
  try {
    const result = await db.query("SELECT fight_id, fighter, method FROM picks WHERE username = $1", [req.params.username]);
    const picks = result.rows.map(row => ({
      fightId: row.fight_id,
      fighter: row.fighter,
      method: row.method
    }));

    const fights = loadFights().fights;
    res.json({ picks, fights });
  } catch (err) {
    console.error("❌ DB Error on mypicks:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const fightData = loadFights();
    const results = fightData.results || [];
    const underdogs = {};
    fightData.fights.forEach(f => underdogs[f.id] = f.underdog);

    const dbRes = await db.query("SELECT * FROM picks");
    const picks = dbRes.rows;

    const userScores = {};

    for (const pick of picks) {
      const result = results.find(r => r.fightId == pick.fight_id);
      if (!result) continue;

      let pts = 0;
      if (pick.fighter === result.winner) {
        pts += 1;
        if (pick.method === result.method) pts += 1;
        if (underdogs[pick.fight_id] === pick.fighter) pts += 2;
      }

      if (!userScores[pick.username]) {
        userScores[pick.username] = { total: 0, weekly: 0 };
      }

      userScores[pick.username].total += pts;
      if (result.event === fightData.event) userScores[pick.username].weekly += pts;
    }

    const weekly = Object.entries(userScores)
      .map(([user, s]) => ({ user, weekly: s.weekly }))
      .sort((a, b) => b.weekly - a.weekly);

    const allTime = Object.entries(userScores)
      .map(([user, s]) => ({ user, total: s.total }))
      .sort((a, b) => b.total - a.total);

    res.json({ weekly, allTime });
  } catch (err) {
    console.error("❌ Leaderboard DB error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Fantasy Fight Picks running on port ${PORT}`));
