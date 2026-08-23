/**
 * Company membership used for chit receivables (User / Manager / Accountant / Collector).
 * Owner rows often use membershipId; staff rows use parent_membership_id.
 */
export const getChitCompanyMembershipId = (user) => {
  const accounts = user?.results?.userAccounts || user?.userAccounts || [];
  if (!accounts.length) return null;

  const preferred = accounts.find((account) => {
    const name = String(account.accountName || account.account_name || '').toLowerCase();
    return (
      name.includes('user')
      || name.includes('manager')
      || name.includes('accountant')
      || name.includes('collector')
    );
  }) || accounts[0];

  return (
    preferred?.parent_membership_id
    || preferred?.parentMembershipId
    || preferred?.membershipId
    || preferred?.membership_id
    || null
  );
};
