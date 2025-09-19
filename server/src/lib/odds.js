
import axios from 'axios';
import { cached } from './cache.js';

const ODDS_API_KEY = process.env.ODDS_API_KEY;

export async function getOdds() {
  if (!ODDS_API_KEY) throw new Error('Missing ODDS_API_KEY');

  const baseParams = {
    regions: 'us,us2',
    markets: 'totals,alternate_totals',
    oddsFormat: 'american',
    apiKey: ODDS_API_KEY
  };

  const endpoints = [
    'https://api.the-odds-api.com/v4/sports/baseball_mlb/odds',
    'https://api.the-odds-api.com/v4/sports/baseball_mlb/odds-live'
  ];

  const results = [];
  for (const ep of endpoints) {
    const data = await cached(`odds:${ep}`, 20, async ()=>{
      const { data } = await axios.get(ep, { params: baseParams, timeout: 15000 });
      return data;
    });
    results.push(...data);
  }

  const byEvent = {};
  for (const ev of results) {
    const key = ev.id;
    if (!byEvent[key]) byEvent[key] = { id: ev.id, home: ev.home_team, away: ev.away_team, bookmakers: [], commence_time: ev.commence_time };
    byEvent[key].bookmakers.push(...(ev.bookmakers || []));
  }

  return { events: Object.values(byEvent) };
}
