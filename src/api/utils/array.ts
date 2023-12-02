export function uniqueBy<T>(array: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return array.filter((item) => {
    const k = key(item);
    if (seen.has(k)) {
      return false;
    }
    seen.add(k);
    return true;
  });
}
