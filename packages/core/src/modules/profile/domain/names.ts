/** The name to greet a user by: their display name if set, otherwise their username. */
export function greetingName(profile: { displayName: string | null; username: string }): string {
  return profile.displayName?.trim() || profile.username
}

/** First word of the greeting name ("Ana Paula" → "Ana"), for short greetings. */
export function firstName(profile: { displayName: string | null; username: string }): string {
  return greetingName(profile).split(/\s+/)[0] ?? profile.username
}
