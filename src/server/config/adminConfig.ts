import { env } from './env.js';

/**
 * Authoritative list of platform administrator email addresses.
 *
 * Supports multi-administrator governance:
 * - Primary configured administrator: env.ADMIN_EMAIL
 * - Second requested administrator: env.SECONDARY_ADMIN_EMAIL (markzionsinachi@gmail.com)
 * - Comma-separated list: env.ADMIN_EMAILS
 */
export const STATIC_AUTHORIZED_ADMIN_EMAILS: readonly string[] = Object.freeze([
  'trustezika831@gmail.com',
  'markzionsinachi@gmail.com',
]);

export const AUTHORIZED_ADMIN_EMAILS = STATIC_AUTHORIZED_ADMIN_EMAILS;

/**
 * Retrieves all authorized administrator email addresses dynamically from environment & fallback config.
 */
export function getAllAuthorizedAdminEmails(): string[] {
  const set = new Set<string>();

  const primary = (env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (primary) set.add(primary);

  const secondary = (env.SECONDARY_ADMIN_EMAIL || '').trim().toLowerCase();
  if (secondary) set.add(secondary);

  if (Array.isArray(env.ADMIN_EMAILS)) {
    for (const e of env.ADMIN_EMAILS) {
      const clean = e.trim().toLowerCase();
      if (clean) set.add(clean);
    }
  }

  for (const email of STATIC_AUTHORIZED_ADMIN_EMAILS) {
    set.add(email.trim().toLowerCase());
  }

  return Array.from(set);
}

/**
 * Verifies whether the provided email address corresponds to an authorized administrator.
 */
export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  const allAdmins = getAllAuthorizedAdminEmails();
  return allAdmins.includes(normalized);
}
