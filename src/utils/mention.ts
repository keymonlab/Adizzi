export const MENTION_REGEX = /@(\w+)/g;

/**
 * Extract all @mentions from text
 * @param text - Text to parse
 * @returns Array of handles (without @ symbol)
 */
export function parseMentions(text: string): string[] {
  const mentions = new Set<string>();
  let match: RegExpExecArray | null;

  // Reset regex lastIndex to ensure proper iteration
  MENTION_REGEX.lastIndex = 0;

  while ((match = MENTION_REGEX.exec(text)) !== null) {
    const handle = match[1];
    if (handle) {
      mentions.add(handle);
    }
  }

  return Array.from(mentions);
}

/**
 * Replace @mentions with user IDs
 * @param text - Text containing @mentions
 * @param handleToIdMap - Mapping of handles to user IDs
 * @returns Array of matched user IDs
 */
export function replaceMentionsWithIds(
  text: string,
  handleToIdMap: Record<string, string>
): string[] {
  const mentions = parseMentions(text);
  return mentions
    .filter((handle) => handle in handleToIdMap)
    .map((handle) => handleToIdMap[handle]);
}
