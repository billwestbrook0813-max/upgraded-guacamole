
import { DateTime } from 'luxon';

export function slateToICS(slate) {
  const dtstamp = DateTime.utc().toFormat("yyyyMMdd'T'HHmmss'Z'");
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MLB Runs Projection//EN',
  ];

  for (const g of slate.games || []) {
    const start = DateTime.fromISO(g.startTimePST).setZone('UTC');
    const uid = `mlb-${g.gamePk}@mlb-runs-projection`;
    const sum = `${g.away.name} @ ${g.home.name}`;
    const pitchers = [
      g?.probablePitchers?.away?.name ? `${g.away.code}: ${g.probablePitchers.away.name}` : null,
      g?.probablePitchers?.home?.name ? `${g.home.code}: ${g.probablePitchers.home.name}` : null,
    ].filter(Boolean).join(' | ');

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${start.toFormat("yyyyMMdd'T'HHmmss'Z'")}`,
      `SUMMARY:${sum}`,
      `DESCRIPTION:${pitchers}`,
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
