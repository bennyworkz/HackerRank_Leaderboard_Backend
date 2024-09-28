const express = require('express');
const cors = require('cors');
const { scrapeLeaderboard } = require('./leaderboardScraper');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post('/api/leaderboard', async (req, res) => {
  try {
    const { contestSlug, password } = req.body;
    const { data, excelBuffer } = await scrapeLeaderboard(contestSlug, password);
    
    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.set('Content-Disposition', `attachment; filename=HackerRank_${contestSlug}_Leaderboard.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});