/**
 * Auth / portal session keys that must not survive logout or a new login.
 * Keep language and draft keys out of this list.
 */
export const AUTH_STORAGE_KEYS = [
  'user',
  'token',
  'userRole',
  'platform_active_context',
  'subscriber_token',
  'subscriber_user',
  'collector_token',
  'collector_user',
  'vf_collector_token',
  'vf_collector_user',
  'vf_collector_employee',
  'vf_collector_membership_id',
];

/** Remove all auth/session tokens so the next user cannot inherit the previous session. */
export const clearAllAuthStorage = () => {
  AUTH_STORAGE_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (_) {
      /* ignore storage errors */
    }
  });
};
