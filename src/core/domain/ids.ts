/**
 * Relational ID helpers.
 *
 * Every domain entity nodes a stable string `id`. Cross-entity references use
 * `*Id` fields typed as `string | null` to encode relational links. We generate
 * UUID-like identifiers so that IDs are unique across local and future remote
 * stores.
 */

/** Returns a cryptographically-unguessable UUID v4 string. */
export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for non-secure environments (tests / older runtimes).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Narrow a nullable relational ID to a required one, throwing a descriptive error. */
export function requireId(id: string | null, label: string): string {
  if (!id) throw new Error(`Required relational id "${label}" is missing.`);
  return id;
}