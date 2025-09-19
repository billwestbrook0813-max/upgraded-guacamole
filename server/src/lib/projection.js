
function probFromAmerican(odds) {
  const n = Number(odds);
  if (Number.isNaN(n)) return null;
  if (n >= 0) return 100 / (n + 100);
  return (-n) / ((-n) + 100);
}

function devigTwoWay(pOverRaw, pUnderRaw) {
  const denom = (pOverRaw + pUnderRaw);
  if (denom <= 0) return { pOver: null, pUnder: null };
  const pOver = pOverRaw / denom;
  return { pOver, pUnder: 1 - pOver };
}

function impliedTotalFromLines(lines) {
  const pts = [];
  for (const ln of lines) {
    const po = probFromAmerican(ln.overOdds);
    const pu = probFromAmerican(ln.underOdds);
    if (po == null || pu == null) continue;
    const { pOver } = devigTwoWay(po, pu);
    if (pOver == null) continue;
    pts.push({ L: Number(ln.point), pOver });
  }
  if (pts.length === 0) return null;
  pts.sort((a,b)=> a.L - b.L);
  let exact = pts.find(x => Math.abs(x.pOver - 0.5) < 1e-6);
  if (exact) return exact.L;
  let below = null, above = null;
  for (const p of pts) {
    if (p.pOver < 0.5) below = p;
    if (p.pOver > 0.5 && !above) { above = p; break; }
  }
  if (below && above) {
    const t = (0.5 - below.pOver) / (above.pOver - below.pOver);
    return below.L + t * (above.L - below.L);
  }
  const mid = Math.floor(pts.length/2);
  return pts[mid].L;
}

function extractTotalsFromBook(markets) {
  const totals = [];
  for (const m of markets || []) {
    if (m.key === 'totals' || m.key === 'alternate_totals') {
      for (const out of (m.outcomes || [])) {
        totals.push({
          point: Number(out.point),
          overOdds: out.name?.toLowerCase() === 'over' ? out.price : null,
          underOdds: out.name?.toLowerCase() === 'under' ? out.price : null
        });
      }
    }
  }
  const byPoint = new Map();
  for (const t of totals) {
    if (!byPoint.has(t.point)) byPoint.set(t.point, { point: t.point, overOdds: null, underOdds: null });
    const r = byPoint.get(t.point);
    if (t.overOdds != null) r.overOdds = t.overOdds;
    if (t.underOdds != null) r.underOdds = t.underOdds;
  }
  return Array.from(byPoint.values()).filter(x => x.overOdds != null && x.underOdds != null);
}

function selectBookMarkets(ev, reqBook) {
  if (reqBook) {
    const chosen = (ev.bookmakers || []).find(b => (b.key || '').toLowerCase() === reqBook.toLowerCase());
    if (chosen) return chosen.markets || [];
  }
  const any = (ev.bookmakers || []).find(b => (b.markets || []).length);
  return any ? any.markets : [];
}

export function computeProjection(slate, odds, opts = {}) {
  const byMatch = new Map();
  const reqBook = (opts.book || '').toLowerCase();

  for (const ev of odds.events || []) {
    const markets = selectBookMarkets(ev, reqBook);
    const lines = extractTotalsFromBook(markets);
    const implied = impliedTotalFromLines(lines);
    byMatch.set(`${ev.away} @ ${ev.home}`, { impliedTotal: implied, debugLines: lines });
  }

  let runsScored = 0;
  let expectedRemaining = 0;
  const perGame = [];

  for (const g of slate.games || []) {
    const key = `${g.away.name} @ ${g.home.name}`;
    runsScored += g.runsSoFar || 0;
    const impliedTotal = byMatch.get(key)?.impliedTotal ?? null;
    const expRem = (impliedTotal != null) ? Math.max(0, impliedTotal - (g.runsSoFar || 0)) : null;
    if (expRem != null && !g.isFinal) expectedRemaining += expRem;

    perGame.push({
      gamePk: g.gamePk,
      label: key,
      status: g.status,
      runsSoFar: g.runsSoFar,
      impliedTotal,
      expectedRemaining: (g.isFinal || impliedTotal == null) ? 0 : expRem,
      debug: byMatch.get(key)
    });
  }

  return {
    date: slate.date,
    runsScored,
    expectedRemaining,
    projectedSlateFinish: runsScored + expectedRemaining,
    games: perGame
  };
}
