/* lib/utils/stringUtils.ts */
/**
 * Convert string to integer with validation
 */
// Receving any type is fine because we are dealing with unknown json data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stringToInt(numberStr: any): number {
  // Note: parseInt() returns the first integer so "31 45 23" -> 31
  const result = Number.parseInt(numberStr, 10);
  if (Number.isNaN(result)) {
    throw new Error(`${numberStr} cannot be parsed as an integer`);
  }
  return result;
}

/**
 * Convert various string/boolean representations to boolean
 */
export function stringToBoolean(booleanStr: string | boolean): boolean {
  if (typeof booleanStr === 'boolean') {
    return booleanStr;
  }

  if (booleanStr === null || booleanStr === undefined || booleanStr === '') {
    return false;
  }

  if (typeof booleanStr === 'string') {
    const normalized = booleanStr.toLowerCase().trim();
    if (['yes', 'true', '1', 'y', 'on', 'enabled'].includes(normalized)) {
      return true;
    }
    if (['no', 'false', '0', 'n', 'off', 'disabled', ''].includes(normalized)) {
      return false;
    }
  }

  if (typeof booleanStr === 'number') {
    return booleanStr !== 0;
  }

  console.warn(`Unexpected boolean value: ${booleanStr} (type: ${typeof booleanStr})`);
  return false;
}

/**
 * Parse string list from text with bullet points
 */
export function parseStringList(text: string): string[] {
  const lines = text.split('\n');

  // Map over each line to trim the leading "- " or "* "
  const trimmedItems = lines.map((line) => {
    // Check if the line starts with "- " or "* " and then remove it
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return line.substring(2).trim();
    }
    return line.trim();
  });

  // Filter out any empty strings that might result from empty lines
  return trimmedItems.filter((item) => item !== '');
}
