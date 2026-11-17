/**
 * The calendar day and hour for a moment, in a time zone given as minutes east of UTC.
 * The server's own clock zone is never used, so it behaves the same on any machine.
 */
export function localParts(now, tzOffsetMin) {
  const d = new Date(now + tzOffsetMin * 60_000);
  const p = (n) => String(n).padStart(2, '0');
  return {
    day: `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`,
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    /** 0 is Sunday, 1 is Monday. */
    dow: d.getUTCDay(),
  };
}
