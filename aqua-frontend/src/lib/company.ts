/**
 * Facts about the company that more than one page states, kept in one place so
 * they can't drift apart on screen.
 *
 * 1995 is when the business opened in Nablus as "Al-Amir Sanitary Installations
 * & Swimming Pools"; it was renamed Aqua Pool in 2023. Anything that quotes
 * years of experience derives it from here rather than hardcoding a number that
 * silently goes stale each January.
 */
export const FOUNDED = 1995;

export function yearsInBusiness(now: Date = new Date()) {
  return now.getFullYear() - FOUNDED;
}
