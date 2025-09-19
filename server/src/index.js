
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getSlate } from './lib/slate.js';
import { getOdds } from './lib/odds.js';
import { computeProjection } from './lib/projection.js';

const app = express();
app.use(cors());

app.get('/health', (_, res) => res.json({ ok: true }));

app.get('/api/slate', async (req, res) => {
  try {
    const date = req.query.date; // YYYY-MM-DD
    const data = await getSlate(date);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch slate' });
  }
});

app.get('/api/odds', async (req, res) => {
  try {
    const date = req.query.date; // not strictly used by Odds API
    const data = await getOdds(date);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch odds' });
  }
});

app.get('/api/projection', async (req, res) => {
  try {
    const date = req.query.date;
    const [slate, odds] = await Promise.all([getSlate(date), getOdds(date)]);
    const result = computeProjection(slate, odds, { book: req.query.book, debug: req.query.debug });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute projection' });
  }
});

app.get('/api/ics', async (req, res) => {
  try {
    const date = req.query.date;
    const slate = await getSlate(date);
    const toICSDate = (iso) => {
      const d = new Date(iso);
      const pad = (n)=> String(n).padStart(2,'0');
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth()+1);
      const dd = pad(d.getDate());
      const HH = pad(d.getHours());
      const MM = pad(d.getMinutes());
      const SS = pad(d.getSeconds());
      return `${yyyy}${mm}${dd}T${HH}${MM}${SS}`;
    };
    let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//MLB Runs//EN\r\n';
    for (const g of slate.games || []) {
      const start = toICSDate(g.startTimePST);
      const summary = `${g.away.name} @ ${g.home.name}`;
      const desc = `Status: ${g.status || ''}\\nAway SP: ${g.probablePitchers?.away?.name || 'TBD'}\\nHome SP: ${g.probablePitchers?.home?.name || 'TBD'}`;
      ics += 'BEGIN:VEVENT\r\n';
      ics += `UID:${g.gamePk}@mlb-runs\r\n`;
      ics += `DTSTART;TZID=America/Los_Angeles:${start}\r\n`;
      ics += `SUMMARY:${summary}\r\n`;
      ics += `DESCRIPTION:${desc}\r\n`;
      ics += 'END:VEVENT\r\n';
    }
    ics += 'END:VCALENDAR\r\n';
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.send(ics);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to generate ICS' });
  }
});

const PORT = process.env.PORT || 5177;
app.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
});
