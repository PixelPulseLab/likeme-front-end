export function isProtocolStepAutoCompleted(updatedAt: string | null | undefined, now: Date = new Date()): boolean {
  const trimmed = updatedAt?.trim();
  if (!trimmed) {
    return false;
  }

  const publicationMs = Date.parse(trimmed);
  if (Number.isNaN(publicationMs)) {
    return false;
  }

  return now.getTime() > publicationMs;
}
