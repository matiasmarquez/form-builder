/** Build an `aria-describedby` value from optional element ids. */
export function joinAriaDescribedBy(
  ...ids: Array<string | undefined | false | null>
): string | undefined {
  const present = ids.filter((id): id is string => typeof id === 'string' && id.length > 0);
  return present.length > 0 ? present.join(' ') : undefined;
}
