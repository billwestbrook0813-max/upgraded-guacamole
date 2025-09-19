
import axios from 'axios';
import { DateTime } from 'luxon';
import { cached } from './cache.js';

export async function getSlate(dateStr) {
  const date = dateStr || DateTime.now().setZone('America/Los_Angeles').toISODate();
  const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}&hydrate=team,linescore,probablePitcher`;
  const data = await cached(`slate:${date}`, 30, async ()=>{
    const { data } = await axios.get(url, { timeout: 15000 });
    return data;
  });

  const games = [];
  for (const d of data.dates ?? []) {
    for (const g of d.games ?? []) {
      const gamePk = g.gamePk;
      const home = g.teams?.home?.team;
      const away = g.teams?.away?.team;
      const start = DateTime.fromISO(g.gameDate, { zone: 'utc' }).setZone('America/Los_Angeles').toISO();
      const status = g.status?.detailedState;
      const linescore = g.linescore ?? null;

      const homeProb = g.teams?.home?.probablePitcher ?? null;
      const awayProb = g.teams?.away?.probablePitcher ?? null;

      const enrichPitcher = async (pp) => {
        if (!pp?.id) return null;
        const peopleUrl = `https://statsapi.mlb.com/api/v1/people/${pp.id}?hydrate=stats(group=[pitching],type=[season])`
        const { data } = await axios.get(peopleUrl, { timeout: 15000 });
        const person = data.people?.[0];
        let era = null, wins = null, losses = null;
        const splits = person?.stats?.[0]?.splits ?? [];
        if (splits.length > 0) {
          const season = splits[0];
          era = season?.stat?.era ?? null;
          wins = season?.stat?.wins ?? null;
          losses = season?.stat?.losses ?? null;
        }
        return { id: pp.id, name: pp.fullName, era, wins, losses };
      };

      const [homeP, awayP] = await Promise.all([enrichPitcher(homeProb), enrichPitcher(awayProb)]);

      games.push({
        gamePk,
        startTimePST: start,
        status,
        home: { id: home?.id, name: home?.name, code: home?.abbreviation },
        away: { id: away?.id, name: away?.name, code: away?.abbreviation },
        probablePitchers: { home: homeP, away: awayP },
        runsSoFar: (() => {
          if (!linescore) return 0;
          const homeR = Number(linescore?.teams?.home?.runs ?? 0);
          const awayR = Number(linescore?.teams?.away?.runs ?? 0);
          return homeR + awayR;
        })(),
        isFinal: (status || '').toLowerCase().includes('final')
      });
    }
  }
  return { date, games };
}
