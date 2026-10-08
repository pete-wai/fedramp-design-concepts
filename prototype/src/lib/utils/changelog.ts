/* lib/utils/changelog.ts */
import { resolve } from '$lib/utils/paths';
import type { Entry, Changelog } from '$lib/types/changelog.ts';

const absoluteUrlPattern = /^[a-z][a-z\d+\-.]*:/i;

export function resolveChangelogLink(link = ''): string {
  return absoluteUrlPattern.test(link) ? link : (resolve as (path: string) => string)(link);
}

export function getDetails(data: Changelog) {
  const firstThreeEntries = data.entries.slice(0, 3);
  const dates = firstThreeEntries.map((entry) => entry.date);
  const descriptions = firstThreeEntries.map((entry) => {
    const hrefs = entry.links.map((href) => `<a href="${resolveChangelogLink(href.link)}">${href.name}</a>`);
    return getDetailStr(entry, hrefs);
  });
  const tags = firstThreeEntries.map((entry) => entry.tag || '');

  return [dates, descriptions, tags];
}

export function getDetailStr(entry: Entry, hrefs: string[]): string {
  const detailString = entry.details;

  if (hrefs.length === 0) {
    return detailString;
  }

  const linksString = hrefs.join(', ');
  const lastComma = linksString.lastIndexOf(', ');

  let finalString: string;
  if (lastComma !== -1) {
    finalString = linksString.substring(0, lastComma) + ', and ' + linksString.substring(lastComma + 2);
  } else {
    finalString = linksString;
  }

  return `${detailString} (See ${finalString})`;
}

export function getOverview(data: Changelog): [string[], string[], (string | undefined)[]] {
  const firstThreeEntries = data.entries.slice(0, 3);
  const dates = firstThreeEntries.map((entry) => entry.date);
  const descriptions = firstThreeEntries.map((entry) => entry.details); // Just get the details string
  const tags = firstThreeEntries.map((entry) => entry.tag || '');
  return [dates, descriptions, tags];
}

export function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th'; // 11th, 12th, 13th
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  const monthName = monthNames[month - 1];
  const dayWithSuffix = `${day}${getOrdinalSuffix(day)}`;

  return `${monthName} ${dayWithSuffix}, ${year}`;
}
