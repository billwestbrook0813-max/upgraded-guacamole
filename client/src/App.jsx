
import React, { useEffect, useState } from 'react'

function formatPST(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

export default function App() {
  const [date, setDate] = useState(new Date().toISOString().slice(0,10))
  const [projection, setProjection] = useState(null)
  const [slate, setSlate] = useState(null)
  const [bookmaker, setBookmaker] = useState('')
  const [debugMode, setDebugMode] = useState(false)
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(false)

  async function loadAll(d) {
    setLoading(true)
    try {
      const [p, s] = await Promise.all([
        fetch(`/api/projection?date=${d}&book=${encodeURIComponent(bookmaker)}&debug=${debugMode?1:0}`).then(r=>r.json()),
        fetch(`/api/slate?date=${d}`).then(r=>r.json())
      ])
      setProjection(p)
      setSlate(s)
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ loadAll(date) },[])

  return (
    <div className="max-w-6xl mx-auto p-4 text-gray-900 dark:text-gray-50">
      <header className="mb-4 flex items-center gap-4">
        <img src="/logo.svg" alt="Logo" className="h-10"/>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">MLB Runs Tracker & Projection</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">PST times • Market‑implied projections (de‑vig)</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="border rounded px-2 py-1 bg-white dark:bg-neutral-900"/>
            <select value={bookmaker} onChange={e=>setBookmaker(e.target.value)} className="border rounded px-2 py-1 bg-white dark:bg-neutral-900">
              <option value="">Any Book</option>
              <option value="draftkings">DraftKings</option>
              <option value="fanduel">FanDuel</option>
              <option value="betmgm">BetMGM</option>
              <option value="caesars">Caesars</option>
              <option value="pointsbetus">PointsBet</option>
            </select>
            <label className="text-sm flex items-center gap-1">
              <input type="checkbox" checked={debugMode} onChange={e=>setDebugMode(e.target.checked)} /> Debug
            </label>
            <button onClick={()=>loadAll(date)} className="px-3 py-1 rounded bg-black text-white">Refresh</button>
            <a href={`/api/ics?date=${date}`} className="px-3 py-1 rounded border">Download .ics</a>
            <button onClick={()=>{
              const html = document.documentElement;
              const isDark = html.classList.toggle('dark');
              try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch {}
            }} className="px-3 py-1 rounded border">Toggle Dark</button>
          </div>
        </div>
      </header>

      {loading && <div className="p-3 bg-yellow-100 text-yellow-900 border rounded">Loading…</div>}

      {projection && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="rounded-2xl shadow p-4 bg-white dark:bg-neutral-900">
            <div className="text-sm text-gray-500 dark:text-gray-300">Total Runs Scored</div>
            <div className="text-3xl font-bold">{projection.runsScored?.toFixed?.(2) ?? projection.runsScored}</div>
          </div>
          <div className="rounded-2xl shadow p-4 bg-white dark:bg-neutral-900">
            <div className="text-sm text-gray-500 dark:text-gray-300">Expected Remaining</div>
            <div className="text-3xl font-bold">{projection.expectedRemaining?.toFixed?.(2) ?? projection.expectedRemaining}</div>
          </div>
          <div className="rounded-2xl shadow p-4 bg-white dark:bg-neutral-900">
            <div className="text-sm text-gray-500 dark:text-gray-300">Projected Slate Finish</div>
            <div className="text-3xl font-bold">{projection.projectedSlateFinish?.toFixed?.(2) ?? projection.projectedSlateFinish}</div>
          </div>
        </section>
      )}

      {/* Ticker */}
      <section className="mb-6">
        <style>{`
        @keyframes scrollX { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-ticker { animation: scrollX 25s linear infinite; }
        `}</style>
        <div className="rounded-2xl shadow bg-white dark:bg-neutral-900 p-3 overflow-hidden">
          <div className="text-sm font-semibold mb-2">Today’s Slate (Ticker)</div>
          <div className="flex gap-8 py-1 whitespace-nowrap animate-ticker will-change-transform">
            {slate?.games?.concat(slate?.games || []).map((g,i) => (
              <div key={g.gamePk+'-'+i} className="min-w-[240px] flex-shrink-0">
                <div className="text-xs text-gray-500 dark:text-gray-300">{formatPST(g.startTimePST)} PST</div>
                <div className="font-semibold">{g.away.code} @ {g.home.code}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">{g.status}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Games table */}
      <section>
        <div className="rounded-2xl shadow overflow-hidden">
          <table className="min-w-full bg-white dark:bg-neutral-900">
            <thead className="bg-gray-100 dark:bg-neutral-800 text-xs uppercase text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-3 py-2 text-left">Game</th>
                <th className="px-3 py-2 text-left">Start (PST)</th>
                <th className="px-3 py-2 text-left">Pitchers (W-L, ERA)</th>
                <th className="px-3 py-2 text-left">Runs So Far</th>
                <th className="px-3 py-2 text-left">Implied Total</th>
                <th className="px-3 py-2 text-left">Expected Remaining</th>
                <th className="px-3 py-2 text-left">Debug</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {projection?.games?.map(row => {
                const g = slate?.games?.find(x => x.gamePk === row.gamePk)
                const hp = g?.probablePitchers?.home
                const ap = g?.probablePitchers?.away
                return (
                  <tr key={row.gamePk} className="border-t border-neutral-200 dark:border-neutral-800">
                    <td className="px-3 py-2">{g?.away?.name} @ {g?.home?.name}</td>
                    <td className="px-3 py-2">{formatPST(g?.startTimePST)}</td>
                    <td className="px-3 py-2">
                      <div><span className="font-medium">{g?.away?.code}</span> — {ap?.name || 'TBD'} {ap?.wins != null ? `(${ap.wins}-${ap.losses}, ${ap.era} ERA)` : ''}</div>
                      <div><span className="font-medium">{g?.home?.code}</span> — {hp?.name || 'TBD'} {hp?.wins != null ? `(${hp.wins}-${hp.losses}, ${hp.era} ERA)` : ''}</div>
                    </td>
                    <td className="px-3 py-2">{row.runsSoFar}</td>
                    <td className="px-3 py-2">{row.impliedTotal != null ? row.impliedTotal.toFixed(2) : '—'}</td>
                    <td className="px-3 py-2">{row.expectedRemaining != null ? row.expectedRemaining.toFixed(2) : '—'}</td>
                    <td className="px-3 py-2">
                      <button onClick={()=> setModal(row)} className="px-2 py-1 text-xs rounded bg-brand-accent/20">View</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl rounded-2xl shadow-soft bg-white dark:bg-neutral-900 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">De‑vig Debug — {modal.label}</div>
              <button onClick={()=>setModal(null)} className="px-2 py-1 rounded border">Close</button>
            </div>
            <div className="text-sm overflow-auto max-h-[60vh]">
              {!modal.debug?.debugLines?.length && <div>No lines available.</div>}
              {modal.debug?.debugLines?.length > 0 && (
                <table className="min-w-full text-sm">
                  <thead className="text-xs uppercase">
                    <tr><th className="px-2 py-1 text-left">Line</th><th className="px-2 py-1 text-left">Over Odds</th><th className="px-2 py-1 text-left">Under Odds</th></tr>
                  </thead>
                  <tbody>
                    {modal.debug.debugLines.map((ln,i)=>(
                      <tr key={i} className="border-t border-neutral-200 dark:border-neutral-800">
                        <td className="px-2 py-1">{ln.point}</td>
                        <td className="px-2 py-1">{ln.overOdds}</td>
                        <td className="px-2 py-1">{ln.underOdds}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
